import { promises as fs } from 'fs';
import {
  generatePdfId,
  normalizePdf,
  readPdfs,
  REVIEW_STATUSES,
  syncLinkedDocuments,
  writePdfs
} from '../models/pdfsModel.js';
import { readJsonArray, writeJsonArray } from '../utils/jsonStorage.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveBase64Pdf } from '../utils/pdfStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCUMENTS_FILE = path.join(__dirname, '..', 'data', 'documents.json');
const PDF_FILES_DIR = path.join(__dirname, '..', 'public', 'files', 'pdf');

const ensurePdfExtension = (value) => {
  if (!value) {
    return;
  }
  if (!value.toLowerCase().endsWith('.pdf')) {
    const error = new Error('Only PDF files are allowed.');
    error.statusCode = 400;
    throw error;
  }
};

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
};

const buildFilePayload = (input = {}) => {
  const type = input.type === 'remote' ? 'remote' : 'local';
  const pathValue = typeof input.path === 'string' ? input.path.trim() : '';
  const originalUrl = typeof input.originalUrl === 'string' ? input.originalUrl.trim() : '';

  if (type === 'local') {
    if (!pathValue) {
      const error = new Error('Local PDF path is required.');
      error.statusCode = 400;
      throw error;
    }
    ensurePdfExtension(pathValue);
  } else if (type === 'remote') {
    if (!originalUrl && !pathValue) {
      const error = new Error('Remote PDF URL is required.');
      error.statusCode = 400;
      throw error;
    }
    ensurePdfExtension(originalUrl || pathValue);
  }

  const finalOriginal = type === 'remote' ? (originalUrl || pathValue) : (originalUrl || null);
  return {
    type,
    path: type === 'local' ? pathValue : '',
    originalUrl: finalOriginal
  };
};

const buildPdfPayload = (body = {}, existing = null) => {
  const now = new Date().toISOString();
  const base = existing ? { ...existing } : normalizePdf({ file: { type: 'local', path: '' } });
  const title = typeof body.title === 'string' ? body.title.trim() : base.title;
  if (!title) {
    const error = new Error('Titel ist erforderlich.');
    error.statusCode = 400;
    throw error;
  }
  return {
    ...base,
    title,
    year: (() => {
      if (body.year === undefined || body.year === null || body.year === '') {
        return base.year;
      }
      const parsed = Number(body.year);
      if (!Number.isFinite(parsed)) {
        const error = new Error('Jahr muss eine Zahl sein.');
        error.statusCode = 400;
        throw error;
      }
      return parsed;
    })(),
    description: typeof body.description === 'string' ? body.description.trim() : base.description,
    location: typeof body.location === 'string' ? body.location.trim() : base.location,
    source: typeof body.source === 'string' ? body.source.trim() : base.source,
    author: typeof body.author === 'string' ? body.author.trim() : base.author,
    license: typeof body.license === 'string' ? body.license.trim() : base.license,
    tags: normalizeTags(body.tags ?? base.tags),
    file: buildFilePayload(body.file ?? base.file),
    updatedAt: now
  };
};

