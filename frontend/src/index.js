/**
 * PULMOAI - FRONTEND APPLICATION ENTRY POINT
 * Initializes React 18 Concurrent Root and mounts the root App component to the DOM.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
