#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const DATA_IMAGES_DIR = path.join(BACKEND_DIR, 'data', 'images');
const PUBLIC_DIR = path.join(BACKEND_DIR, 'public');
const FILES_IMAGES_DIR = path.join(PUBLIC_DIR, 'files', 'images');
const THUMBNAILS_DIR = path.join(FILES_IMAGES_DIR, 'thumbnails');
const FRONTEND_IMAGES_DIR = path.join(REPO_ROOT, 'frontend', 'public');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const THUMB_WIDTH = 720;
const THUMB_HEIGHT = 720;
const THUMB_QUALITY = 76;

const stats = {
  total: 0,
  generated: 0,
  skippedExisting: 0,
  skippedRemote: 0,
  missingSource: 0,
  errors: 0
};

const fileExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const resolveOriginalDiskPath = async (originalPath) => {
  const relativePath = originalPath.replace(/^\/+/, '');
  const candidates = [
    path.join(PUBLIC_DIR, relativePath),
    path.join(FILES_IMAGES_DIR, relativePath.replace(/^files[\\/]/, '')),
    path.join(FRONTEND_IMAGES_DIR, relativePath),
    path.join(FRONTEND_IMAGES_DIR, relativePath.replace(/^files[\\/]/, ''))
  ];
  // dedupe paths
  const uniqueCandidates = Array.from(new Set(candidates));
  for (const candidate of uniqueCandidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
};

const ensureTargetDirs = async () => {
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
};

const sanitizeSlug = (value) => {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return slug || `photo-${Date.now()}`;
};

const buildPreviewLocation = async (photo, originalPath) => {
  const parsed = path.parse(originalPath);
  const base = sanitizeSlug(photo?.id ? `photo-${photo.id}` : parsed.name);

  let attempt = base;
  let index = 1;
  let previewFilename;
  let diskPath;
  do {
    previewFilename = `${attempt}-thumb.jpg`;
    diskPath = path.join(THUMBNAILS_DIR, previewFilename);
    if (!await fileExists(diskPath)) {
      break;
    }
    attempt = `${base}-${index}`;
    index += 1;
  } while (!FORCE);

  return {
    diskPath,
    publicPath: `/files/images/thumbnails/${previewFilename}`
  };
};

const generateThumbnail = async (sourcePath, destinationPath) => {
  const pipeline = sharp(sourcePath, { failOn: 'none' })
    .rotate()
    .resize({
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: THUMB_QUALITY, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  await fs.writeFile(destinationPath, buffer);
};

const updatePhotoJson = async (filePath, data) => {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, serialized, 'utf8');
};

const processPhotoFile = async (fileName) => {
  const filePath = path.join(DATA_IMAGES_DIR, fileName);
  const content = await fs.readFile(filePath, 'utf8');
  const photo = JSON.parse(content);
  stats.total += 1;

  const originalPath = (photo?.original || '').trim();
  if (!originalPath || /^https?:\/\//i.test(originalPath)) {
    stats.skippedRemote += 1;
    return;
  }

  if (!FORCE && photo.preview && photo.preview.startsWith('/files/images/thumbnails/')) {
    const previewDiskPath = path.join(PUBLIC_DIR, photo.preview.replace(/^\/+/, ''));
    if (await fileExists(previewDiskPath)) {
      stats.skippedExisting += 1;
      return;
    }
  }

  const sourceDiskPath = await resolveOriginalDiskPath(originalPath);
  if (!sourceDiskPath) {
    stats.missingSource += 1;
    console.warn(`⚠️  Quelle nicht gefunden für ${fileName} (${originalPath})`);
    return;
  }

  const { diskPath, publicPath } = await buildPreviewLocation(photo, originalPath);

  if (DRY_RUN) {
    console.log(`[dry-run] Würde Thumbnail für ${fileName} erzeugen -> ${publicPath}`);
    stats.generated += 1;
    return;
  }

  await generateThumbnail(sourceDiskPath, diskPath);
  photo.preview = publicPath;
  await updatePhotoJson(filePath, photo);
  stats.generated += 1;
  console.log(`✅ Thumbnail erstellt für ${fileName} -> ${publicPath}`);
};

const main = async () => {
  await ensureTargetDirs();
  const entries = await fs.readdir(DATA_IMAGES_DIR);
  const photoFiles = entries.filter((name) => name.startsWith('photo_') && name.endsWith('.json'));
  for (const fileName of photoFiles) {
    try {
      await processPhotoFile(fileName);
    } catch (error) {
      stats.errors += 1;
      console.error(`❌ Fehler bei ${fileName}:`, error.message);
    }
  }

  console.log('\n=== Zusammenfassung ===');
  console.log(`Fotos gesamt:      ${stats.total}`);
  console.log(`Neu erzeugt:       ${stats.generated}`);
  console.log(`Übersprungen (Preview vorhanden): ${stats.skippedExisting}`);
  console.log(`Übersprungen (Remote):            ${stats.skippedRemote}`);
  console.log(`Quelle fehlt:      ${stats.missingSource}`);
  console.log(`Fehler:            ${stats.errors}`);
  if (DRY_RUN) {
    console.log('\nNur Probe-Durchlauf (--dry-run). Ohne diesen Schalter werden Dateien geschrieben.');
  }
};

main().catch((error) => {
  console.error('Unerwarteter Fehler:', error);
  process.exitCode = 1;
});
