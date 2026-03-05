import { promises as fs } from 'fs';
import path from 'path';
import { getPhotoFilePath, getPhotosDir } from '../config/mediaConfig.js';
import { readJsonFile, writeJsonFile } from '../utils/jsonStorage.js';

const REVIEW_STATUSES = ['pending', 'in-progress', 'approved', 'needs-info', 'rejected'];

const normalizeTags = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return value
        .map((entry) => (typeof entry.tag === 'string' ? entry.tag.trim() : ''))
        .filter(Boolean);
    }
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeReviewComments = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((comment) => (typeof comment === 'string' ? comment.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeSource = (value) => (typeof value === 'string' ? value.trim() : '');

const resolveSource = (value, fallback = '') => {
  const sanitized = sanitizeSource(value);
  if (sanitized) {
    return sanitized;
  }
  return sanitizeSource(fallback);
};

const ensureReview = (value = {}) => ({
  status: REVIEW_STATUSES.includes(value.status) ? value.status : 'pending',
  reviewer: typeof value.reviewer === 'string' ? value.reviewer.trim() : '',
  reviewedAt: value.reviewedAt ?? null,
  comments: sanitizeReviewComments(value.comments)
});

const normalizePhoto = (photo, fallbackId, overrides = {}) => {
  const photopage = sanitizeSource(photo?.photopage);
  const normalized = {
    id: photo?.id ?? fallbackId,
    name: typeof photo?.name === 'string' ? photo.name : '',
    description: typeof photo?.description === 'string' ? photo.description : '',
    date_taken: typeof photo?.date_taken === 'string' ? photo.date_taken : '',
    photopage,
    source: resolveSource(photo?.source, photopage),
    original: photo?.original ?? '',
    preview: typeof photo?.preview === 'string' && photo.preview ? photo.preview : (photo?.original ?? ''),
    license: photo?.license ?? 'All Rights Reserved',
    privacy: photo?.privacy ?? 'public',
    tags: normalizeTags(photo?.tags),
    albums: Array.isArray(photo?.albums) ? photo.albums.map((id) => String(id)) : [],
    comments: Array.isArray(photo?.comments) ? photo.comments : [],
    review: ensureReview(photo?.review),
    missing: Boolean(photo?.missing),
    createdAt: typeof photo?.createdAt === 'string' ? photo.createdAt : null,
    updatedAt: typeof photo?.updatedAt === 'string' ? photo.updatedAt : null,
    ...overrides
  };
  return normalized;
};

const buildMissingPhoto = (photoId) =>
  normalizePhoto(
    {
      id: photoId,
      name: 'Unbekanntes Foto',
      description: '',
      preview: '',
      comments: [],
      review: ensureReview({ status: 'needs-info' })
    },
    photoId,
    { missing: true, error: `Photo ${photoId} file is missing.` }
  );

const sanitizeTagsInput = (input) => {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const buildReviewPayload = (input = {}, existing = {}) => ({
  status: REVIEW_STATUSES.includes(input.status) ? input.status : existing.status ?? 'pending',
  reviewer: typeof input.reviewer === 'string' ? input.reviewer.trim() : existing.reviewer ?? '',
  reviewedAt: input.reviewedAt ?? existing.reviewedAt ?? null,
  comments: sanitizeReviewComments(input.comments ?? existing.comments ?? [])
});

const buildPhotoUpdate = (base = {}, input = {}) => {
  const next = { ...base };

  if (Object.prototype.hasOwnProperty.call(input, 'name')) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      const error = new Error('Photo name is required.');
      error.statusCode = 400;
      throw error;
    }
    next.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    next.description = typeof input.description === 'string' ? input.description.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(input, 'date_taken')) {
    const dateTaken = typeof input.date_taken === 'string' ? input.date_taken.trim() : '';
    next.date_taken = dateTaken;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'tags')) {
    next.tags = sanitizeTagsInput(input.tags);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'albums')) {
    const albumsInput = Array.isArray(input.albums) ? input.albums : [];
    const sanitizedAlbums = Array.from(
      new Set(
        albumsInput
          .map((albumId) => String(albumId).trim())
          .filter((albumId) => albumId.length > 0)
      )
    );
    next.albums = sanitizedAlbums;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'preview')) {
    const preview = typeof input.preview === 'string' ? input.preview.trim() : '';
    next.preview = preview || next.preview || next.original || '';
  }

  if (Object.prototype.hasOwnProperty.call(input, 'original')) {
    const original = typeof input.original === 'string' ? input.original.trim() : '';
    if (original) {
      next.original = original;
      if (!next.preview) {
        next.preview = original;
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'source')) {
    const source = sanitizeSource(input.source);
    if (source) {
      next.source = source;
    } else {
      delete next.source;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'review')) {
    next.review = buildReviewPayload(input.review, ensureReview(base.review));
  }

  next.updatedAt = new Date().toISOString();
  if (!next.review) {
    next.review = ensureReview();
  }

  return next;
};

