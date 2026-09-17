/**
 * CHATBOT ROUTES
 * Intelligent medical chatbot powered by Google Gemini AI.
 *
 * Uses Gemini 1.5 Flash (FREE tier):
 *   - 15 req/min, 1,500 req/day, 1M tokens/month
 *   - Falls back to rule-based responses if API key is missing */

const express = require('express');
const axios = require('axios');
const { getChatbotResponse } = require('../utils/geminiAI');

const router = express.Router();
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:5000/ask';

// ==========================================
// RULE-BASED FALLBACK KNOWLEDGE BASE
// (used when Gemini API is unavailable)
// ==========================================

const knowledgeBase = [
  {
    keywords: ['what is', 'lung nodule', 'pulmonary nodule'],
    response:
      'A lung nodule (or pulmonary nodule) is a small, round or oval-shaped growth in the lung. ' +
      'Most lung nodules are benign (non-cancerous), but some can be malignant. They are typically ' +
      'detected on chest X-rays or CT scans and are usually smaller than 3 cm in diameter.',
  },
  {
    keywords: ['benign', 'non-cancerous', 'not cancer'],
    response:
      'Benign means non-cancerous. A benign nodule will not spread to other parts of the body. ' +
      'However, it still requires monitoring through regular follow-up scans. Common causes include ' +
      'old infections, inflammation, or harmless growths. Your doctor will recommend a monitoring schedule.',
  },
  {
    keywords: ['malignant', 'cancerous', 'cancer', 'lung cancer'],
    response:
      'Malignant means cancerous. A malignant nodule has the potential to spread to other parts of the body. ' +
      'If detected, further diagnostic tests such as biopsy, PET scan, or additional imaging will be needed. ' +
      'Early detection significantly improves treatment outcomes. Please consult an oncologist immediately.',
  },
  {
    keywords: ['causes', 'why', 'risk factors', 'smoking'],
    response:
      'Lung nodules can be caused by various factors including: smoking (primary risk factor), ' +
      'exposure to asbestos or radon, previous lung infections (tuberculosis, fungal infections), ' +
      'inflammation, scar tissue, or benign tumors.',
  },
  {
    keywords: ['symptoms', 'signs', 'feel', 'pain'],
    response:
      'Most small lung nodules cause NO symptoms and are found incidentally during imaging for other reasons. ' +
      'Larger nodules or cancerous ones may cause: persistent cough, coughing up blood, chest pain, ' +
      'shortness of breath, unexplained weight loss, or fatigue.',
  },
  {
    keywords: ['treatment', 'cure', 'therapy', 'surgery'],
    response:
      'Treatment depends on the nodule characteristics:\n\n' +
      '• Benign small nodules: Regular monitoring with CT scans\n' +
      '• Suspicious nodules: May require biopsy or PET scan\n' +
      '• Malignant nodules: Surgery, radiation, chemotherapy, or targeted therapy',
  },
  {
    keywords: ['ct scan', 'x-ray', 'imaging'],
    response:
      'A CT scan uses X-rays to create detailed cross-sectional images of your lungs. ' +
      'It can detect nodules as small as 1-2mm. The scan is painless and typically takes 5-10 minutes.',
  },
  {
    keywords: ['hello', 'hi', 'hey'],
    response:
      "Hello! I'm your AI Medical Assistant powered by Google Gemini. " +
      'I can answer questions about pulmonary nodules, CT scans, treatment options, and more. ' +
      'How can I help you today?',
  },
];

const defaultFallbackResponse =
  "I'm sorry, I couldn't process that with the AI engine right now. " +
  'Please ask about lung nodules, symptoms, treatments, CT scans, or prevention strategies.';

/**
 * Retrieves a rule-based clinical canned answer matching user keywords.
 * Serves as an offline safeguard when neither the Python RAG microservice nor the Gemini API are reachable.
 *
 * @name getRuleBasedResponse
 * @function
 * @param {string} message - Raw question asked by the user
 * @returns {string} Curated clinical response or default assistance disclaimer
 */
