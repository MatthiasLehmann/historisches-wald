import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import loadEnv from './utils/loadEnv.js';
import documentsRouter from './routes/documents.js';
import flickrRouter from './routes/flickr.js';
import imagesRouter from './routes/images.js';
import pdfsRouter from './routes/pdfs.js';
import albumsRouter from './routes/albums.js';
import photosRouter from './routes/photos.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_FILES_DIR = path.join(__dirname, 'public', 'files');

loadEnv();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/files', express.static(PUBLIC_FILES_DIR));

app.use('/api/documents', documentsRouter);
app.use('/api/flickr', flickrRouter);
app.use('/api/images', imagesRouter);
app.use('/api/pdfs', pdfsRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/photos', photosRouter);

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
