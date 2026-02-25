import express from 'express';
import cors from 'cors';
import loadEnv from './utils/loadEnv.js';
import documentsRouter from './routes/documents.js';
import flickrRouter from './routes/flickr.js';

const app = express();
const PORT = process.env.PORT || 3000;

loadEnv();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/documents', documentsRouter);
app.use('/api/flickr', flickrRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
