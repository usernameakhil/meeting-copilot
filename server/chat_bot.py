import os
import google.generativeai as genai
from vector_store import get_relevant_context


api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Please set it in your environment variables.")

genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    generation_config={
        "temperature": 0.2,
        "top_p": 0.95,
        "max_output_tokens": 1024,
    }
)

async def ask_meeting_ai(meeting_id, question):
    """
    Retrieves context from ChromaDB and generates a response using Gemini 1.5 Pro.
    """
    try:
        # 1. Get the most relevant snippets from ChromaDB
        context = get_relevant_context(meeting_id, question)
        
        if not context or context.strip() == "":
            context = "No relevant transcript snippets found for this specific query."

        # 2. Construct the Retrieval-Augmented Generation (RAG) Prompt
        prompt = f"""
        You are a highly capable AI Meeting Assistant. Your goal is to help the user understand 
        what happened in a specific meeting based on the provided transcript context.

        TRANSCRIPT CONTEXT:
        ---
        {context}
        ---

        USER QUESTION:
        {question}

        STRICT INSTRUCTIONS:
        1. Use ONLY the provided transcript context to answer the question.
        2. If the answer is not contained within the context, politely state: "I'm sorry, but that information wasn't discussed in this meeting."
        3. Do not use outside knowledge or make up facts.
        4. Keep your tone professional, concise, and helpful.
        5. Use bullet points if listing multiple items or action points.
        """

        # 3. Generate content asynchronously
        # We use await here because FastAPI calls this in an async route
        response = await model.generate_content_async(prompt)
        
        # 4. Return the cleaned text response
        if response.text:
            return response.text
        else:
            return "I processed the meeting data but couldn't generate a clear answer. Please try rephrasing."

    except Exception as e:
        print(f"🔴 Gemini Generation Error: {e}")
        return f"Error: I encountered a problem while analyzing the meeting data. ({str(e)})"