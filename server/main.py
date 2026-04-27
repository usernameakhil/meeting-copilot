import os
import uvicorn
import asyncio
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel

# Internal Imports
from transcribe import transcribe_chunk
from vector_store import index_meeting
from chat_bot import ask_meeting_ai

app = FastAPI()

# Single worker for transcription to maintain order
executor = ThreadPoolExecutor(max_workers=1)

# Optimized CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class ChatRequest(BaseModel):
    meeting_id: str
    question: str

class IndexRequest(BaseModel):
    meeting_id: str
    transcript: str

# --- Endpoints ---

@app.post("/transcribe")
async def process_audio(file: UploadFile = File(...)):
    try:
        audio_data = await file.read()
        loop = asyncio.get_event_loop()
        transcript_text = await loop.run_in_executor(
            executor, 
            transcribe_chunk, 
            audio_data
        )
        return {"text": transcript_text}
    except Exception as e:
        print(f"🔴 Transcription Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/index-meeting")
@app.post("/index-meeting/")
async def save_to_vector_db(request: IndexRequest):
    """
    Called when a meeting finishes. It pushes the transcript to ChromaDB.
    Removed BackgroundTasks to ensure we catch errors during the indexing process.
    """
    print(f"🛠️ RECEIVED INDEX REQUEST for: {request.meeting_id}")
    print(f"📝 Transcript Preview: {request.transcript[:100]}...")
    
    try:
        # Run indexing synchronously so we can confirm success
        index_meeting(request.meeting_id, request.transcript)
        return {"message": f"Successfully indexed meeting {request.meeting_id}"}
    except Exception as e:
        print(f"❌ Indexing Failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/chat")
@app.post("/chat/")
async def chat_with_meeting(request: ChatRequest):
    """
    The RAG endpoint: ChromaDB Retrieval + Gemini Pro Generation.
    """
    print(f"📩 Received chat request for meeting: {request.meeting_id}")
    try:
        answer = await ask_meeting_ai(request.meeting_id, request.question)
        return {"answer": answer}
    except Exception as e:
        print(f"❌ Chat Logic Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Server Start ---
if __name__ == "__main__":
    # Ensure you have set export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python in your terminal
    uvicorn.run(app, host="127.0.0.1", port=8080)