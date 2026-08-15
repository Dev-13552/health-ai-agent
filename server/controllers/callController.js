const sttService = require('../services/stt');
const llmService = require('../services/llm');
const ttsService = require('../services/tts');

// In-memory session store to hold conversation histories mapped by sessionId
const sessions = new Map();

exports.getHealth = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Health AI Agent Server is running smoothly',
    timestamp: new Date().toISOString()
  });
};

exports.testStt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded in "audio" field.' });
    }
    console.log(`STT Test: Received file of size ${req.file.size} bytes, type ${req.file.mimetype}`);
    const transcript = await sttService.transcribeAudio(req.file.buffer, req.file.mimetype);
    res.status(200).json({ transcript });
  } catch (error) {
    console.error('STT Test Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.testLlm = async (req, res) => {
  try {
    const { history = [], message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required in request body.' });
    }
    console.log(`LLM Test: Message: "${message}"`);
    const chat = llmService.startConversation(history);
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('LLM Test Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.testTts = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required in request body.' });
    }
    console.log(`TTS Test: Text: "${text}"`);
    const audioBuffer = await ttsService.textToSpeech(text);
    
    // Determine content type based on whether it is wav or mp3
    const isWav = audioBuffer.toString('ascii', 8, 12) === 'WAVE';
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Test Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.testPipeline = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded in "audio" field.' });
    }
    
    console.log('Pipeline Test: Transcribing audio...');
    const transcript = await sttService.transcribeAudio(req.file.buffer, req.file.mimetype);
    console.log(`Pipeline Test: Transcribed text: "${transcript}"`);
    
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Could not transcribe any speech from the audio.' });
    }

    console.log('Pipeline Test: Sending to LLM...');
    const chat = llmService.startConversation([]);
    const llmResult = await chat.sendMessage(transcript);
    const responseText = llmResult.response.text();
    console.log(`Pipeline Test: AI Response: "${responseText}"`);

    console.log('Pipeline Test: Synthesizing speech...');
    const audioBuffer = await ttsService.textToSpeech(responseText);
    
    const isWav = audioBuffer.toString('ascii', 8, 12) === 'WAVE';
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length,
      'X-Transcript-User': encodeURIComponent(transcript),
      'X-Response-AI': encodeURIComponent(responseText)
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Pipeline Test Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// Real session-based endpoints for the REST PTT flow
// =========================================================================

/**
 * Starts a new screening call session. Returns the AI's initial greeting.
 * Route: POST /api/start-call
 */
exports.startCall = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required in request body.' });
    }

    console.log(`Session ${sessionId}: Initializing call...`);
    const history = [];
    sessions.set(sessionId, { history });

    // Prompt the AI to greet the user
    const chat = llmService.startConversation(history);
    const result = await chat.sendMessage('Hello, I am ready to start the health screening. Please greet me and ask for my name.');
    const greetingText = result.response.text();
    console.log(`Session ${sessionId}: AI Greeting: "${greetingText}"`);

    // Save updated history
    sessions.get(sessionId).history = await chat.getHistory();

    // Synthesize the greeting text to audio
    const audioBuffer = await ttsService.textToSpeech(greetingText);
    
    const isWav = audioBuffer.toString('ascii', 8, 12) === 'WAVE';
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length,
      'X-Response-AI': encodeURIComponent(greetingText)
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Start Call Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles a single speech turn of the user, transcribes it, runs the LLM context,
 * updates history, and returns synthesized speech audio.
 * Route: POST /api/chat-turn
 */
exports.chatTurn = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    // 1. Transcribe the audio
    console.log(`Session ${sessionId}: Transcribing user audio turn (${req.file.size} bytes)...`);
    let transcript = '';
    try {
      transcript = await sttService.transcribeAudio(req.file.buffer, req.file.mimetype);
    } catch (sttErr) {
      console.error('STT Error in chatTurn:', sttErr);
      // Fallback: assume empty/unclear speech to trigger a gentle query back
      transcript = '';
    }

    console.log(`Session ${sessionId}: Transcribed text: "${transcript}"`);

    // 2. Retrieve or initialize the session
    if (!sessions.has(sessionId)) {
      console.log(`Session ${sessionId}: Session not found in memory, creating a new one.`);
      sessions.set(sessionId, { history: [] });
    }
    const session = sessions.get(sessionId);

    // 3. Check for empty transcription (silence or background noise)
    if (!transcript || !transcript.trim()) {
      console.log(`Session ${sessionId}: Empty transcription detected.`);
      const silenceResponseText = "I'm sorry, I couldn't hear you clearly. Could you please repeat that?";
      const audioBuffer = await ttsService.textToSpeech(silenceResponseText);
      
      const isWav = audioBuffer.toString('ascii', 8, 12) === 'WAVE';
      const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

      res.set({
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length,
        'X-Transcript-User': encodeURIComponent(''),
        'X-Response-AI': encodeURIComponent(silenceResponseText)
      });
      return res.send(audioBuffer);
    }

    // 4. Send the user's transcript to Gemini
    console.log(`Session ${sessionId}: Feeding transcript to dialogue engine...`);
    const chat = llmService.startConversation(session.history);
    const result = await chat.sendMessage(transcript);
    const responseText = result.response.text();
    console.log(`Session ${sessionId}: AI Response: "${responseText}"`);

    // 5. Update session history
    session.history = await chat.getHistory();

    // 6. Synthesize the text response to audio
    console.log(`Session ${sessionId}: Synthesizing response to audio...`);
    const audioBuffer = await ttsService.textToSpeech(responseText);
    
    const isWav = audioBuffer.toString('ascii', 8, 12) === 'WAVE';
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length,
      'X-Transcript-User': encodeURIComponent(transcript),
      'X-Response-AI': encodeURIComponent(responseText)
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Chat Turn Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Ends the call, generates the structured report JSON from history, and deletes the session.
 * Route: POST /api/end-call
 */
exports.endCall = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required in request body.' });
    }

    console.log(`Session ${sessionId}: Generating health report and ending call...`);
    const session = sessions.get(sessionId);

    if (!session || !session.history || session.history.length === 0) {
      console.log(`Session ${sessionId}: Session is missing or has no history.`);
      return res.status(200).json({
        mainConcern: 'No screening data collected.',
        keySymptoms: [],
        duration: 'Not provided',
        severity: 'Not provided',
        followUp: ['The call was ended before screening questions could be answered.']
      });
    }

    // Generate report JSON from history using Gemini
    const report = await llmService.generateReport(session.history);
    console.log(`Session ${sessionId}: Report compiled successfully:`, report);

    // Delete session from memory to prevent memory leaks
    sessions.delete(sessionId);

    res.status(200).json(report);
  } catch (error) {
    console.error('End Call Error:', error);
    res.status(500).json({
      error: error.message,
      mainConcern: 'Failed to generate report due to server error.',
      keySymptoms: [],
      duration: 'Not provided',
      severity: 'Not provided',
      followUp: ['Please consult a healthcare professional.']
    });
  }
};
