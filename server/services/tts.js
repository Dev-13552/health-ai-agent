const { createClient } = require('@deepgram/sdk');
const googleTTS = require('google-tts-api');

function isHindi(text) {
  return /[\u0900-\u097F]/.test(text);
}

async function textToSpeech(text) {
  const needsHindi = isHindi(text);

  // Hindi → Google TTS
  if (needsHindi || !process.env.DEEPGRAM_API_KEY) {
    try {
      console.log(`TTS: Using Google TTS (${needsHindi ? 'Hindi' : 'English'})`);

      const base64Audio = await googleTTS.getAudioBase64(text, {
        lang: needsHindi ? 'hi' : 'en',
        slow: false,
        host: 'https://translate.google.com',
      });

      return Buffer.from(base64Audio, 'base64');
    } catch (err) {
      console.error('Google TTS generation failed:', err);
      throw err;
    }
  }

  // English → Deepgram
  try {
    console.log(`TTS: Using Deepgram Aura for: "${text.substring(0, 30)}..."`);

    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    // Correct v3+ SDK call: speak.request(), not speak.v1.audio.generate()
    const response = await deepgram.speak.request(
      { text },
      {
        model: 'aura-2-thalia-en',
        encoding: 'linear16',
        container: 'wav',
      }
    );

    // getStream() is async and returns a web ReadableStream
    const stream = await response.getStream();
    if (!stream) {
      throw new Error('Deepgram returned no audio stream');
    }

    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks.map((c) => Buffer.from(c)));
  } catch (err) {
    console.error('Deepgram TTS failed, falling back to Google TTS:', err);

    // Google fallback
    try {
      const base64Audio = await googleTTS.getAudioBase64(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });

      return Buffer.from(base64Audio, 'base64');
    } catch (fallbackErr) {
      throw new Error(`TTS failed on all pipelines: ${err.message} -> ${fallbackErr.message}`);
    }
  }
}

module.exports = { textToSpeech };