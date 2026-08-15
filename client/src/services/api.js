const API_BASE = 'http://localhost:5000/api';

/**
 * Starts a new call session and fetches the initial greeting audio.
 * @param {string} sessionId
 * @returns {Promise<{audioBlob: Blob, greetingText: string}>}
 */
export async function startCall(sessionId) {
  const response = await fetch(`${API_BASE}/start-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start call');
  }

  const greetingText = decodeURIComponent(response.headers.get('X-Response-AI') || '');
  const audioBlob = await response.blob();

  return { audioBlob, greetingText };
}

/**
 * Uploads user voice turn and returns AI synthesized audio response with transcripts in headers.
 * @param {string} sessionId
 * @param {Blob} audioBlob
 * @returns {Promise<{audioBlob: Blob, userText: string, aiText: string}>}
 */
export async function sendAudioTurn(sessionId, audioBlob) {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('audio', audioBlob, 'turn.wav');

  const response = await fetch(`${API_BASE}/chat-turn`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process voice turn');
  }

  const userText = decodeURIComponent(response.headers.get('X-Transcript-User') || '');
  const aiText = decodeURIComponent(response.headers.get('X-Response-AI') || '');
  const responseAudioBlob = await response.blob();

  return {
    audioBlob: responseAudioBlob,
    userText,
    aiText
  };
}

/**
 * Ends the call and compiles the clinical summary report.
 * @param {string} sessionId
 * @returns {Promise<Object>} The structured health report
 */
export async function endCall(sessionId) {
  const response = await fetch(`${API_BASE}/end-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to end call and compile report');
  }

  return await response.json();
}
