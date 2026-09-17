/**
 * PULMONARY NODULE DETECTION - BACKEND SERVER
 * Main server file for the medical AI application
 * Powered by Google Gemini Vision AI */

// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const predictionRoutes = require('./routes/prediction');
const chatbotRoutes = require('./routes/chatbot');

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';


// MIDDLEWARE CONFIGURATION


// Enable CORS for frontend communication
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Request logging middleware: Logs incoming HTTP method, URL path, and ISO timestamp.
 * Useful for debugging and tracking API traffic in production.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});


// ROUTES


/**
 * GET /api/health
 * Server health check endpoint.
 * Returns basic uptime and availability status for monitoring tools.
 *
 * @name getHealth
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Pulmonary Nodule Detection API is running',
    timestamp: new Date().toISOString()
  });
});

// Prediction routes (CT scan analysis & history)
app.use('/api', predictionRoutes);

// Chatbot routes (medical Q&A via RAG & Gemini)
app.use('/api', chatbotRoutes);

/**
 * 404 Catch-all handler for undefined endpoints.
 * Catches any HTTP requests that do not match configured routes.
 *
 * @name notFoundHandler
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The endpoint ${req.path} does not exist`
  });
});


// ERROR HANDLING MIDDLEWARE


/**
 * Global application error handling middleware.
 * Intercepts unhandled errors thrown in route handlers and formats a clean JSON error response.
 *
 * @name errorHandler
 * @function
 * @param {Error} err - The error object thrown
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 */
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});


// START SERVER


/**
 * Starts the HTTP server on the configured port.
 */
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   PULMONARY NODULE DETECTION - BACKEND SERVER             ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║   Status: Running on http://localhost:${PORT}              ║`);
  console.log('║   Environment: Development                                 ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║   Available Endpoints:                                     ║');
  console.log('║   - GET  /api/health        (Health check)                 ║');
  console.log('║   - POST /api/predict       (CT scan analysis)             ║');
  console.log('║   - POST /api/chatbot       (Medical chatbot)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
});

/**
 * Handle SIGTERM signal for graceful container/process shutdown.
 */
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

/**
 * Handle SIGINT (Ctrl+C) signal for graceful terminal shutdown.
 */
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