const readPhotoRaw = async (photoId) => {
  const filePath = getPhotoFilePath(photoId);
  try {
    const data = await readJsonFile(filePath, null);
    if (!data) {
      return null;
    }
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const writePhotoRaw = async (photoId, payload) => writeJsonFile(getPhotoFilePath(photoId), payload);

const generatePhotoId = async () => {
  const attemptId = () => `local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  for (let i = 0; i < 10; i += 1) {
    const candidate = attemptId();
    const existing = await readPhotoRaw(candidate);
    if (!existing) {
      return candidate;
    }
  }
  const error = new Error('Konnte keine eindeutige Foto-ID erzeugen.');
  error.statusCode = 500;
  throw error;
};

const buildPhotoCreatePayload = (input = {}, photoId) => {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    const error = new Error('Foto-Name ist erforderlich.');
    error.statusCode = 400;
    throw error;
  }
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const dateTaken = typeof input.date_taken === 'string' ? input.date_taken.trim() : '';
  const photopage = sanitizeSource(input.photopage);
  const original = typeof input.original === 'string' ? input.original.trim() : '';
  const preview = typeof input.preview === 'string' ? input.preview.trim() : '';
  const license = typeof input.license === 'string' ? input.license.trim() : 'All Rights Reserved';
  const privacy = typeof input.privacy === 'string' ? input.privacy.trim() : 'public';
  const albumIds = Array.isArray(input.albums) ? input.albums.map((id) => String(id)) : [];
  const source = sanitizeSource(input.source);

  const nowIso = new Date().toISOString();
  const payload = {
    id: photoId,
    name,
    description,
    date_taken: dateTaken,
    photopage,
    original,
    preview: preview || original,
    license,
    privacy,
    tags: sanitizeTagsInput(input.tags),
    albums: albumIds,
    comments: [],
    review: ensureReview(input.review),
    missing: false,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : nowIso,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : nowIso
  };
  if (source) {
    payload.source = source;
  } else if (photopage) {
    payload.source = photopage;
  }
  return payload;
};

export const getPhotoById = async (photoId) => {
  const raw = await readPhotoRaw(photoId);
  if (!raw) {
    return buildMissingPhoto(photoId);
  }
  return normalizePhoto(raw, photoId);
};

export const createPhoto = async (input = {}) => {
  const photoId = input.id ?? (await generatePhotoId());
  const payload = buildPhotoCreatePayload(input, photoId);
  await writePhotoRaw(photoId, payload);
  return normalizePhoto(payload, photoId);
};

const extractPhotoIdFromFile = (fileName) => {
  if (!fileName.startsWith('photo_') || path.extname(fileName) !== '.json') {
    return null;
  }
  return fileName.slice('photo_'.length, -'.json'.length);
};

export const listPhotos = async () => {
  const photosDir = getPhotosDir();
  let files = [];
  try {
    files = await fs.readdir(photosDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  const photoIds = files
    .map(extractPhotoIdFromFile)
    .filter(Boolean);

  const photos = await Promise.all(
    photoIds.map(async (photoId) => {
      try {
        const raw = await readPhotoRaw(photoId);
        if (!raw) {
          return buildMissingPhoto(photoId);
        }
        return normalizePhoto(raw, photoId);
      } catch (error) {
        console.warn(`Failed to read photo ${photoId}:`, error);
        return null;
      }
    })
  );
  return photos.filter(Boolean);
};

export const updatePhotoById = async (photoId, input) => {
  const existing = (await readPhotoRaw(photoId)) || { id: photoId };
  const updated = buildPhotoUpdate(existing, input);
  await writePhotoRaw(photoId, updated);
  return normalizePhoto(updated, photoId);
};

export const getPhotosByIds = async (photoIds = []) => {
  const uniqueIds = Array.from(new Set(photoIds.map((value) => String(value))));
  const photos = await Promise.all(uniqueIds.map((id) => getPhotoById(id)));
  return photos;
};

export const REVIEW_STATUS_OPTIONS = REVIEW_STATUSES;
