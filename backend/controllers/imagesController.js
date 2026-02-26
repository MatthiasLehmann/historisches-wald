import { fileURLToPath } from 'url';
import path from 'path';
import {
  generateImageId,
  readImages,
  resolveImagePreviewUrl,
  REVIEW_STATUSES,
  syncLinkedDocuments,
  writeImages
} from '../models/imagesModel.js';
import { readJsonArray, writeJsonArray } from '../utils/jsonStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCUMENTS_FILE = path.join(__dirname, '..', 'data', 'documents.json');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTagsInput = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter((tag) => Boolean(tag));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => Boolean(tag));
  }
  return [];
};

const buildFilePayload = (input = {}) => {
  const type = input.type === 'remote' ? 'remote' : 'local';
  const pathValue = typeof input.path === 'string' ? input.path.trim() : '';
  const originalUrl = typeof input.originalUrl === 'string' ? input.originalUrl.trim() : '';

  if (type === 'local' && !pathValue) {
    const error = new Error('Lokaler Dateipfad ist erforderlich.');
    error.statusCode = 400;
    throw error;
  }

  if (type === 'remote' && !originalUrl && !pathValue) {
    const error = new Error('Remote-URL ist erforderlich.');
    error.statusCode = 400;
    throw error;
  }

  const finalOriginalUrl = type === 'remote' ? (originalUrl || pathValue) : (originalUrl || null);

  return {
    type,
    path: type === 'local' ? pathValue : '',
    originalUrl: finalOriginalUrl
  };
};

const requireTitle = (value, fallback = '') => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (title) {
    return title;
  }
  if (fallback) {
    return fallback;
  }
  const error = new Error('Titel ist erforderlich.');
  error.statusCode = 400;
  throw error;
};

const parseYear = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error('Jahr muss eine Zahl sein.');
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const buildImagePayload = (body = {}, existing = null) => {
  const now = new Date().toISOString();
  const base = existing
    ? { ...existing }
    : {
        review: {
          status: 'pending',
          reviewer: '',
          reviewedAt: null,
          comments: []
        },
        linkedDocuments: [],
        createdAt: now
      };

  return {
    ...base,
    title: requireTitle(body.title, base.title),
    year: parseYear(body.year, base.year ?? null),
    description: typeof body.description === 'string' ? body.description.trim() : (base.description ?? ''),
    location: typeof body.location === 'string' ? body.location.trim() : (base.location ?? ''),
    source: typeof body.source === 'string' ? body.source.trim() : (base.source ?? ''),
    author: typeof body.author === 'string' ? body.author.trim() : (base.author ?? ''),
    license: typeof body.license === 'string' ? body.license.trim() : (base.license ?? 'rights-reserved'),
    tags: normalizeTagsInput(body.tags ?? base.tags ?? []),
    file: buildFilePayload(body.file ?? base.file ?? { type: 'local', path: '' }),
    updatedAt: now
  };
};

const handleError = (res, error, fallback = 'Unbekannter Fehler.') => {
  const status = error.statusCode || 500;
  const message = error.message || fallback;
  if (status >= 500) {
    console.error(fallback, error);
  }
  res.status(status).json({ message });
};

const findImageIndex = (images, id) => images.findIndex((image) => image.id === id);

