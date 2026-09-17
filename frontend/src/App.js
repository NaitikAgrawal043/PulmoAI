/**
 * MAIN APP COMPONENT
 * Root component managing application state and layout */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import UploadSection from './components/UploadSection';
import ResultDisplay from './components/ResultDisplay';
import Chatbot from './components/Chatbot';
import { uploadCTScan, checkHealth } from './services/api';
import './styles/ModernApp.css';


// ERROR CARD — shows smart error messages


/**
 * Classifies an error message into a structured error category for actionable user remediation.
 *
 * @name classifyError
 * @function
 * @param {string} msg - Raw error message received from API or browser
 * @returns {'rateLimit' | 'noApiKey' | 'badApiKey' | 'generic'} Categorized error type
 */
function classifyError(msg) {
  if (!msg) return 'generic';
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('quota') || m.includes('wait 60') || m.includes('429'))
    return 'rateLimit';
  if (m.includes('not configured') || m.includes('api key') || m.includes('gemini_api_key'))
    return 'noApiKey';
  if (m.includes('invalid') && m.includes('key'))
    return 'badApiKey';
  return 'generic';
}

/**
 * Renders an informative, actionable alert card explaining API key or rate limit errors.
 *
 * @name ErrorCard
 * @component
 * @param {{ message: string }} props - Component props containing error message
 * @returns {JSX.Element} Structured error card with troubleshooting instructions
 */
function ErrorCard({ message }) {
  const type = classifyError(message);

  if (type === 'rateLimit') {
    return (
      <div className="error-card rate-limit-card">
        <div className="error-card-icon">⏱️</div>
        <div className="error-card-body">
          <h4>Rate Limit Reached — Please Wait</h4>
          <p>The free Gemini AI tier allows <strong>15 requests per minute</strong>. Too many uploads in a short time exhausted the quota.</p>
          <p className="error-action">✅ <strong>Wait 60 seconds</strong>, then upload your image again.</p>
        </div>
      </div>
    );
  }

  if (type === 'noApiKey') {
    return (
      <div className="error-card config-card">
        <div className="error-card-icon">🔑</div>
        <div className="error-card-body">
          <h4>Gemini API Key Not Configured</h4>
          <p>The backend needs a free Google Gemini API key to run real AI analysis.</p>
          <ol className="error-steps">
            <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com/app/apikey</a></li>
            <li>Sign in &amp; click <strong>"Create API key"</strong></li>
            <li>Open <code>backend/.env</code> and replace <code>YOUR_GEMINI_API_KEY_HERE</code> with your key</li>
            <li>Restart the backend: <code>npm start</code></li>
          </ol>
        </div>
      </div>
    );
  }

  if (type === 'badApiKey') {
    return (
      <div className="error-card config-card">
        <div className="error-card-icon">❌</div>
        <div className="error-card-body">
          <h4>Invalid API Key</h4>
          <p>The Gemini API key in <code>backend/.env</code> is not valid.</p>
          <p className="error-action">Get a new free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com/app/apikey</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="error-card generic-card">
      <div className="error-card-icon">⚠️</div>
      <div className="error-card-body">
        <h4>Analysis Failed</h4>
        <p>{message}</p>
      </div>
    </div>
  );
}


// MAIN APP


/**
 * PulmoAI Root Application Component.
 * Manages global application state including navigation, CT scan upload results,
 * loading indicators, theme toggles, and backend health status.
 *
 * @name App
 * @component
 * @returns {JSX.Element} Rendered application shell
 */
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pulmoai_theme') || 'light';
  });

  // Sync theme with HTML data-theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulmoai_theme', theme);
  }, [theme]);

  /**
   * Toggles interface appearance between light mode and dark mode.
   */
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Perform initial health check on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Pings the backend health endpoint to detect if Node.js server is online.
   */
  const checkBackendHealth = async () => {
    try {
      await checkHealth();
      setBackendStatus('online');
    } catch (e) {
      setBackendStatus('offline');
    }
  };

  /**
   * Handles top-level page routing between 'home', 'scan', and 'results'.
   * Resets active errors upon navigation.
   *
   * @param {'home' | 'scan' | 'results'} page - Target page name
   */
  const handleNavigate = (page) => {
    setCurrentPage(page);
    setResult(null);
    setError(null);
  };

  /**
   * Orchestrates CT scan image upload, tracking upload progress,
   * triggering Vision AI analysis, and transitioning to results view.
   *
   * @param {File} file - Selected CT scan or DICOM image file
   * @param {Function} onProgress - Percentage completion callback (0-100)
   */
  const handleUpload = async (file, onProgress) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await uploadCTScan(file, onProgress);
      setResult(response);
      setCurrentPage('results'); // switch to new results page automatically
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <Navbar 
        onNavigate={handleNavigate} 
        currentPage={currentPage} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
      />

      {backendStatus === 'offline' && (
        <div className="status-banner error">
          ❌ Backend not responding — run <code>npm start</code> in the <code>backend/</code> folder (port 5001).
        </div>
      )}

      <main className="main-content">
        {currentPage === 'home' && <LandingPage onNavigate={handleNavigate} />}

        {currentPage === 'scan' && (
          <div className="container">
            <UploadSection onUpload={handleUpload} isLoading={isLoading} />
            {error && <ErrorCard message={error} />}
          </div>
        )}

        {currentPage === 'results' && (
          <div className="container">
            {result ? (
              <ResultDisplay result={result} imagePath={result.imagePath} />
            ) : (
              <div className="status-banner error">No results available. Please upload a scan first.</div>
            )}
          </div>
        )}
      </main>

      <Chatbot analysisResult={result} />
    </div>
  );
}

export default App;
