import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/svg+xml': '.svg'
};

const ALLOWED_EXTENSIONS = new Set(Object.values(MIME_EXTENSION_MAP));
ALLOWED_EXTENSIONS.add('.jpeg');

const ensureImagesDir = async () => {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
};

const normalizeBase64 = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) {
    const error = new Error('Bilddaten fehlen.');
    error.statusCode = 400;
    throw error;
  }
  const parts = trimmed.split('base64,');
  return parts.length > 1 ? parts.pop() : trimmed;
};

const resolveExtension = (originalName = '', mimeType = '') => {
  const extFromName = path.extname(originalName).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(extFromName)) {
    return extFromName;
  }
  if (mimeType && MIME_EXTENSION_MAP[mimeType]) {
    return MIME_EXTENSION_MAP[mimeType];
  }
  return '.jpg';
};

export const saveBase64Image = async ({ data, mimeType, originalName }) => {
  if (mimeType && !MIME_EXTENSION_MAP[mimeType]) {
    const error = new Error('Nur Bilddateien sind erlaubt.');
    error.statusCode = 400;
    throw error;
  }
  const normalized = normalizeBase64(data);
  let buffer;
  try {
    buffer = Buffer.from(normalized, 'base64');
  } catch (error) {
    const err = new Error('Bild konnte nicht dekodiert werden.');
    err.statusCode = 400;
    throw err;
  }

  if (!buffer || buffer.length === 0) {
    const error = new Error('Bilddaten sind leer.');
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    const error = new Error('Bild ist zu groß (maximal 25 MB).');
    error.statusCode = 400;
    throw error;
  }

  const extension = resolveExtension(originalName, mimeType);
  const fileName = `album-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const targetPath = path.join(IMAGES_DIR, fileName);

  await ensureImagesDir();
  await fs.writeFile(targetPath, buffer);

  return {
    publicPath: `/images/${fileName}`,
    absolutePath: targetPath
  };
};
