/**
 * UPLOAD SECTION COMPONENT
 * CT scan image upload with drag-and-drop support and preview
 * Clean, professional medical interface */

import React, { useState, useRef, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 10;

const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Please upload a PNG or JPG image.';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
  }
  return null;
};

const UploadSection = ({ onUpload, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((file) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = () => {
    if (selectedFile && onUpload) {
      setUploadProgress(0);
      onUpload(selectedFile, (progress) => setUploadProgress(progress));
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-section">
      {/* Header */}
      <div className="upload-header">
        <div className="upload-header-badge">
          <span className="pulse-dot"></span>
          AI-Powered Analysis
        </div>
        <h2>CT Scan Analysis</h2>
        <p className="upload-subtitle">
          Upload a pulmonary CT scan image for intelligent nodule detection and comprehensive diagnostic analysis.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="upload-body">
        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="ct-scan-file-input"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <div className="drop-zone-empty">
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect width="64" height="64" rx="16" fill="rgba(102,126,234,0.1)" />
                  <path d="M32 20V44M20 32H44" stroke="#667eea" strokeWidth="3" strokeLinecap="round" />
                  <path d="M24 28L32 20L40 28" stroke="#667eea" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="drop-zone-title">
                {dragOver ? 'Drop your CT scan here' : 'Upload CT Scan Image'}
              </h3>
              <p className="drop-zone-hint">
                Drag & drop your image here, or <span className="browse-link">browse</span>
              </p>
              <p className="drop-zone-formats">
                Supported formats: PNG, JPG, JPEG · Max size: 10MB
              </p>
            </div>
          ) : (
            <div className="drop-zone-preview">
              <div className="preview-image-container">
                <img src={preview} alt="CT scan preview" className="preview-image" />
                <div className="preview-overlay">
                  <div className="preview-badge">
                    <span>✓</span> Image Ready
                  </div>
                </div>
              </div>
              <div className="file-info">
                <div className="file-info-icon">🩻</div>
                <div className="file-info-details">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-meta">
                    {formatFileSize(selectedFile.size)} · {selectedFile.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
                <button
                  className="clear-btn"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Info Panel */}
        <div className="upload-info-panel">
          <div className="info-panel-card">
            <div className="info-panel-icon">📋</div>
            <h4>How It Works</h4>
            <ol className="info-steps-list">
              <li>Upload a CT scan image (PNG or JPG)</li>
              <li>AI analyzes lung regions for nodules</li>
              <li>Get detailed diagnostic report</li>
              <li>Download report as PDF</li>
            </ol>
          </div>

          <div className="info-panel-card">
            <div className="info-panel-icon">🎯</div>
            <h4>Supported Inputs</h4>
            <div className="supported-formats">
              <div className="format-tag">PNG</div>
              <div className="format-tag">JPG</div>
              <div className="format-tag">JPEG</div>
            </div>
            <p className="format-note">Maximum file size: 10MB</p>
          </div>

          <div className="info-panel-card">
            <div className="info-panel-icon">⚡</div>
            <h4>Analysis Features</h4>
            <ul className="features-list">
              <li>Nodule detection & classification</li>
              <li>Risk level assessment</li>
              <li>Technical measurements</li>
              <li>Clinical recommendations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-container">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="progress-text">{uploadProgress}% uploaded</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="upload-actions">
        <button
          id="analyze-btn"
          className={`btn-analyze ${isLoading ? 'loading' : ''}`}
          onClick={handleAnalyze}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <span>🔬</span>
              <span>Analyze CT Scan</span>
            </>
          )}
        </button>

        {selectedFile && !isLoading && (
          <button className="btn-clear" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