const filterImages = (images, query) => {
  const {
    q,
    year,
    location,
    status,
    tag,
    tags,
    ids,
    sort = 'updatedAt',
    order = 'desc'
  } = query;
  let result = [...images];

  if (ids) {
    const idSet = new Set(ids.split(',').map((value) => value.trim()).filter(Boolean));
    result = result.filter((image) => idSet.has(image.id));
  }

  if (year) {
    const numericYear = toNumber(year);
    if (numericYear !== null) {
      result = result.filter((image) => image.year === numericYear);
    }
  }

  if (location) {
    const needle = location.trim().toLowerCase();
    result = result.filter((image) => (image.location || '').toLowerCase().includes(needle));
  }

  const statusValue = status ? status.trim() : '';
  if (statusValue) {
    result = result.filter((image) => image.review.status === statusValue);
  }

  const tagsFilter = normalizeTagsInput(tag ?? tags);
  if (tagsFilter.length > 0) {
    result = result.filter((image) => tagsFilter.every((t) => image.tags.includes(t)));
  }

  if (q) {
    const needle = q.trim().toLowerCase();
    result = result.filter((image) => {
      const haystack = [
        image.title,
        image.description,
        image.location,
        image.source,
        image.author,
        ...(image.tags || [])
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }

  const sorter = sort === 'year' ? 'year' : 'updatedAt';
  const direction = order === 'asc' ? 1 : -1;

  result.sort((a, b) => {
    if (sorter === 'year') {
      return ((a.year || 0) - (b.year || 0)) * direction;
    }
    return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
  });

  return result;
};

const persistDocumentImageRemoval = async (imageId) => {
  const documents = await readJsonArray(DOCUMENTS_FILE);
  let changed = false;
  const updated = documents.map((doc) => {
    const imageIds = Array.isArray(doc.imageIds) ? doc.imageIds : [];
    if (!imageIds.includes(imageId)) {
      return doc;
    }
    changed = true;
    return {
      ...doc,
      imageIds: imageIds.filter((value) => value !== imageId)
    };
  });
  if (changed) {
    await writeJsonArray(DOCUMENTS_FILE, updated);
  }
};

export const listImages = async (req, res) => {
  try {
    const images = await readImages();
    const filtered = filterImages(images, req.query || {});
    res.json(filtered);
  } catch (error) {
    handleError(res, error, 'Bilder konnten nicht geladen werden.');
  }
};

export const getImage = async (req, res) => {
  try {
    const images = await readImages();
    const image = images.find((item) => item.id === req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    return res.json(image);
  } catch (error) {
    return handleError(res, error, 'Bild konnte nicht geladen werden.');
  }
};

export const createImage = async (req, res) => {
  try {
    const images = await readImages();
    const payload = buildImagePayload(req.body || {});
    const now = new Date().toISOString();
    const newImage = {
      ...payload,
      id: generateImageId(images),
      createdAt: payload.createdAt ?? now,
      review: payload.review,
      linkedDocuments: payload.linkedDocuments ?? []
    };
    images.unshift(newImage);
    await writeImages(images);
    res.status(201).json(newImage);
  } catch (error) {
    handleError(res, error, 'Bild konnte nicht erstellt werden.');
  }
};

export const updateImage = async (req, res) => {
  try {
    const images = await readImages();
    const index = findImageIndex(images, req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    const existing = images[index];
    const payload = buildImagePayload(req.body || {}, existing);
    const updated = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      review: existing.review,
      linkedDocuments: existing.linkedDocuments
    };
    images[index] = updated;
    await writeImages(images);
    res.json(updated);
  } catch (error) {
    handleError(res, error, 'Bild konnte nicht aktualisiert werden.');
  }
};

export const deleteImage = async (req, res) => {
  try {
    const images = await readImages();
    const filtered = images.filter((image) => image.id !== req.params.id);
    if (filtered.length === images.length) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    await writeImages(filtered);
    await persistDocumentImageRemoval(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Bild konnte nicht gelöscht werden.');
  }
};

export const addReviewComment = async (req, res) => {
  try {
    const reviewer = (req.body?.reviewer || '').trim();
    const comment = (req.body?.comment || '').trim();
    if (!reviewer || !comment) {
      return res.status(400).json({ message: 'Reviewer und Kommentar sind erforderlich.' });
    }
    const images = await readImages();
    const index = findImageIndex(images, req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    const now = new Date().toISOString();
    const existing = images[index];
    const updated = {
      ...existing,
      review: {
        ...existing.review,
        reviewer,
        comments: [
          ...existing.review.comments,
          { reviewer, date: now, comment }
        ]
      },
      updatedAt: now
    };
    images[index] = updated;
    await writeImages(images);
    res.status(201).json(updated.review);
  } catch (error) {
    handleError(res, error, 'Kommentar konnte nicht gespeichert werden.');
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const reviewer = (req.body?.reviewer || '').trim();
    const status = req.body?.status;
    if (!reviewer) {
      return res.status(400).json({ message: 'Reviewer ist erforderlich.' });
    }
    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status muss einer der folgenden Werte sein: ${REVIEW_STATUSES.join(', ')}` });
    }
    const images = await readImages();
    const index = findImageIndex(images, req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    const now = new Date().toISOString();
    const existing = images[index];
    const updated = {
      ...existing,
      review: {
        ...existing.review,
        reviewer,
        status,
        reviewedAt: status === 'approved' ? existing.review.reviewedAt : null
      },
      updatedAt: now
    };
    images[index] = updated;
    await writeImages(images);
    res.json(updated.review);
  } catch (error) {
    handleError(res, error, 'Status konnte nicht aktualisiert werden.');
  }
};

export const completeReview = async (req, res) => {
  try {
    const reviewer = (req.body?.reviewer || '').trim();
    if (!reviewer) {
      return res.status(400).json({ message: 'Reviewer ist erforderlich.' });
    }
    const images = await readImages();
    const index = findImageIndex(images, req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Bild nicht gefunden.' });
    }
    const now = new Date().toISOString();
    const existing = images[index];
    const updated = {
      ...existing,
      review: {
        ...existing.review,
        reviewer,
        status: 'approved',
        reviewedAt: now
      },
      updatedAt: now
    };
    images[index] = updated;
    await writeImages(images);
    res.json(updated.review);
  } catch (error) {
    handleError(res, error, 'Review konnte nicht abgeschlossen werden.');
  }
};

export const importImageFromUrl = async (req, res) => {
  try {
    const url = (req.body?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'URL ist erforderlich.' });
    }
    const title = req.body?.title || url;
    const body = {
      ...req.body,
      title,
      file: {
        type: 'remote',
        originalUrl: url,
        path: ''
      }
    };
    const images = await readImages();
    const payload = buildImagePayload(body);
    const now = new Date().toISOString();
    const newImage = {
      ...payload,
      id: generateImageId(images),
      createdAt: payload.createdAt ?? now,
      review: payload.review,
      linkedDocuments: []
    };
    images.unshift(newImage);
    await writeImages(images);
    res.status(201).json(newImage);
  } catch (error) {
    handleError(res, error, 'Bild konnte nicht importiert werden.');
  }
};
