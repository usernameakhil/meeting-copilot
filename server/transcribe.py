import os
import io
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_chunk(audio_bytes: bytes):
    if len(audio_bytes) < 5000: 
        return ""

    try:
        
        audio_file = ("meeting_chunk.webm", io.BytesIO(audio_bytes), "audio/webm")
        
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo", 
            response_format="text",         
            language="en"                 
        )
        
        return transcription.strip()
    except Exception as e:
        print(f"Groq Error: {str(e)}")
        return ""