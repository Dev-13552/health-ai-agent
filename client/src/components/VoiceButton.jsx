import React, { useState, useRef, useEffect } from 'react';

/**
 * VoiceButton Component: Handles audio recording (push-to-talk style toggle) and indicates visual states.
 * States: 'idle', 'recording', 'processing', 'playing'
 */
export default function VoiceButton({ status, onStartRecording, onStopRecording, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cleanup recording stream on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime types for audio
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const options = { mimeType };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onStopRecording(audioBlob);
        
        // Stop all audio tracks to release microphone icon
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      onStartRecording();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggle = () => {
    if (disabled || status === 'processing' || status === 'playing') return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Render text and style based on state
  const getButtonConfig = () => {
    if (status === 'processing') {
      return {
        text: 'AI is thinking...',
        className: 'voice-btn processing',
        icon: (
          <svg className="spinner" viewBox="0 0 50 50">
            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
          </svg>
        )
      };
    }
    if (status === 'playing') {
      return {
        text: 'AI is speaking...',
        className: 'voice-btn playing',
        icon: (
          <div className="wave-icon">
            <span className="stroke"></span>
            <span className="stroke"></span>
            <span className="stroke"></span>
            <span className="stroke"></span>
          </div>
        )
      };
    }
    if (isRecording) {
      return {
        text: 'Listening... Tap to send',
        className: 'voice-btn recordingPulse',
        icon: (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M6 19h12v2H6zM19 5H5v12h14V5z"/>
          </svg>
        )
      };
    }
    return {
      text: 'Tap to Speak',
      className: 'voice-btn idle',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
      )
    };
  };

  const config = getButtonConfig();

  return (
    <div className="voice-btn-container">
      <button
        onClick={handleToggle}
        className={config.className}
        disabled={disabled || status === 'processing'}
        title={config.text}
      >
        <div className="btn-circle">
          {config.icon}
        </div>
        <span className="btn-label">{config.text}</span>
      </button>
    </div>
  );
}
