# PulmoAI — Medical RAG Chatbot Microservice

A specialized clinical conversational AI engine powered by **Retrieval-Augmented Generation (RAG)**, **Pinecone Vector Database**, **LangChain**, and **Groq LLaMA 3**.

This microservice provides evidence-based medical Q&A and radiological interpretation support to the **PulmoAI** ecosystem.

---

## 🌟 Features

- **Evidence-Based Clinical Retrieval**: Utilizes a medical literature knowledge base indexed into Pinecone vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`).
- **High-Speed Inference**: Powered by Groq's LLaMA 3 for rapid, low-latency clinical conversational turns.
- **Context-Aware Multi-turn Dialogue**: Ingests chat history alongside current user questions for coherent clinical consultations.
- **Seamless Microservice API**: Provides a dedicated `/ask` JSON endpoint consumed directly by the PulmoAI Express backend.

---

## 🛠️ Tech Stack

- **Framework**: Python 3.10+ / Flask
- **LLM Engine**: Groq Cloud (LLaMA 3 70B / 8B)
- **Vector Database**: Pinecone Serverless
- **Embeddings**: HuggingFace (`sentence-transformers/all-MiniLM-L6-v2`)
- **Orchestration**: LangChain RAG pipeline

---

## 🚀 Setup & Installation

### 1. Create Virtual Environment
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your credentials:
```env
PINECONE_API_KEY=your_pinecone_api_key
GROQ_API_KEY=your_groq_api_key
PORT=5000
SECRET_KEY=dev-secret-key
```

### 4. Populate Pinecone Vector Store (First Run Only)
If your Pinecone index is not yet initialized, run:
```bash
python store_index.py
```

### 5. Start the Microservice
```bash
python app.py
```
The server will start on `http://localhost:5000`.

---

## 📡 API Endpoints

### `POST /ask`
Submit a question with prior conversation context.

**Request Body:**
```json
{
  "query": "What are the Fleischner Society criteria for a 6mm solid nodule?",
  "history": [
    { "role": "user", "content": "I have a small nodule on my CT." },
    { "role": "assistant", "content": "Could you provide its size and characteristics?" }
  ]
}
```

**Response:**
```json
{
  "answer": "According to Fleischner Society guidelines, a 6mm solid nodule in a low-risk patient typically warrants a follow-up low-dose CT scan in 6 to 12 months..."
}
```

---

## 📄 License
MIT License
