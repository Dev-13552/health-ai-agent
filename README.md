# Health Screening Voice AI Agent

A web app where a user has a voice conversation with an AI agent that conducts a basic health-screening intake call. The AI greets the user, asks adaptive follow-up questions (name, main concern, duration, severity, related symptoms), and once the call ends, generates a structured health report from the conversation.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js / Express
- **Transport:** Push-to-talk over REST — the user taps to record a turn, releases to send it, and the AI responds with synthesized audio. Turn-taking and conversation state are managed server-side per session.

## Pipeline

| Stage | Provider | Notes |
|---|---|---|
| Speech-to-Text | **Deepgram** (`nova-2` model) | `detect_language: true` for Hindi/English auto-detection |
| LLM (conversation + report generation) | **Google Gemini** (`gemini-2.5-flash`) | Drives the adaptive intake conversation and produces the structured JSON report |
| Text-to-Speech | **Deepgram Aura** (`aura-2-thalia-en`), with **Google TTS** as fallback | Automatically routes Hindi text (Devanagari script) to Google TTS; falls back to Google TTS if Deepgram TTS fails for any reason |

### How a call works
1. **Start Call** (`POST /api/start-call`) — creates an in-memory session, prompts Gemini to greet the user and ask for their name, synthesizes the greeting to audio.
2. **Each turn** (`POST /api/chat-turn`) — the user's recorded audio is uploaded, transcribed via Deepgram, appended to that session's chat history, and sent to Gemini, which asks the next question (or a follow-up if the previous answer was vague). The reply is synthesized to audio and returned. Both audio and text are sent back — the audio in the response body, and the transcript/reply text in `X-Transcript-User` / `X-Response-AI` response headers.
3. **End Call** (`POST /api/end-call`) — the full conversation history is sent to Gemini with a report-generation prompt, which returns a structured JSON object (`mainConcern`, `keySymptoms`, `duration`, `severity`, `followUp`). The session is then cleared from memory.

## Language Support

Built for **English and Hindi**, with auto-detection and mid-call switching:
- STT auto-detects the spoken language per turn (Deepgram `detect_language`).
- The LLM is instructed to reply in whichever language the user just spoke.
- TTS routes Hindi output to Google TTS (Deepgram Aura is English-only) and English output to Deepgram Aura, so voice and language stay in sync turn by turn.

## Failure Handling

- **Silence / unclear audio:** if STT returns an empty transcript, the AI responds with a gentle "I couldn't hear you, could you repeat that?" instead of failing or advancing the conversation.
- **STT/API errors mid-call:** caught and treated as an empty transcript rather than crashing the turn.
- **Short/incomplete calls:** if the user ends the call after zero or partial exchanges, the report endpoint returns a valid, clearly-labeled report (e.g. "Not provided") instead of erroring or fabricating data.
- **Malformed LLM report output:** if Gemini's report response isn't clean JSON, the server attempts to extract a JSON block and falls back to a safe default report structure rather than crashing.

## Setup

### Prerequisites
- Node.js 18+
- API keys for [Deepgram](https://deepgram.com) and [Google Gemini](https://aistudio.google.com/apikey)

### Environment Variables
Create `server/.env`:
```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Install & Run
From the project root:
```bash
npm run install-all   # installs root, server, and client dependencies
npm run dev            # runs backend (port 5000) and frontend (Vite) concurrently
```

Or run them separately:
```bash
npm run server   # backend only
npm run client   # frontend only
```

Then open the client URL shown by Vite (typically `http://localhost:5173`) and click **Start Call**.

## What I'd Improve With More Time

- **True real-time transport:** move from push-to-talk REST turns to WebSockets/WebRTC with streaming STT, so the AI can respond as the user finishes speaking rather than after an upload round-trip.
- **Barge-in support:** allow the user to interrupt the AI mid-sentence rather than waiting for playback to finish.
- **Persistent session storage:** sessions currently live in server memory and are lost on restart; a lightweight store (Redis/SQLite) would make this durable and horizontally scalable.
- **Client-side mic/VAD feedback:** surface signal strength or silence detection in the UI so users get immediate feedback if their mic isn't capturing audio, rather than finding out after a round-trip.
- **Streaming TTS playback:** stream synthesized audio as it's generated instead of waiting for the full buffer, to cut perceived latency.
