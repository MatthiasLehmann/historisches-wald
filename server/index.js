/* global process */
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '../src/data/documents.json');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/documents', async (_req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Lesen der Dokumente.' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { title, year, category, subcategories = [], location, description } = req.body || {};

    if (!title || !year || !category || !location || !description) {
      return res.status(400).json({ message: 'Bitte alle Pflichtfelder ausfüllen.' });
    }

    const newDocument = {
      id: `doc-${Date.now()}`,
      title,
      year: Number(year),
      category,
      subcategories,
      location,
      description,
      images: [],
      metadata: {
        author: req.body.author || 'Unbekannt',
        source: req.body.source || 'Eingereicht',
        condition: req.body.condition || 'Unbekannt',
      },
    };

    const data = await fs.readFile(DATA_PATH, 'utf8');
    const documents = JSON.parse(data);
    documents.unshift(newDocument);

    await fs.writeFile(DATA_PATH, JSON.stringify(documents, null, 4), 'utf8');

    res.status(201).json(newDocument);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Speichern fehlgeschlagen.' });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const documents = JSON.parse(data);
    const index = documents.findIndex((doc) => doc.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Dokument nicht gefunden.' });
    }

    const existing = documents[index];
    const updated = {
      ...existing,
      title: req.body.title ?? existing.title,
      year: req.body.year ? Number(req.body.year) : existing.year,
      category: req.body.category ?? existing.category,
      subcategories: Array.isArray(req.body.subcategories) ? req.body.subcategories : existing.subcategories,
      location: req.body.location ?? existing.location,
      description: req.body.description ?? existing.description,
      metadata: {
        ...existing.metadata,
        author: req.body.author ?? existing.metadata?.author ?? 'Unbekannt',
        source: req.body.source ?? existing.metadata?.source ?? 'Unbekannt',
        condition: req.body.condition ?? existing.metadata?.condition ?? 'Unbekannt',
      },
    };

    documents[index] = updated;
    await fs.writeFile(DATA_PATH, JSON.stringify(documents, null, 4), 'utf8');

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Aktualisierung fehlgeschlagen.' });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
