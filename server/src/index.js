import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Dotenv Load Result:', envResult);
console.log('DATABASE_URL is:', process.env.DATABASE_URL);

import express from 'express';
import cors from 'cors';
import workflowRouter from './routes/workflow.js';
import { featherlessClient, aimlClient } from './utils/aiClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Workflow Routes
app.use('/api/workflow', workflowRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      featherless: {
        configured: !!process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_API_KEY !== 'your_featherless_api_key_here',
        baseUrl: process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1'
      },
      aiml: {
        configured: !!process.env.AIML_API_KEY && process.env.AIML_API_KEY !== 'your_aiml_api_key_here',
        baseUrl: process.env.AIML_BASE_URL || 'https://api.aimlapi.com/v1'
      }
    }
  });
});

// A test route to query Featherless or AI/ML API (requires configured API keys)
app.post('/api/chat', async (req, res) => {
  const { provider, model, messages, ...rest } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Missing "provider" in request body' });
  }
  if (!model || !messages) {
    return res.status(400).json({ error: 'Missing "model" or "messages" in request body' });
  }

  let client;
  if (provider.toLowerCase() === 'featherless') {
    client = featherlessClient;
  } else if (provider.toLowerCase() === 'aiml') {
    client = aimlClient;
  } else {
    return res.status(400).json({ error: 'Invalid provider. Must be "featherless" or "aiml"' });
  }

  try {
    const result = await client.chat.completions.create({
      model,
      messages,
      ...rest
    });
    return res.json(result);
  } catch (error) {
    console.error(`Error querying ${provider}:`, error);
    return res.status(500).json({
      error: 'Failed to process chat completion request',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
});
