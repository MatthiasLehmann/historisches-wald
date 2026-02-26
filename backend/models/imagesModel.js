import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonArray, writeJsonArray } from '../utils/jsonStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const IMAGES_DATA_FILE = path.join(__dirname, '..', 'data', 'images.json');

export const REVIEW_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

const ensureString = (value) => (typeof value === 'string' ? value : '').trim();

const ensureTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => ensureString(tag))
      .filter((tag) => Boolean(tag));
  }
  if (typeof tags === 'string') {
    return ensureTags(tags.split(',').map((tag) => tag.trim()))
      .filter((tag) => Boolean(tag));
  }
  return [];
};

const normalizeComments = (comments) => {
  if (!Array.isArray(comments)) {
    return [];
  }
  return comments.map((comment) => ({
    reviewer: ensureString(comment?.reviewer),
    date: comment?.date ?? null,
    comment: ensureString(comment?.comment)
  }));
};

export const resolveImagePreviewUrl = (image) => {
  if (!image || typeof image !== 'object') {
    return null;
  }
  const file = image.file ?? {};
  if (file.type === 'remote') {
    return file.originalUrl || file.path || null;
  }
  return file.path || file.originalUrl || null;
};

const defaultReview = () => ({
  status: 'pending',
  reviewer: '',
  reviewedAt: null,
  comments: []
});

export const normalizeImage = (image = {}) => {
  const review = typeof image.review === 'object' && image.review !== null
    ? image.review
    : defaultReview();
  const createdAt = image.createdAt ?? new Date().toISOString();
  return {
    id: ensureString(image.id) || '',
    title: ensureString(image.title),
    year: typeof image.year === 'number'
      ? image.year
      : image.year
        ? Number(image.year)
        : null,
    description: ensureString(image.description),
    location: ensureString(image.location),
    source: ensureString(image.source),
    author: ensureString(image.author),
    license: ensureString(image.license) || 'rights-reserved',
    tags: ensureTags(image.tags),
    file: {
      type: image.file?.type === 'remote' ? 'remote' : 'local',
      path: ensureString(image.file?.path),
      originalUrl: image.file?.originalUrl ? ensureString(image.file.originalUrl) : null
    },
    review: {
      status: REVIEW_STATUSES.includes(review.status) ? review.status : 'pending',
      reviewer: ensureString(review.reviewer),
      reviewedAt: review.reviewedAt ?? null,
      comments: normalizeComments(review.comments)
    },
    linkedDocuments: ensureTags(image.linkedDocuments),
    createdAt,
    updatedAt: image.updatedAt ?? createdAt
  };
};

export const readImages = async () => {
  const images = await readJsonArray(IMAGES_DATA_FILE);
  return images.map((image) => normalizeImage(image));
};

export const writeImages = async (images) => {
  const normalized = images.map((image) => normalizeImage(image));
  await writeJsonArray(IMAGES_DATA_FILE, normalized);
  return normalized;
};

const extractNumericId = (id) => {
  const match = /img-(\d+)/.exec(id || '');
  return match ? Number(match[1]) : null;
};

export const generateImageId = (images) => {
  const max = images.reduce((current, image) => {
    const numeric = extractNumericId(image.id);
    if (typeof numeric === 'number' && numeric > current) {
      return numeric;
    }
    return current;
  }, 0);
  const next = max + 1;
  return `img-${String(next).padStart(5, '0')}`;
};

export const syncLinkedDocuments = (images, documentId, desiredImageIds) => {
  if (!documentId) {
    return { images, changed: false };
  }
  const desired = new Set(Array.isArray(desiredImageIds) ? desiredImageIds : []);
  let changed = false;
  const updated = images.map((image) => {
    const hasDoc = image.linkedDocuments.includes(documentId);
    let nextLinks = image.linkedDocuments;
    if (desired.has(image.id) && !hasDoc) {
      changed = true;
      nextLinks = [...image.linkedDocuments, documentId];
    } else if (!desired.has(image.id) && hasDoc) {
      changed = true;
      nextLinks = image.linkedDocuments.filter((id) => id !== documentId);
    }

    if (nextLinks !== image.linkedDocuments) {
      return {
        ...image,
        linkedDocuments: nextLinks,
        updatedAt: new Date().toISOString()
      };
    }
    return image;
  });

  return { images: updated, changed };
};
