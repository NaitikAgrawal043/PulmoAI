# PulmoAI 🫁 — AI-Powered Pulmonary Nodule Detection & Clinical Decision Support

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/RAG%20Service-Python%203.10%2B-3776AB?logo=python&logoColor=white)](https://python.org/)
[![Gemini](https://img.shields.io/badge/Vision%20AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain-1C3C3C?logo=langchain&logoColor=white)](https://langchain.com/)
[![Pinecone](https://img.shields.io/badge/Vector%20DB-Pinecone-000000?logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![Groq](https://img.shields.io/badge/LLM%20Inference-Groq%20LLaMA%203-F05A28)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**PulmoAI** is an advanced full-stack medical intelligence platform designed to assist radiologists and clinicians in detecting, assessing, and monitoring **pulmonary nodules** from thoracic CT scans. Combining multimodal Vision AI with a Retrieval-Augmented Generation (RAG) conversational agent, PulmoAI delivers real-time radiological insights, risk stratification, clinical recommendations (Fleischner Society guidelines), and downloadable diagnostic reports.

---

## 🏗️ System Architecture

PulmoAI is designed as a distributed, decoupled three-tier microservice architecture:

```
                          ┌────────────────────────┐
                          │   PulmoAI Web Client   │
                          │     (React 18 UI)      │
                          │   http://localhost:3000│
                          └───────────┬────────────┘
                                      │
                         REST API     │  Uploads & Chat Queries
                                      ▼
                          ┌────────────────────────┐
                          │   PulmoAI Backend API  │
                          │   (Node.js / Express)  │
                          │   http://localhost:5001│
                          └──────┬──────────┬──────┘
                                 │          │
           Multimodal Vision     │          │  Delegated RAG Q&A
           Analysis              │          │  (Internal Microservice)
                                 ▼          ▼
             ┌──────────────────────┐   ┌───────────────────────────┐
             │  Google Gemini AI    │   │  Medical RAG Microservice │
             │  Vision Engine       │   │  (Python Flask Server)    │
             │                      │   │  http://localhost:5000    │
             └──────────────────────┘   └─────────────┬─────────────┘
                                                      │
                                                      ▼
                                        ┌───────────────────────────┐
                                        │  Pinecone Vector DB       │
                                        │  + Groq LLaMA 3 Engine    │
                                        │  (Medical Literature RAG) │
                                        └───────────────────────────┘
```

---

## ✨ Key Features

- **Multimodal CT Scan Analysis**: Upload chest CT scans in standard image formats (`PNG`, `JPEG`) as well as medical **DICOM** (`.dcm`) slices.
- **Deep Vision AI Inference**: Analyzes nodule presence, coordinates, size estimate, border characteristics (smooth, lobulated, spiculated), attenuation (solid, part-solid, ground-glass), and malignancy probability.
- **Fleischner Society Guidelines**: Automatically provides follow-up interval and clinical pathway recommendations based on patient risk criteria.
- **Dual-Engine Medical RAG Chatbot**:
  - Primary: Evidence-based document retrieval using **Pinecone** vector search over medical literature with **Groq LLaMA 3**.
  - Secondary / Multimodal: Fallback directly to **Google Gemini** with structured radiological guidelines.
- **Instant Diagnostic PDF Reports**: Generate structured clinical reports on demand using `jsPDF` with detailed findings, risk tier badges, and radiological impressions.
- **Modern Medical Dark Theme**: Intuitive glassmorphism interface, responsive layout, drag-and-drop file upload, real-time scan previews, and interactive diagnostic cards.

---

## 📁 Repository Structure

```
pulmoAi-main/
├── backend/                  # Node.js Express server
│   ├── routes/               # API route handlers (/predict, /chatbot)
│   │   ├── chatbot.js        # Medical chat orchestration & RAG delegation
│   │   └── prediction.js     # DICOM/image parsing & Gemini Vision calls
│   ├── utils/                # AI client helpers & image processors
│   │   └── geminiAI.js       # Vision model prompts & clinical parsers
│   ├── test-dicoms/          # Sample benign & malignant CT DICOM slices
│   ├── uploads/              # Temporary upload staging (git-ignored)
│   ├── server.js             # Express application entry point
│   ├── package.json          # Node dependencies
│   └── .env.example          # Backend configuration template
│
├── frontend/                 # React 18 single-page application
│   ├── public/               # Public assets & HTML template
│   ├── src/
│   │   ├── components/       # UI components (Upload, Results, Chat, Navbar)
│   │   ├── services/         # Axios API clients
│   │   ├── styles/           # Modern CSS & glassmorphic stylesheets
│   │   └── App.js            # Main dashboard state & orchestration
│   ├── package.json          # React dependencies
│   └── .env.example          # Frontend configuration template
│
├── medical-chatbot/          # Python Flask RAG microservice
│   ├── data/                 # Reference medical literature for embeddings
│   ├── src/                  # Helper utilities for embeddings & chains
│   │   └── helper.py         # Pinecone & Groq LLaMA LangChain pipeline
│   ├── templates/            # Standalone chat web view
│   ├── static/               # Chat styles & scripts
│   ├── app.py                # Flask server exposing /ask endpoint
│   ├── store_index.py        # Vector embedding generation script
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Python service configuration template
│
├── .gitignore                # Root git ignore rule set
└── README.md                 # Project documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js** v18 or later ([Download](https://nodejs.org/))
- **Python** 3.10 or later ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- Free API Keys:
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey)
  - [Groq Cloud API Key](https://console.groq.com/)
  - [Pinecone API Key](https://www.pinecone.io/)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/NaitikAgrawal043/PulmoAI.git
cd PulmoAI
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
PORT=5001
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
RAG_SERVICE_URL=http://localhost:5000/ask
```

#### Frontend (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env`:
```env
PORT=3000
BROWSER=none
REACT_APP_API_URL=http://localhost:5001/api
```

#### Medical Chatbot (`medical-chatbot/.env`):
```bash
cp medical-chatbot/.env.example medical-chatbot/.env
```
Edit `medical-chatbot/.env`:
```env
PINECONE_API_KEY=your_pinecone_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
SECRET_KEY=your_secret_key
```

---

### Step 3: Run the Services

Open three terminal windows (or use background processes):

#### Terminal 1 — Python RAG Chatbot Microservice
```bash
cd medical-chatbot
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*Running on `http://localhost:5000`*

#### Terminal 2 — Node.js Express Backend
```bash
cd backend
npm install
npm start
```
*Running on `http://localhost:5001`*

#### Terminal 3 — React Frontend Client
```bash
cd frontend
npm install
npm start
```
*Running on `http://localhost:3000`*

Once started, open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 API Reference

### Backend Endpoints (`http://localhost:5001`)

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning server status |
| `POST` | `/api/predict` | Multipart upload for CT scan image or DICOM file; returns AI diagnostic assessment |
| `POST` | `/api/chatbot` | Conversational interface; forwards to Python RAG service with Gemini fallback |
| `GET` | `/api/chatbot/info` | Returns information about active AI engines, capabilities, and clinical disclaimers |

### Python RAG Service (`http://localhost:5000`)

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Standalone chat interface |
| `POST` | `/ask` | JSON endpoint accepting `{ "query": "...", "history": [...] }` for Pinecone/Groq RAG |

---

## 🧪 Sample Test Data
Sample DICOM CT scans are included in `backend/test-dicoms/`:
- `backend/test-dicoms/benign/`: Cases with non-malignant radiological findings.
- `backend/test-dicoms/nodules/`: Cases with identifiable pulmonary nodules for testing model precision.

---

## ⚠️ Medical Disclaimer
PulmoAI is developed strictly for **educational, research, and diagnostic assistance** purposes. It is **not** a certified medical diagnostic device. All AI-generated outputs, predictions, and recommendations should be reviewed and verified by a qualified medical professional or certified radiologist before making any clinical decisions.

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).
