import React from 'react';

/**
 * Home Component: Landing page introducing the Health AI Agent.
 */
export default function Home({ onStartCall }) {
  return (
    <div className="home-container">
      <div className="logo-section">
        <div className="logo-badge">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
          </svg>
        </div>
        <h1>Health Screen AI</h1>
        <p className="subtitle">Empathetic Voice-Based Clinical Intake</p>
      </div>

      <div className="hero-card animate-fade-in">
        <p className="hero-desc">
          Speak with our intelligent agent to conduct a basic health intake session. 
          The assistant will guide you through questions about your symptoms, duration, and pain levels, 
          generating a structured clinical report for you or your physician.
        </p>

        <div className="feature-grid">
          <div className="feature-item">
            <div className="feature-icon">🎙️</div>
            <div className="feature-text">
              <h4>Conversational Voice API</h4>
              <p>Speak naturally in English or Hindi. Tap to talk and tap to send.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🔄</div>
            <div className="feature-text">
              <h4>Context-Aware Intake</h4>
              <p>The agent listens, follows up, and remembers answers across turns.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📋</div>
            <div className="feature-text">
              <h4>Structured Health Report</h4>
              <p>Instantly get a synthesized summary perfect for quick clinical review.</p>
            </div>
          </div>
        </div>

        <button onClick={onStartCall} className="start-call-btn-large">
          <span>Start Screening Call</span>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
