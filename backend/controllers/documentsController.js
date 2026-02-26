import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'documents.json');
const REPO_ROOT = path.join(__dirname, '..', '..');
const execAsync = promisify(execCallback);

const REVIEW_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

const normalizeReview = (doc) => {
  const review = (doc && typeof doc.review === 'object') ? doc.review : {};

  return {
    ...doc,
    review: {
      status: review.status ?? 'pending',
      reviewer: review.reviewer ?? '',
      reviewedAt: review.reviewedAt ?? null,
      comments: Array.isArray(review.comments) ? review.comments : []
    }
  };
};

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
  const parsed = data ? JSON.parse(data) : [];
  return parsed.map((doc) => normalizeReview(doc));
};

const writeDocuments = async (documents) => {
  const normalized = documents.map((doc) => normalizeReview(doc));
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
};

const handleControllerError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
};

const findDocumentRecord = async (id) => {
  const documents = await readDocuments();
  const index = documents.findIndex((doc) => doc.id === id);

  if (index === -1) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }

  return { documents, index, document: documents[index] };
};

const requireReviewerName = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    const error = new Error('Reviewer name is required.');
    error.statusCode = 400;
    throw error;
  }
  return trimmed;
};

const validateStatus = (status) => {
  if (!REVIEW_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: ${REVIEW_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return status;
};

const commitReviewCompletion = async (docId, reviewer) => {
  const escapedMessage = `Review completed for document ${docId} by ${reviewer}`.replace(/"/g, '\\"');
  try {
    await execAsync('git add backend/data/documents.json', { cwd: REPO_ROOT });
    await execAsync(`git commit -m "${escapedMessage}"`, { cwd: REPO_ROOT });
  } catch (error) {
    const gitError = new Error('Git commit failed.');
    gitError.statusCode = 500;
    gitError.cause = error;
    throw gitError;
  }
};

const commitDocumentSave = async (docId, mode) => {
  const action = mode === 'create' ? 'Document created' : 'Document updated';
  const escapedMessage = `${action}: ${docId}`.replace(/"/g, '\\"');
  try {
    await execAsync('git add backend/data/documents.json', { cwd: REPO_ROOT });
    await execAsync(`git commit -m "${escapedMessage}"`, { cwd: REPO_ROOT });
  } catch (error) {
    const gitError = new Error('Git commit failed.');
    gitError.statusCode = 500;
    gitError.cause = error;
    throw gitError;
  }
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
    const newDocument = normalizeReview({
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
      },
      review: {
        status: 'pending',
        reviewer: '',
        reviewedAt: null,
        comments: []
      }
    });

    documents.unshift(newDocument);
    await writeDocuments(documents);
    await commitDocumentSave(newDocument.id, 'create');

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
    const existingReview = normalizeReview(existing).review;
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
      },
      review: existingReview
    };

    const normalized = normalizeReview(updated);
    documents[index] = normalized;
    await writeDocuments(documents);
    await commitDocumentSave(normalized.id, 'update');

    res.json(normalized);
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

export const getDocumentReview = async (req, res) => {
  try {
    const { document } = await findDocumentRecord(req.params.id);
    res.json(document.review);
  } catch (error) {
    handleControllerError(res, error, 'Failed to load document review.');
  }
};

export const addReviewComment = async (req, res) => {
  try {
    const reviewer = requireReviewerName(req.body?.reviewer);
    const commentText = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!commentText) {
      const err = new Error('Comment text is required.');
      err.statusCode = 400;
      throw err;
    }

    const { documents, index, document } = await findDocumentRecord(req.params.id);
    const updated = {
      ...document,
      review: {
        ...document.review,
        reviewer,
        comments: [
          ...document.review.comments,
          {
            reviewer,
            date: new Date().toISOString(),
            comment: commentText
          }
        ]
      }
    };

    const normalized = normalizeReview(updated);
    documents[index] = normalized;
    await writeDocuments(documents);

    res.status(201).json(normalized.review);
  } catch (error) {
    handleControllerError(res, error, 'Failed to add review comment.');
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const reviewer = requireReviewerName(req.body?.reviewer);
    const status = validateStatus(req.body?.status);
    const { documents, index, document } = await findDocumentRecord(req.params.id);

    const updated = {
      ...document,
      review: {
        ...document.review,
        status,
        reviewer,
        reviewedAt: status === 'approved' ? document.review.reviewedAt : null
      }
    };

    const normalized = normalizeReview(updated);
    documents[index] = normalized;
    await writeDocuments(documents);

    res.json(normalized.review);
  } catch (error) {
    handleControllerError(res, error, 'Failed to update review status.');
  }
};

export const completeReview = async (req, res) => {
  try {
    const reviewer = requireReviewerName(req.body?.reviewer);
    const { documents, index, document } = await findDocumentRecord(req.params.id);

    const updated = {
      ...document,
      review: {
        ...document.review,
        status: 'approved',
        reviewer,
        reviewedAt: new Date().toISOString()
      }
    };

    const normalized = normalizeReview(updated);
    documents[index] = normalized;
    await writeDocuments(documents);
    await commitReviewCompletion(document.id, reviewer);

    res.json(normalized.review);
  } catch (error) {
    handleControllerError(res, error, 'Failed to complete review.');
  }
};
