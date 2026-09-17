/**
 * NAVBAR COMPONENT
 * Renders the top sticky glassmorphic navigation bar with logo, page links,
 * smooth section scrolling, dark/light theme switch, and mobile drawer.
 *
 * @component
 * @param {Object} props
 * @param {string} props.currentPage - Name of the active route ('home' | 'scan' | 'results')
 * @param {(page: string) => void} props.onNavigate - Page change handler
 * @param {'light' | 'dark'} props.theme - Active visual theme
 * @param {() => void} props.onToggleTheme - Callback toggling light/dark mode
 * @returns {JSX.Element}
 */
import React, { useState, useEffect } from 'react';

const Navbar = ({ currentPage, onNavigate, theme, onToggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll position to apply elevated blurred header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Smoothly scrolls to a landing page section (e.g. features, how-it-works).
   * Switches to 'home' page first if the user is currently on scan/results.
   *
   * @param {string} selector - CSS selector of the destination element
   */
  const scrollToSection = (selector) => {
    setMobileMenuOpen(false);
    if (currentPage !== 'home') {
      onNavigate('home');
      setTimeout(() => {
        const section = document.querySelector(selector);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const section = document.querySelector(selector);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  /**
   * Closes mobile drawer and navigates to the specified view.
   *
   * @param {string} page - Target view identifier
   */
  const handleNavClick = (page) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => handleNavClick('home')}>
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="url(#gradient)" strokeWidth="2"/>
              <path d="M20 10 C14 14, 14 18, 20 22 C26 18, 26 14, 20 10Z" fill="url(#gradient2)"/>
              <path d="M20 22 C14 26, 14 30, 20 34 C26 30, 26 26, 20 22Z" fill="url(#gradient2)"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#764ba2" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">
            <span className="logo-main">PulmoAI</span>
            <span className="logo-sub">Medical Imaging</span>
          </span>
        </div>

        {/* Navigation Links (Desktop & Mobile Drawer) */}
        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button 
            className="nav-link" 
            onClick={() => scrollToSection('.features-section')}
          >
            Features
          </button>
          <button 
            className="nav-link" 
            onClick={() => scrollToSection('.how-it-works-section')}
          >
            How It Works
          </button>
          <button 
            className={`nav-link ${currentPage === 'scan' ? 'active' : ''}`}
            onClick={() => handleNavClick('scan')}
          >
            CT Scan Analysis
          </button>
        </div>

        {/* Action Button & Theme Toggle & Hamburger */}
        <div className="navbar-actions">
          <button
            className="btn-theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Toggle Theme (currently ${theme === 'dark' ? 'Dark' : 'Light'})`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <svg className="theme-svg moon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                <span className="theme-toggle-text">Dark</span>
              </>
            ) : (
              <>
                <svg className="theme-svg sun-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span className="theme-toggle-text">Light</span>
              </>
            )}
          </button>

          <button className="btn-nav-primary" onClick={() => handleNavClick('scan')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>New Scan</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
