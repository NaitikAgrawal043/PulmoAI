/**
 * API SERVICE LAYER
 * Centralized API calls to backend server */

import axios from 'axios';

// Backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});


// PREDICTION API


/**
 * Upload CT scan image for analysis
 * @param {File} imageFile - CT scan image file
 * @param {Function} onUploadProgress - Progress callback
 * @returns {Promise} API response with prediction
 */
export const uploadCTScan = async (imageFile, onUploadProgress) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', imageFile);

    // Send POST request with file
    const response = await apiClient.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      }
    });

    return response.data;

  } catch (error) {
    console.error('Upload error:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get prediction history (optional feature)
 * @returns {Promise} List of previous predictions
 */
export const getPredictionHistory = async () => {
  try {
    const response = await apiClient.get('/predictions');
    return response.data;
  } catch (error) {
    console.error('History fetch error:', error);
    throw handleAPIError(error);
  }
};


// CHATBOT API


// Direct Python Medical-Chatbot service URL (from medical-chatbot folder)
const rawChatbotUrl = (
  process.env.REACT_APP_CHATBOT_URL ||
  process.env.REACT_APP_RAG_URL ||
  'http://localhost:5000'
).trim().replace(/\/+$/, '');
const CHATBOT_ASK_URL = rawChatbotUrl.endsWith('/ask') ? rawChatbotUrl : `${rawChatbotUrl}/ask`;

/**
 * Sends a query to the medical chatbot along with past conversation history.
 * Directly calls the Python medical-chatbot service in medical-chatbot folder.
 *
 * @name sendChatMessage
 * @function
 * @param {string} message - User's medical question
 * @param {Array<{ type: string, text: string }>} [history=[]] - Previous conversation turns
 * @returns {Promise<{ success: boolean, reply: string, engine: string }>} Server response
 */
export const sendChatMessage = async (message, history = []) => {
  try {
    // Clean and normalize past chat history turns
    const cleanHistory = (Array.isArray(history) ? history : [])
      .map(m => {
        if (!m || typeof m !== 'object') return null;
        const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'assistant';
        const content = (m.content || m.text || '').trim();
        // Skip empty turns and default welcome messages
        if (!content) return null;
        if (content.startsWith("Hello! I'm your MedPulse") || content.startsWith("Hello! I'm your Medical AI")) return null;
        return { role, content };
      })
      .filter(Boolean);

    // If the last message in history is the query being submitted now, exclude it
    // so history strictly contains the preceding conversation context
    const lastItem = cleanHistory[cleanHistory.length - 1];
    const previousHistory = (lastItem && lastItem.role === 'user' && lastItem.content === message.trim())
      ? cleanHistory.slice(0, -1)
      : cleanHistory;

    const payload = {
      query: message.trim(),
      message: message.trim(),
      history: previousHistory.slice(-10), // Keep last 10 conversation turns
    };

    // 1. Direct call to medical-chatbot service in medical-chatbot folder
    try {
      const directResponse = await axios.post(CHATBOT_ASK_URL, payload, {
        timeout: 90000,
        headers: { 'Content-Type': 'application/json' }
      });
      if (directResponse.data && (directResponse.data.answer || directResponse.data.reply)) {
        return {
          success: true,
          reply: directResponse.data.reply || directResponse.data.answer,
          engine: directResponse.data.engine || 'python-medical-rag'
        };
      }
    } catch (directError) {
      console.warn(`Direct connection to medical-chatbot (${CHATBOT_ASK_URL}) failed, trying backend fallback:`, directError.message);
    }

    // 2. Fallback via backend proxy if direct connection was unreachable
    const response = await apiClient.post('/chatbot', payload);
    return response.data;
  } catch (error) {
    console.error('Chatbot error:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get chatbot information
 * @returns {Promise} Chatbot capabilities
 */
export const getChatbotInfo = async () => {
  try {
    const response = await apiClient.get('/chatbot/info');
    return response.data;
  } catch (error) {
    console.error('Chatbot info error:', error);
    throw handleAPIError(error);
  }
};


// HEALTH CHECK


/**
 * Check if backend is running
 * @returns {Promise} Server health status
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw handleAPIError(error);
  }
};


// ERROR HANDLING


/**
 * Handle API errors and return user-friendly messages
 * @param {Error} error - Axios error object
 * @returns {Error} Formatted error
 */
const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message =
      error.response.data?.reply ||
      error.response.data?.message ||
      error.response.data?.error ||
      'Server error';
    return new Error(message);
  } else if (error.request) {
    // Request made but no response received
    return new Error('Cannot connect to server. Please check if backend is running.');
  } else {
    // Something else happened
    return new Error(error.message || 'An unexpected error occurred');
  }
};

// Export API client for direct use if needed
export default apiClient;