function getRuleBasedResponse(message) {
  const lower = message.toLowerCase().trim();
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return entry.response;
    }
  }
  return defaultFallbackResponse;
}


// CHATBOT ENDPOINT


/**
 * POST /api/chatbot
 * Handles conversational medical inquiries using a 3-tier fallback pipeline:
 *  1. Microservice Query: Calls the local Python LangChain + Pinecone RAG microservice.
 *  2. Cloud AI Fallback: Invokes Google Gemini Vision/Text with medical system instructions.
 *  3. Rule-Based Fallback: Matches keywords against offline clinical knowledgebase entries.
 *
 * @name handleChatMessage
 * @function
 * @param {import('express').Request} req - Express request containing { message: string, history: Array }
 * @param {import('express').Response} res - Express response with { success: boolean, reply: string, engine: string }
 * @returns {Promise<void>}
 */
router.post('/chatbot', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No message provided',
        reply: 'Please send a message.',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long',
        reply: 'Please keep your question under 1000 characters.',
      });
    }

    console.log(`💬 Chatbot question: "${message.substring(0, 60)}..."`);

    let reply;
    let engine;

    // 1. Attempt retrieval from Python Medical-Chatbot RAG service (Pinecone / LangChain)
    let ragSuccess = false;
    try {
      const formattedHistory = (history || []).map(h => ({
        role: h.type === 'user' || h.role === 'user' ? 'user' : 'assistant',
        content: h.text || h.content || ''
      }));

      const ragResponse = await axios.post(
        RAG_SERVICE_URL,
        { query: message, history: formattedHistory },
        { timeout: 3500 }
      );

      if (ragResponse.data && ragResponse.data.answer) {
        reply = ragResponse.data.answer;
        engine = 'python-medical-rag';
        ragSuccess = true;
        console.log('✅ Response generated via Python Medical RAG service');
      }
    } catch (_) {
      // Python RAG service is not running or timed out; continue to Gemini RAG
    }

    // 2. Fall back to Google Gemini with Medical-Chatbot literature guidelines
    if (!ragSuccess) {
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
        try {
          reply = await getChatbotResponse(message, history);
          engine = 'gemini-medical-rag';
          console.log('✅ Gemini Medical RAG response generated');
        } catch (aiError) {
          console.warn('⚠️ Gemini chatbot error, falling back to rule-based:', aiError.message);
          reply = getRuleBasedResponse(message);
          engine = 'rule-based';
        }
      } else {
        reply = getRuleBasedResponse(message);
        engine = 'rule-based';
        console.log('ℹ️  Using rule-based chatbot (no GEMINI_API_KEY set)');
      }
    }

    res.json({
      success: true,
      reply,
      engine,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Chatbot error',
      reply: "I'm having trouble processing your request. Please try again.",
    });
  }
});


// CHATBOT INFO


/**
 * GET /api/chatbot/info
 * Returns metadata detailing active AI capabilities, service configuration, and legal disclaimers.
 *
 * @name getChatbotInfo
 * @function
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response describing engine configuration
 * @returns {void}
 */
router.get('/chatbot/info', (req, res) => {
  const hasApiKey =
    !!process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';

  res.json({
    success: true,
    info: {
      name: 'MedPulse Medical RAG Assistant',
      version: '3.0.0',
      engine: 'Medical-Chatbot RAG (Pinecone / LangChain / Gemini)',
      apiConfigured: hasApiKey,
      ragServiceUrl: RAG_SERVICE_URL,
      capabilities: [
        'Evidence-based Q&A from Medical Literature',
        'CT Scan & Pulmonary Nodule Explanations',
        'Radiological Findings Interpretation',
        'Context-aware Multi-turn Conversations',
        'Clinical Recommendations and Follow-up Pathways'
      ],
      disclaimer: 'Educational and clinical diagnostic support only. Consult a physician for definitive diagnosis.'
    },
  });
});

module.exports = router;
