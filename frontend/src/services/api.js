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


/**
 * Send message to chatbot
 * @param {string} message - User's question
 * @returns {Promise} Chatbot response
 */
/**
 * Send message to chatbot with conversation history for context
 * @param {string} message - User's question
 * @param {Array} history - Previous conversation turns [{role, text}]
 * @returns {Promise} Chatbot response
 */
export const sendChatMessage = async (message, history = []) => {
  try {
    // Convert history to the format Gemini expects (alternating user/model roles)
    const geminiHistory = history
      .filter(m => m.type === 'user' || m.type === 'bot')
      .slice(-10) // Keep last 10 messages for context window
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        text: m.text,
      }));

    const response = await apiClient.post('/chatbot', {
      message,
      history: geminiHistory,
    });
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
    const message = error.response.data?.message || error.response.data?.error || 'Server error';
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
