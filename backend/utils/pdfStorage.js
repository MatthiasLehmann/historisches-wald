import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_DIR = path.join(__dirname, '..', 'public', 'files', 'pdf');
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf']);

const ensurePdfDir = async () => {
  await fs.mkdir(PDF_DIR, { recursive: true });
};

const normalizeBase64 = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) {
    const error = new Error('PDF-Daten fehlen.');
    error.statusCode = 400;
    throw error;
  }
  const marker = 'base64,';
  const markerIndex = trimmed.indexOf(marker);
  return markerIndex >= 0 ? trimmed.slice(markerIndex + marker.length) : trimmed;
};

const sanitizeFileStem = (value = '') => {
  if (!value) {
    return 'upload';
  }
  const normalized = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'upload';
};

const ensurePdfExtension = (value) => (value.toLowerCase().endsWith('.pdf') ? value : `${value}.pdf`);

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const generateFileName = async (originalName = '') => {
  const parsed = path.parse(originalName);
  const base = sanitizeFileStem(parsed.name);
  let candidate = ensurePdfExtension(base);
  let attempt = 1;
  while (await fileExists(path.join(PDF_DIR, candidate))) {
    candidate = ensurePdfExtension(`${base}-${attempt}`);
    attempt += 1;
  }
  return candidate;
};

export const saveBase64Pdf = async ({ data, mimeType, originalName }) => {
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    const error = new Error('Nur PDF-Dateien sind erlaubt.');
    error.statusCode = 400;
    throw error;
  }
  const normalized = normalizeBase64(data);
  let buffer;
  try {
    buffer = Buffer.from(normalized, 'base64');
  } catch {
    const error = new Error('PDF konnte nicht dekodiert werden.');
    error.statusCode = 400;
    throw error;
  }
  if (!buffer || buffer.length === 0) {
    const error = new Error('PDF-Daten sind leer.');
    error.statusCode = 400;
    throw error;
  }
  if (buffer.length > MAX_PDF_BYTES) {
    const error = new Error('PDF ist zu groß (maximal 50 MB).');
    error.statusCode = 400;
    throw error;
  }

  await ensurePdfDir();
  const fileName = await generateFileName(originalName);
  const targetPath = path.join(PDF_DIR, fileName);
  await fs.writeFile(targetPath, buffer);

  return {
    absolutePath: targetPath,
    publicPath: `/files/pdf/${fileName}`,
    fileName
  };
};