const filterPdfs = (pdfs, query) => {
  const {
    q,
    year,
    status,
    tag,
    tags,
    ids,
    sort = 'updatedAt',
    order = 'desc'
  } = query;
  let result = [...pdfs];

  if (ids) {
    const idSet = new Set(ids.split(',').map((value) => value.trim()).filter(Boolean));
    result = result.filter((pdf) => idSet.has(pdf.id));
  }

  if (year) {
    const numericYear = Number(year);
    if (Number.isFinite(numericYear)) {
      result = result.filter((pdf) => pdf.year === numericYear);
    }
  }

  if (status) {
    result = result.filter((pdf) => pdf.review.status === status);
  }

  const tagsFilter = normalizeTags(tags ?? tag);
  if (tagsFilter.length > 0) {
    result = result.filter((pdf) => tagsFilter.every((value) => pdf.tags.includes(value)));
  }

  if (q) {
    const needle = q.trim().toLowerCase();
    result = result.filter((pdf) => {
      const haystack = [
        pdf.title,
        pdf.description,
        pdf.location,
        pdf.source,
        pdf.author,
        ...(pdf.tags || [])
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }

  const sorter = sort === 'year' ? 'year' : 'updatedAt';
  const direction = order === 'asc' ? 1 : -1;

  result.sort((a, b) => {
    if (sorter === 'year') {
      const left = typeof a.year === 'number' ? a.year : 0;
      const right = typeof b.year === 'number' ? b.year : 0;
      return (left - right) * direction;
    }
    const left = new Date(a.updatedAt || 0).getTime();
    const right = new Date(b.updatedAt || 0).getTime();
    return (left - right) * direction;
  });

  return result;
};

const persistDocumentPdfRemoval = async (pdfId) => {
  const documents = await readJsonArray(DOCUMENTS_FILE);
  let changed = false;
  const updated = documents.map((doc) => {
    const pdfIds = Array.isArray(doc.pdfIds) ? doc.pdfIds : [];
    if (!pdfIds.includes(pdfId)) {
      return doc;
    }
    changed = true;
    return {
      ...doc,
      pdfIds: pdfIds.filter((id) => id !== pdfId)
    };
  });
  if (changed) {
    await writeJsonArray(DOCUMENTS_FILE, updated);
  }
};

const readLocalPdfFiles = async () => {
  try {
    const entries = await fs.readdir(PDF_FILES_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
      .map((entry) => ({
        name: entry.name,
        path: `/files/pdf/${entry.name}`
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const handleError = (res, error, fallback) => {
  const status = error.statusCode || 500;
  const message = error.message || fallback;
  if (status >= 500) {
    console.error(fallback, error);
  }
  res.status(status).json({ message });
};

export const listPdfs = async (req, res) => {
  try {
    const pdfs = await readPdfs();
    const filtered = filterPdfs(pdfs, req.query || {});
    res.json(filtered);
  } catch (error) {
    handleError(res, error, 'PDFs konnten nicht geladen werden.');
  }
};

export const listLocalPdfFiles = async (_req, res) => {
  try {
    const files = await readLocalPdfFiles();
    res.json(files);
  } catch (error) {
    handleError(res, error, 'PDF-Dateien konnten nicht geladen werden.');
  }
};

export const getPdf = async (req, res) => {
  try {
    const pdfs = await readPdfs();
    const pdf = pdfs.find((item) => item.id === req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    return res.json(pdf);
  } catch (error) {
    return handleError(res, error, 'PDF konnte nicht geladen werden.');
  }
};

export const createPdf = async (req, res) => {
  try {
    const pdfs = await readPdfs();
    const payload = buildPdfPayload(req.body || {});
    const newPdf = normalizePdf({
      ...payload,
      id: generatePdfId(pdfs)
    });
    pdfs.unshift(newPdf);
    await writePdfs(pdfs);
    res.status(201).json(newPdf);
  } catch (error) {
    handleError(res, error, 'PDF konnte nicht erstellt werden.');
  }
};

export const updatePdf = async (req, res) => {
  try {
    const pdfs = await readPdfs();
    const index = pdfs.findIndex((pdf) => pdf.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    const payload = buildPdfPayload(req.body || {}, pdfs[index]);
    const updated = normalizePdf({
      ...pdfs[index],
      ...payload,
      id: pdfs[index].id,
      createdAt: pdfs[index].createdAt,
      review: pdfs[index].review,
      linkedDocuments: pdfs[index].linkedDocuments
    });
    pdfs[index] = updated;
    await writePdfs(pdfs);
    res.json(updated);
  } catch (error) {
    handleError(res, error, 'PDF konnte nicht aktualisiert werden.');
  }
};

export const deletePdf = async (req, res) => {
  try {
    const pdfs = await readPdfs();
    const filtered = pdfs.filter((pdf) => pdf.id !== req.params.id);
    if (filtered.length === pdfs.length) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    await writePdfs(filtered);
    await persistDocumentPdfRemoval(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'PDF konnte nicht gelöscht werden.');
  }
};

export const addReviewComment = async (req, res) => {
  try {
    const reviewer = (req.body?.reviewer || '').trim();
    const comment = (req.body?.comment || '').trim();
    if (!reviewer || !comment) {
      return res.status(400).json({ message: 'Reviewer und Kommentar sind erforderlich.' });
    }
    const pdfs = await readPdfs();
    const index = pdfs.findIndex((pdf) => pdf.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    const updated = {
      ...pdfs[index],
      review: {
        ...pdfs[index].review,
        reviewer,
        comments: [
          ...pdfs[index].review.comments,
          { reviewer, date: new Date().toISOString(), comment }
        ]
      },
      updatedAt: new Date().toISOString()
    };
    pdfs[index] = updated;
    await writePdfs(pdfs);
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
    const pdfs = await readPdfs();
    const index = pdfs.findIndex((pdf) => pdf.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    const updated = {
      ...pdfs[index],
      review: {
        ...pdfs[index].review,
        reviewer,
        status,
        reviewedAt: status === 'approved' ? pdfs[index].review.reviewedAt : null
      },
      updatedAt: new Date().toISOString()
    };
    pdfs[index] = updated;
    await writePdfs(pdfs);
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
    const pdfs = await readPdfs();
    const index = pdfs.findIndex((pdf) => pdf.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'PDF nicht gefunden.' });
    }
    const updated = {
      ...pdfs[index],
      review: {
        ...pdfs[index].review,
        reviewer,
        status: 'approved',
        reviewedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };
    pdfs[index] = updated;
    await writePdfs(pdfs);
    res.json(updated.review);
  } catch (error) {
    handleError(res, error, 'Review konnte nicht abgeschlossen werden.');
  }
};

export const importPdfFromFile = async (req, res) => {
  try {
    const filePayload = req.body?.file;
    if (!filePayload?.data) {
      return res.status(400).json({ message: 'Eine PDF-Datei ist erforderlich.' });
    }
    const storedFile = await saveBase64Pdf({
      data: filePayload.data,
      mimeType: filePayload.type,
      originalName: filePayload.name || req.body?.title || 'upload.pdf'
    });
    const pdfs = await readPdfs();
    const payload = buildPdfPayload({
      title: req.body?.title || filePayload.name || 'Neues PDF',
      year: req.body?.year,
      description: req.body?.description,
      location: req.body?.location,
      source: req.body?.source,
      author: req.body?.author,
      license: req.body?.license,
      tags: req.body?.tags,
      file: {
        type: 'local',
        path: storedFile.publicPath,
        originalUrl: null
      }
    });
    const newPdf = normalizePdf({
      ...payload,
      id: generatePdfId(pdfs)
    });
    pdfs.unshift(newPdf);
    await writePdfs(pdfs);
    res.status(201).json(newPdf);
  } catch (error) {
    handleError(res, error, 'PDF konnte nicht hochgeladen werden.');
  }
};

export const importPdfFromUrl = async (req, res) => {
  try {
    const url = (req.body?.url || '').trim();
    if (!url) {
      return res.status(400).json({ message: 'URL ist erforderlich.' });
    }
    ensurePdfExtension(url);
    const pdfs = await readPdfs();
    const payload = buildPdfPayload({
      ...req.body,
      title: req.body?.title || url,
      file: {
        type: 'remote',
        originalUrl: url,
        path: ''
      }
    });
    const newPdf = normalizePdf({
      ...payload,
      id: generatePdfId(pdfs)
    });
    pdfs.unshift(newPdf);
    await writePdfs(pdfs);
    res.status(201).json(newPdf);
  } catch (error) {
    handleError(res, error, 'PDF konnte nicht importiert werden.');
  }
};
