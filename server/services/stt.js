const { createClient } = require('@deepgram/sdk');

/**
 * Transcribes audio buffer to text using Deepgram API.
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/wav') {
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY is not defined in environment variables.');
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: 'nova-2',
      smart_format: true,
      mimetype: mimeType,
      detect_language: true, // Auto-detect language (Hindi, English, etc.)
    }
  );

  if (error) {
    throw error;
  }
  console.log('Deepgram metadata:', {
  duration: result.metadata?.duration,
  channels: result.metadata?.channels,
  confidence: result.results?.channels[0]?.alternatives[0]?.confidence,
});

  const transcript = result.results?.channels[0]?.alternatives[0]?.transcript;
  return transcript || '';
}

module.exports = { transcribeAudio };
