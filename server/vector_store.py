import os
import chromadb
import google.generativeai as genai
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

# Ensure the environment variable is set to avoid Protobuf conflicts
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# --- Configuration ---
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print(" ERROR: GEMINI_API_KEY not found in environment variables!")

genai.configure(api_key=api_key)

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        # Using the stable embedding model
        model_name = "models/gemini-embedding-001"
        try:
            # result is a dictionary containing 'embedding'
            result = genai.embed_content(
                model=model_name,
                content=list(input),
                task_type="retrieval_document"
            )
            embeddings = result.get("embedding", [])
            
            if not embeddings:
                print(f"⚠️ Warning: Gemini returned no embeddings for input: {input[:50]}...")
            
            return embeddings
        except Exception as e:
            print(f" Gemini Embedding API Error: {e}")
            return []

# --- Initialization ---
# Persist data in the local chroma_data folder
client = chromadb.PersistentClient(path="./chroma_data")
gemini_ef = GeminiEmbeddingFunction()

collection_name = "meeting_knowledge_v6"
collection = client.get_or_create_collection(
    name=collection_name, 
    embedding_function=gemini_ef
)


def index_meeting(meeting_id, transcript):
    """
    Splits the transcript into overlapping chunks and stores them in ChromaDB.
    """
    if not transcript or not transcript.strip():
        print(f"⚠️ Indexing skipped: Transcript for {meeting_id} is empty.")
        return
    
    try:
        # 1. Chunking Logic: 1000 characters with 200 character overlap
        # This ensures context isn't lost at the "cuts"
        chunk_size = 1000
        overlap = 200
        chunks = [transcript[i:i + chunk_size] for i in range(0, len(transcript), chunk_size - overlap)]

        # 2. Prepare Metadata and IDs
        ids = [f"{meeting_id}_{i}" for i in range(len(chunks))]
        metadatas = [{"meeting_id": meeting_id} for _ in chunks]

        # 3. Add to Collection
        collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        print(f"✅ SUCCESSFULLY INDEXED: {len(chunks)} chunks for {meeting_id}")
        print(f"📊 Current Brain Size: {collection.count()} total snippets stored.")

    except Exception as e:
        print(f"❌ Indexing Error for {meeting_id}: {e}")

def get_relevant_context(meeting_id, question):
    """
    Searches the vector database for the most relevant snippets based on the question.
    """
    print(f"🔍 Searching ChromaDB | Meeting: {meeting_id} | Question: {question}")
    
    try:
        # Search for top 5 most relevant snippets
        results = collection.query(
            query_texts=[question],
            n_results=5,
            where={"meeting_id": meeting_id}
        )
        
        # results['documents'] is a list of lists [[doc1, doc2...]]
        docs = results.get('documents', [[]])[0]
        
        if not docs:
            print(f"⚠️ WARNING: No context found for {meeting_id}. Is it indexed?")
            return ""

        print(f"📈 Found {len(docs)} relevant snippets for the AI.")
        return "\n\n".join(docs)
        
    except Exception as e:
        print(f"Retrieval Error: {e}")
        return ""