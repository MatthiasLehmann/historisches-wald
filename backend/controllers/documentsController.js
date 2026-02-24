import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'documents.json');

const ensureDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
    } else {
      throw error;
    }
  }
};

const readDocuments = async () => {
  await ensureDataFile();
  const data = await fs.readFile(DATA_FILE, 'utf8');
  return data ? JSON.parse(data) : [];
};

const writeDocuments = async (documents) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(documents, null, 2), 'utf8');
};

export const getDocuments = async (_req, res) => {
  try {
    const documents = await readDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Error reading documents:', error);
    res.status(500).json({ message: 'Failed to read documents.' });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { title, year, category, location, description } = req.body || {};

    if (!title || !year || !category || !location || !description) {
      return res.status(400).json({ message: 'title, year, category, location, and description are required.' });
    }

    const documents = await readDocuments();
    const newDocument = {
      id: `doc-${Date.now()}`,
      title,
      year: Number(year),
      category,
      subcategories: Array.isArray(req.body.subcategories) ? req.body.subcategories : [],
      location,
      description,
      transcription: req.body.transcription || '',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      metadata: {
        author: req.body.author || 'Unbekannt',
        source: req.body.source || 'Unbekannt',
        condition: req.body.condition || 'Unbekannt'
      }
    };

    documents.unshift(newDocument);
    await writeDocuments(documents);

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Failed to create document.' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await readDocuments();
    const index = documents.findIndex((doc) => doc.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const existing = documents[index];
    const updated = {
      ...existing,
      ...req.body,
      year: req.body.year ? Number(req.body.year) : existing.year,
      subcategories: Array.isArray(req.body.subcategories) ? req.body.subcategories : existing.subcategories,
      images: Array.isArray(req.body.images) ? req.body.images : existing.images,
      metadata: {
        ...existing.metadata,
        author: req.body.author ?? existing.metadata?.author ?? 'Unbekannt',
        source: req.body.source ?? existing.metadata?.source ?? 'Unbekannt',
        condition: req.body.condition ?? existing.metadata?.condition ?? 'Unbekannt'
      }
    };

    documents[index] = updated;
    await writeDocuments(documents);

    res.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Failed to update document.' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await readDocuments();
    const filtered = documents.filter((doc) => doc.id !== id);

    if (filtered.length === documents.length) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    await writeDocuments(filtered);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document.' });
  }
};
