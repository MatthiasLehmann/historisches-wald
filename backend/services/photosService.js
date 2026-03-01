import { getPhotoFilePath } from '../config/mediaConfig.js';
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

const ensureReview = (value = {}) => ({
  status: REVIEW_STATUSES.includes(value.status) ? value.status : 'pending',
  reviewer: typeof value.reviewer === 'string' ? value.reviewer.trim() : '',
  reviewedAt: value.reviewedAt ?? null,
  comments: sanitizeReviewComments(value.comments)
});

const normalizePhoto = (photo, fallbackId, overrides = {}) => {
  const normalized = {
    id: photo?.id ?? fallbackId,
    name: typeof photo?.name === 'string' ? photo.name : '',
    description: typeof photo?.description === 'string' ? photo.description : '',
    date_taken: typeof photo?.date_taken === 'string' ? photo.date_taken : '',
    photopage: photo?.photopage ?? '',
    original: photo?.original ?? '',
    license: photo?.license ?? 'All Rights Reserved',
    privacy: photo?.privacy ?? 'public',
    tags: normalizeTags(photo?.tags),
    albums: Array.isArray(photo?.albums) ? photo.albums.map((id) => String(id)) : [],
    comments: Array.isArray(photo?.comments) ? photo.comments : [],
    review: ensureReview(photo?.review),
    missing: Boolean(photo?.missing),
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

export const getPhotoById = async (photoId) => {
  const raw = await readPhotoRaw(photoId);
  if (!raw) {
    return buildMissingPhoto(photoId);
  }
  return normalizePhoto(raw, photoId);
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
