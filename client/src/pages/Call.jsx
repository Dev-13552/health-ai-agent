import React, { useState, useEffect, useRef } from 'react';
import CallScreen from '../components/CallScreen';
import Report from '../components/Report';
import { startCall, sendAudioTurn, endCall } from '../services/api';

/**
 * Call Component: Manages call-session lifecycle, audio recording upload,
 * audio playback from the server, conversation transcript states, and report view toggle.
 */
export default function Call({ onBackToHome }) {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const [status, setStatus] = useState('idle'); // 'idle', 'recording', 'processing', 'playing'
  const [conversation, setConversation] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);

  // Initialize hidden Audio object on mount
  useEffect(() => {
    audioRef.current = new Audio();

    audioRef.current.onplay = () => setStatus('playing');
    audioRef.current.onended = () => setStatus('idle');
    audioRef.current.onerror = (e) => {
      console.error('Audio playback error:', e);
      setStatus('idle');
      setError('Failed to play screening agent voice.');
    };

    // Auto-trigger Start Call to get AI greeting
    initiateCallSession();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  const playResponseAudio = (blob) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(blob);
      currentAudioUrlRef.current = audioUrl;
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch((err) => {
        console.warn('Audio auto-play blocked by browser. User interaction required.', err);
        setStatus('idle'); // Fallback if browser blocks audio autoplay
      });
    } catch (err) {
      console.error('Failed to prepare audio playback:', err);
      setStatus('idle');
    }
  };

  const initiateCallSession = async () => {
    setStatus('processing');
    setError(null);
    try {
      const { audioBlob, greetingText } = await startCall(sessionId);
      
      // Update transcript with greeting
      setConversation([{ role: 'assistant', text: greetingText }]);
      
      // Play audio response
      playResponseAudio(audioBlob);
    } catch (err) {
      console.error('Start call error:', err);
      setError('Could not connect to health screening server.');
      setStatus('idle');
    }
  };

  const handleStartRecording = () => {
    // If AI is speaking, interrupt/pause it
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setStatus('recording');
    setError(null);
  };

  const handleStopRecording = async (audioBlob) => {
    setStatus('processing');
    setError(null);

    try {
      console.log('Call: Uploading recorded voice turn...');
      const response = await sendAudioTurn(sessionId, audioBlob);
      
      const newTurns = [];
      // Push user transcript if not empty
      if (response.userText) {
        newTurns.push({ role: 'user', text: response.userText });
      } else {
        // If STT returned nothing, server sends a fallback text
        console.warn('Empty transcription from server.');
      }

      // Push AI reply
      newTurns.push({ role: 'assistant', text: response.aiText });

      setConversation((prev) => [...prev, ...newTurns]);

      // Play audio response
      playResponseAudio(response.audioBlob);
    } catch (err) {
      console.error('Chat turn processing failed:', err);
      setError('Error processing voice input. Please try again.');
      setStatus('idle');
    }
  };

  const handleEndCall = async () => {
    setStatus('processing');
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const report = await endCall(sessionId);
      setReportData(report);
      setShowReport(true);
      setStatus('idle');
    } catch (err) {
      console.error('End call error:', err);
      setError('Failed to compile screening report.');
      setStatus('idle');
    }
  };

  if (showReport && reportData) {
    return (
      <div className="call-container-wrapper">
        <Report reportData={reportData} onBackToHome={onBackToHome} />
      </div>
    );
  }

  return (
    <div className="call-container-wrapper">
      <CallScreen
        status={status}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onEndCall={handleEndCall}
        conversation={conversation}
        error={error}
      />
    </div>
  );
}
