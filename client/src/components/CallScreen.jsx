import React, { useEffect, useState, useRef } from 'react';
import VoiceButton from './VoiceButton';

/**
 * CallScreen Component: Hosts the active screening call layout, timer, message bubble logs,
 * the push-to-talk button, and the Red End Call button.
 */
export default function CallScreen({ status, onStartRecording, onStopRecording, onEndCall, conversation, error }) {
  const [seconds, setSeconds] = useState(0);
  const transcriptEndRef = useRef(null);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth scroll to bottom when new items are added to transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="call-screen">
      {/* Call Header */}
      <div className="call-header">
        <div className="pulse-indicator-container">
          <div className={`pulse-dot ${status === 'recording' ? 'listening' : ''}`}></div>
        </div>
        <div className="call-info">
          <h3>Screening Assistant</h3>
          <p className="call-meta">Push-to-Talk | {formatTime(seconds)}</p>
        </div>
      </div>

      {/* Error Warning Banner */}
      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Chat Logs */}
      <div className="transcript-box">
        {conversation.length === 0 ? (
          <div className="empty-transcript">
            <div className="agent-avatar animate-pulse">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
            <p>Initializing call session. Please wait...</p>
          </div>
        ) : (
          conversation.map((turn, index) => (
            <div key={index} className={`message-bubble-wrapper ${turn.role}`}>
              <div className="bubble-avatar">
                {turn.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className={`message-bubble ${turn.role}`}>
                <p>{turn.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Control Actions */}
      <div className="call-actions-panel">
        <VoiceButton
          status={status}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          disabled={status === 'processing'}
        />

        <button onClick={onEndCall} className="end-call-btn" title="End Call">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 9c-2.2 0-4.3.4-6.2 1.1v4c0 .5-.3.9-.7 1.1-1.2.6-2.3 1.5-3.2 2.5-.2.2-.5.3-.8.3-.3 0-.6-.1-.8-.3l-3-3c-.2-.2-.3-.5-.3-.8 0-.3.1-.6.3-.8C3.1 7.7 7.3 5 12 5s8.9 2.7 12.1 7.7c.2.2.3.5.3.8s-.1.6-.3.8l-3 3c-.2.2-.5.3-.8.3-.3 0-.6-.1-.8-.3-.9-1-2-1.9-3.2-2.5-.4-.2-.7-.6-.7-1.1v-4C16.3 9.4 14.2 9 12 9z"/>
          </svg>
          <span>End Screening</span>
        </button>
      </div>
    </div>
  );
}
