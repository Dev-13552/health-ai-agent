const express = require('express');
const cors = require('cors');
const callRoutes = require('./routes/callRoutes');

const app = express();

app.use(cors({
  exposedHeaders: ['X-Transcript-User', 'X-Response-AI']
}));
app.use(express.json());

// Routes
app.use('/api', callRoutes);

module.exports = app;
