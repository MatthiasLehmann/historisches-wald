import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILES_DIR = path.join(__dirname, '..', 'public', 'files');
const IMAGES_DIR = path.join(FILES_DIR, 'images');
const THUMBNAILS_DIR = path.join(IMAGES_DIR, 'thumbnails');
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;
const THUMBNAIL_DIMENSION = 720;
const JPEG_QUALITY = 88;
const THUMBNAIL_QUALITY = 76;

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
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
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

const applyFormat = (pipeline, extension) => {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    case '.png':
      return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    case '.webp':
      return pipeline.webp({ quality: JPEG_QUALITY });
    case '.gif':
      return pipeline.gif();
    case '.tiff':
      return pipeline.tiff({ quality: JPEG_QUALITY });
    case '.bmp':
      return pipeline.bmp();
    case '.svg':
      return pipeline;
    default:
      return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  }
};

const buildOriginalBuffer = async (buffer, extension) => {
  const pipeline = sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    });
  return applyFormat(pipeline, extension).toBuffer();
};

const buildThumbnailBuffer = async (buffer) =>
  sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: THUMBNAIL_DIMENSION,
      height: THUMBNAIL_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: THUMBNAIL_QUALITY, mozjpeg: true })
    .toBuffer();

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
  const thumbnailName = `${path.parse(fileName).name}-thumb.jpg`;
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

  await ensureImagesDir();
  const [originalBuffer, thumbnailBuffer] = await Promise.all([
    buildOriginalBuffer(buffer, extension),
    buildThumbnailBuffer(buffer)
  ]);

  await Promise.all([
    fs.writeFile(targetPath, originalBuffer),
    fs.writeFile(thumbnailPath, thumbnailBuffer)
  ]);

  return {
    publicPath: `/files/images/${fileName}`,
    absolutePath: targetPath,
    thumbnailPublicPath: `/files/images/thumbnails/${thumbnailName}`,
    thumbnailAbsolutePath: thumbnailPath
  };
};
