import React from 'react';

/**
 * Report Component: Renders the visually clean medical report from the AI screening.
 * Follows the user's specific text layouts and spacing guidelines.
 */
export default function Report({ reportData, onBackToHome }) {
  const {
    mainConcern = 'Not provided',
    keySymptoms = [],
    duration = 'Not provided',
    severity = 'Not provided',
    followUp = []
  } = reportData;

  return (
    <div className="report-card">
      <div className="report-title-area">
        <svg viewBox="0 0 24 24" width="28" height="28" className="report-icon" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z"/>
        </svg>
        <h2>Health Screening Report</h2>
      </div>

      <div className="report-divider"></div>

      {/* Section: Main Concern */}
      <div className="report-section">
        <span className="report-section-label">Main Concern</span>
        <p className="report-section-value">{mainConcern}</p>
      </div>

      <div className="report-divider"></div>

      {/* Section: Key Symptoms */}
      <div className="report-section">
        <span className="report-section-label">Key Symptoms</span>
        {keySymptoms.length === 0 ? (
          <p className="report-section-value secondary">None reported</p>
        ) : (
          <ul className="report-bullet-list">
            {keySymptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="report-divider"></div>

      {/* Section: Duration */}
      <div className="report-section">
        <span className="report-section-label">Duration</span>
        <p className="report-section-value">{duration}</p>
      </div>

      <div className="report-divider"></div>

      {/* Section: Severity */}
      <div className="report-section">
        <span className="report-section-label">Severity</span>
        <p className="report-section-valueHighlight">{severity}</p>
      </div>

      <div className="report-divider"></div>

      {/* Section: Follow-up */}
      <div className="report-section">
        <span className="report-section-label">Follow-up</span>
        {followUp.length === 0 ? (
          <p className="report-section-value secondary">No specific follow-up required.</p>
        ) : (
          <ul className="report-bullet-list">
            {followUp.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="report-divider"></div>

      {/* Footer message */}
      <div className="report-footer">
        <p>Information collected from your conversation with the AI assistant.</p>
        <p className="report-disclaimer">Disclaimer: This screening is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
      </div>

      <button onClick={onBackToHome} className="back-home-btn">
        Start New Screening
      </button>
    </div>
  );
}
