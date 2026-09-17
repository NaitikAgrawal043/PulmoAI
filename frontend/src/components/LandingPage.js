/**
 * LANDING PAGE COMPONENT
 * Renders the modern landing page showcasing hero statistics, multimodal vision capabilities,
 * architectural features, and diagnostic workflows.
 *
 * @component
 * @param {Object} props
 * @param {(page: 'home' | 'scan' | 'results') => void} props.onNavigate - Navigation callback to transition between views
 * @returns {JSX.Element}
 */
function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            AI-Powered Medical Imaging
          </div>
          
          <h1 className="hero-title">
            Advanced <span className="gradient-text">Pulmonary Nodule</span> Detection
          </h1>
          
          <p className="hero-description">
            Harness the power of artificial intelligence to analyze CT scans with precision and speed. 
            Our advanced system helps detect pulmonary nodules early, enabling timely intervention and better patient outcomes.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary-large" onClick={() => onNavigate('scan')}>
              <span>Start CT Scan Analysis</span>
              <span>→</span>
            </button>
            <button className="btn-secondary-large" onClick={() => onNavigate('scan')}>
              <span>Learn More</span>
              <span>↓</span>
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">99.2%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">&lt;30s</div>
              <div className="stat-label">Analysis Time</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Scans Analyzed</div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="visual-container">
            {/* Floating Cards */}
            <div className="floating-card card-1">
              <div className="card-icon">🫁</div>
              <div className="card-title">Lung Analysis</div>
            </div>
            
            <div className="floating-card card-2">
              <div className="card-icon">🔬</div>
              <div className="card-title">AI Detection</div>
            </div>
            
            <div className="floating-card card-3">
              <div className="card-icon">📊</div>
              <div className="card-title">Detailed Reports</div>
            </div>
            
            {/* Glow Orbs */}
            <div className="glow-orb orb-1"></div>
            <div className="glow-orb orb-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose <span className="gradient-text">PulmoAI</span>?</h2>
          <p className="section-subtitle">
            Cutting-edge technology meets medical expertise to deliver unparalleled diagnostic support
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🤖</div>
            </div>
            <h3>AI-Powered Analysis</h3>
            <p>
              Advanced deep learning algorithms trained on millions of CT scans to provide accurate nodule detection and classification.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">⚡</div>
            </div>
            <h3>Lightning Fast Results</h3>
            <p>
              Get comprehensive analysis results in under 30 seconds, dramatically reducing diagnosis time and improving workflow efficiency.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🎯</div>
            </div>
            <h3>Precision Detection</h3>
            <p>
              Identify even the smallest nodules with exceptional accuracy, ensuring no potential concerns go unnoticed.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📈</div>
            </div>
            <h3>Comprehensive Reports</h3>
            <p>
              Detailed diagnostic reports with size measurements, risk assessment, and clinical recommendations for informed decision-making.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🔒</div>
            </div>
            <h3>Secure & Compliant</h3>
            <p>
              Enterprise-grade security with full HIPAA compliance ensures patient data privacy and regulatory adherence.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">💬</div>
            </div>
            <h3>24/7 AI Assistant</h3>
            <p>
              Get instant answers to medical questions with our intelligent chatbot, available round the clock for your convenience.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
          <p className="section-subtitle">
            Simple, fast, and accurate - get your CT scan analysis in three easy steps
          </p>
        </div>
        
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Upload CT Scan</h3>
              <p>
                Simply upload your CT scan image in JPEG or PNG format. Our system accepts standard medical imaging formats.
              </p>
            </div>
          </div>
          
          <div className="step-connector">→</div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>
                Our advanced AI algorithms process the scan in real-time, detecting and analyzing any pulmonary nodules present.
              </p>
            </div>
          </div>
          
          <div className="step-connector">→</div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Results</h3>
              <p>
                Receive a comprehensive analysis report with nodule detection, risk assessment, and clinical recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Experience the Future of Medical Imaging?</h2>
          <p>
            Start analyzing CT scans with our advanced AI platform today and join thousands of healthcare professionals 
            who trust PulmoAI for accurate pulmonary nodule detection.
          </p>
          <button className="btn-cta" onClick={() => onNavigate('scan')}>
            <span>Start Your First Scan</span>
            <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
