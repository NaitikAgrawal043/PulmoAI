"""
Medical Chatbot — Flask Web App
CT Scan & Pulmonary Nodule Detection Specialist
Backend powered by Pinecone + Groq LLaMA + LangChain
"""

import os
import traceback
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# ── Load environment variables ─────────────────────────────────────
load_dotenv()

# ── Import your existing helper functions ──────────────────────────
from src.helper import (
    download_embeddings,
    setup_pinecone,
    load_llm,
    create_rag_chain
)

# ── Flask App Setup ─────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

@app.after_request
def add_cors_headers(response):
    """Enable CORS for React frontend direct communication."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

# ── Load AI Components ONCE (same as CLI initialization) ───────────
print("[*] Initializing Medical AI System...")

print("[*] Loading embedding model...")
embedding = download_embeddings()

print("[*] Connecting to Pinecone...")
vector_store = setup_pinecone(
    index_name="medical-chatbot",
    embedding=embedding
)

print("[*] Loading LLM (Groq)...")
llm = load_llm()

print("[*] Building RAG chain...")
rag_chain = create_rag_chain(vector_store, llm)

print("[OK] Medical AI System Ready.\n")


# ── Routes ──────────────────────────────────────────────────────────

@app.route("/", methods=["GET", "POST", "OPTIONS"])
def home():
    """
    Renders the standalone web chat interface on GET.
    If called via POST, delegates to ask() to prevent 405 errors.

    Returns:
        str or flask.Response: Rendered HTML template or JSON answer.
    """
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "POST":
        return ask()
    return render_template("index.html")


@app.route("/ask", methods=["POST", "OPTIONS"])
@app.route("/api/chatbot", methods=["POST", "OPTIONS"])
@app.route("/chatbot", methods=["POST", "OPTIONS"])
def ask():
    """
    Handles incoming conversational queries via HTTP POST.
    Supports both direct calls from React frontend and proxied calls from Node backend.
    
    Expects a JSON body containing:
        - query / message (str): The user's input question.
        - history (list of dict, optional): Past turns [{"role": "user"|"assistant", "content": "..."}].

    Returns:
        tuple[flask.Response, int]: JSON response with answer, reply, and HTTP status code.
    """
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        user_query = (data.get("query") or data.get("message") or "").strip()
        history = data.get("history", [])  # list of {role, content} dicts

        if not user_query:
            return jsonify({"answer": "Please enter a valid query.", "reply": "Please enter a valid query."}), 400

        # Build a readable conversation history string for the prompt
        history_text = ""
        for turn in history:
            if not isinstance(turn, dict):
                continue
            role = str(turn.get("role", turn.get("type", "user"))).lower()
            role_label = "User" if role in ["user", "human"] else "Assistant"
            content = turn.get("content") or turn.get("text") or ""
            if content and str(content).strip():
                history_text += f"{role_label}: {str(content).strip()}\n"

        # Invoke RAG chain with history context
        response = rag_chain.invoke({
            "input": user_query,
            "chat_history": history_text.strip()
        })
        answer = response.get("answer", "No response generated.")

        return jsonify({
            "success": True,
            "answer": answer,
            "reply": answer,
            "engine": "python-medical-rag"
        })

    except Exception as e:
        # Print full traceback so it appears in server logs
        print("=== /ask ERROR ===")
        traceback.print_exc()
        print("=== ERROR MSG ===", str(e))
        return jsonify({
            "success": False,
            "answer": f"An internal server error occurred: {str(e)}",
            "reply": f"An internal server error occurred: {str(e)}",
            "error": str(e)
        }), 500


# ── Run App ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)