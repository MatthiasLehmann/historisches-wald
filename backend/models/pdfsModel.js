import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonArray, writeJsonArray } from '../utils/jsonStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PDFS_DATA_FILE = path.join(__dirname, '..', 'data', 'pdfs.json');

export const REVIEW_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

const ensureString = (value) => (typeof value === 'string' ? value : '').trim();

const ensureTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => ensureString(tag)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return ensureTags(value.split(',').map((tag) => tag.trim()));
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

const defaultReview = () => ({
  status: 'pending',
  reviewer: '',
  reviewedAt: null,
  comments: []
});

const normalizeFile = (file) => {
  const type = file?.type === 'remote' ? 'remote' : 'local';
  return {
    type,
    path: ensureString(file?.path),
    originalUrl: file?.originalUrl ? ensureString(file.originalUrl) : null
  };
};

export const normalizePdf = (pdf = {}) => {
  const review = typeof pdf.review === 'object' && pdf.review !== null ? pdf.review : defaultReview();
  const createdAt = pdf.createdAt ?? new Date().toISOString();
  return {
    id: ensureString(pdf.id) || '',
    title: ensureString(pdf.title),
    year: typeof pdf.year === 'number' ? pdf.year : (pdf.year ? Number(pdf.year) : null),
    description: ensureString(pdf.description),
    location: ensureString(pdf.location),
    source: ensureString(pdf.source),
    author: ensureString(pdf.author),
    license: ensureString(pdf.license) || 'rights-reserved',
    tags: ensureTags(pdf.tags),
    file: normalizeFile(pdf.file),
    pages: typeof pdf.pages === 'number' ? pdf.pages : null,
    review: {
      status: REVIEW_STATUSES.includes(review.status) ? review.status : 'pending',
      reviewer: ensureString(review.reviewer),
      reviewedAt: review.reviewedAt ?? null,
      comments: normalizeComments(review.comments)
    },
    linkedDocuments: ensureTags(pdf.linkedDocuments),
    createdAt,
    updatedAt: pdf.updatedAt ?? createdAt
  };
};

export const readPdfs = async () => {
  const pdfs = await readJsonArray(PDFS_DATA_FILE);
  return pdfs.map((pdf) => normalizePdf(pdf));
};

export const writePdfs = async (pdfs) => {
  const normalized = pdfs.map((pdf) => normalizePdf(pdf));
  await writeJsonArray(PDFS_DATA_FILE, normalized);
  return normalized;
};

const extractNumericId = (id) => {
  const match = /pdf-(\d+)/.exec(id || '');
  return match ? Number(match[1]) : null;
};

export const generatePdfId = (pdfs) => {
  const max = pdfs.reduce((acc, pdf) => {
    const numeric = extractNumericId(pdf.id);
    return typeof numeric === 'number' && numeric > acc ? numeric : acc;
  }, 0);
  const next = max + 1;
  return `pdf-${String(next).padStart(5, '0')}`;
};

export const syncLinkedDocuments = (pdfs, documentId, desiredPdfIds) => {
  if (!documentId) {
    return { pdfs, changed: false };
  }
  const desired = new Set(Array.isArray(desiredPdfIds) ? desiredPdfIds : []);
  let changed = false;
  const updated = pdfs.map((pdf) => {
    const hasDoc = pdf.linkedDocuments.includes(documentId);
    let nextLinks = pdf.linkedDocuments;
    if (desired.has(pdf.id) && !hasDoc) {
      changed = true;
      nextLinks = [...pdf.linkedDocuments, documentId];
    } else if (!desired.has(pdf.id) && hasDoc) {
      changed = true;
      nextLinks = pdf.linkedDocuments.filter((id) => id !== documentId);
    }
    if (nextLinks !== pdf.linkedDocuments) {
      return {
        ...pdf,
        linkedDocuments: nextLinks,
        updatedAt: new Date().toISOString()
      };
    }
    return pdf;
  });
  return { pdfs: updated, changed };
};
