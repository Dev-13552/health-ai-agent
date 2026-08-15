const express = require('express');
const router = express.Router();
const multer = require('multer');
const callController = require('../controllers/callController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/health', callController.getHealth);

// Test routes
router.post('/test-stt', upload.single('audio'), callController.testStt);
router.post('/test-llm', callController.testLlm);
router.post('/test-tts', callController.testTts);
router.post('/test-pipeline', upload.single('audio'), callController.testPipeline);

// Session-based call routes
router.post('/start-call', callController.startCall);
router.post('/chat-turn', upload.single('audio'), callController.chatTurn);
router.post('/end-call', callController.endCall);

module.exports = router;
