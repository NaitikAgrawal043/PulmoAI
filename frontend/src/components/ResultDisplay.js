/**
 * RESULT DISPLAY COMPONENT
 * Shows AI prediction results with detailed analysis and PDF export */

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResultDisplay = ({ result, imagePath }) => {
  if (!result) return null;

  const { prediction } = result;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#d32f2f';
      case 'low': return '#388e3c';
      case 'none': return '#1976d2';
      default: return '#757575';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '🔴';
      case 'low': return '🟡';
      case 'none': return '🟢';
      default: return '⚪';
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date(prediction.timestamp).toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 33, 33);
    doc.text('PulmoAI Diagnostic Report', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${date}`, 14, 30);
    doc.text(`Report ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 14, 35);

    doc.line(14, 40, 196, 40); // Divider

    // Diagnosis Section
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text('Clinical Diagnosis', 14, 52);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Result: ${prediction.result}`, 14, 62);
    doc.text(`Confidence Level: ${prediction.confidence}%`, 14, 70);
    doc.text(`Risk Level: ${prediction.riskLevel.toUpperCase()}`, 14, 78);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const splitDesc = doc.splitTextToSize(`Description: ${prediction.description}`, 180);
    doc.text(splitDesc, 14, 88);

    // Technical Details
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text('Technical Details', 14, 115);

    autoTable(doc, {
      startY: 120,
      head: [['Parameter', 'Value']],
      body: [
        ['Nodule Size', prediction.technicalDetails.noduleSize],
        ['Location', prediction.technicalDetails.location],
        ['Shape', prediction.technicalDetails.shape],
        ['Density', prediction.technicalDetails.density],
        ['Image Quality', prediction.imageQuality || 'N/A'],
        ['Analysis Engine', prediction.analysisEngine || 'Gemini Vision AI']
      ],
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] }
    });

    // Recommendations (Prescription Format)
    doc.setFontSize(16);
    doc.setTextColor(33, 33, 33);
    doc.text('Rx / Clinical Recommendations', 14, doc.lastAutoTable.finalY + 15);

    const recs = prediction.recommendations.map(r => [r.replace(/[📋💊🔬👨‍⚕️🏥📅⚠️✅]/g, '').trim()]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Recommended Action Plan']],
      body: recs,
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] }
    });

    // Footer signature
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(140, finalY, 190, finalY);
    doc.setFontSize(10);
    doc.text('Authorized Digital Signature', 142, finalY + 5);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="result-section">
      <div className="result-header-bar">
        <h2>Analysis Results</h2>
        <button className="btn-download-pdf" onClick={generatePDF}>
          <span>📄</span> Download PDF Report
        </button>
      </div>

      <div className="result-container nested-structure">
        {/* Left Column: Image and Findings */}
        <div className="result-column-left">
          <div className="result-card image-card">
            <h3>Analyzed CT Scan</h3>
            <div className="image-wrapper">
              <img
                src={`http://localhost:5001${imagePath}`}
                alt="Analyzed CT Scan"
                className="ct-scan-image"
              />
            </div>
          </div>

          {prediction.findings && (
            <div className="result-card findings-card">
              <h4>🔍 Radiological Findings</h4>
              <p className="findings-text">{prediction.findings}</p>
            </div>
          )}
        </div>

        {/* Right Column: Structured Data */}
        <div className="result-column-right">
          {/* Main Result */}
          <div className="result-card main-result gradient-border">
            <div className="result-header">
              <h3>Classification Result</h3>
              <span className="risk-badge" style={{ backgroundColor: getRiskColor(prediction.riskLevel) }}>
                {getRiskIcon(prediction.riskLevel)} {prediction.riskLevel.toUpperCase()} RISK
              </span>
            </div>

            <div className="result-diagnosis">
              <p className="diagnosis-text">{prediction.result}</p>
              <div className="confidence-meter">
                <div className="confidence-label">
                  <span>AI Confidence Level</span>
                  <strong>{prediction.confidence}%</strong>
                </div>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{
                      width: `${prediction.confidence}%`,
                      backgroundColor: getRiskColor(prediction.riskLevel)
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="result-description">{prediction.description}</p>
          </div>

          <div className="grid-2-col">
            {/* Technical Details */}
            <div className="result-card details-card">
              <h4>Technical Measurements</h4>
              <ul className="details-list">
                <li>
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{prediction.technicalDetails.noduleSize}</span>
                </li>
                <li>
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{prediction.technicalDetails.location}</span>
                </li>
                <li>
                  <span className="detail-label">Shape</span>
                  <span className="detail-value">{prediction.technicalDetails.shape}</span>
                </li>
                <li>
                  <span className="detail-label">Density</span>
                  <span className="detail-value">{prediction.technicalDetails.density}</span>
                </li>
              </ul>
            </div>

            {/* Analysis Info */}
            <div className="result-card info-card">
              <h4>Report Metadata</h4>
              <ul className="details-list">
                <li>
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{new Date(prediction.timestamp).toLocaleDateString()}</span>
                </li>
                <li>
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{new Date(prediction.timestamp).toLocaleTimeString()}</span>
                </li>
                <li>
                  <span className="detail-label">Quality</span>
                  <span className="detail-value">{prediction.imageQuality}</span>
                </li>
                <li>
                  <span className="detail-label">Engine</span>
                  <span className="detail-value">{prediction.analysisEngine || 'Gemini Vision AI'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Rx / Recommendations structured as Prescription */}
          <div className="result-card prescription-card">
            <h4><span className="rx-symbol">Rx</span> Clinical Recommendations</h4>
            <div className="prescription-content">
              <ol className="prescription-list">
                {prediction.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation.replace(/[📋💊🔬👨‍⚕️🏥📅⚠️✅]/g, '').trim()}</li>
                ))}
              </ol>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
