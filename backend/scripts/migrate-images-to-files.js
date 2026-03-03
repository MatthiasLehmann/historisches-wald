#!/usr/bin/env node

/**
 * Moves large originals from frontend/public/images to backend/public/files/images
 * and rewrites photo_*.json entries to point to /files/images/... .
 *
 * Usage:
 *   node backend/scripts/migrate-images-to-files.js            # real run
 *   node backend/scripts/migrate-images-to-files.js --dry-run # simulate
 *
 * The script is idempotent: already-moved files or rewritten JSON entries are skipped.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');
const SOURCE_IMAGES_DIR = path.join(FRONTEND_DIR, 'public', 'images');
const TARGET_IMAGES_DIR = path.join(BACKEND_DIR, 'public', 'files', 'images');
const DATA_IMAGES_DIR = path.join(BACKEND_DIR, 'data', 'images');

const DRY_RUN = process.argv.includes('--dry-run');

const stats = {
  totalFiles: 0,
  movedFiles: 0,
  skippedExisting: 0,
  jsonUpdated: 0,
  jsonSkipped: 0,
  errors: 0
};

const ensureTargetDir = async () => fs.mkdir(TARGET_IMAGES_DIR, { recursive: true });

const isFile = async (entryPath) => {
  try {
    const stat = await fs.stat(entryPath);
    return stat.isFile();
  } catch {
    return false;
  }
};

const renameWithFallback = async (source, destination) => {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code === 'EXDEV') {
      const data = await fs.readFile(source);
      await fs.writeFile(destination, data);
      await fs.unlink(source);
    } else {
      throw error;
    }
  }
};

const moveImages = async () => {
  await ensureTargetDir();
  let entries = [];
  try {
    entries = await fs.readdir(SOURCE_IMAGES_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️  Quelle frontend/public/images wurde nicht gefunden – überspringe Dateiverschiebung.');
      return new Set();
    }
    throw error;
  }
  const movedNames = new Set();
  for (const entry of entries) {
    const sourcePath = path.join(SOURCE_IMAGES_DIR, entry);
    if (!(await isFile(sourcePath))) {
      continue;
    }
    stats.totalFiles += 1;
    const targetPath = path.join(TARGET_IMAGES_DIR, entry);
    if (await isFile(targetPath)) {
      stats.skippedExisting += 1;
      movedNames.add(entry);
      continue;
    }
    if (DRY_RUN) {
      console.log(`[dry-run] move ${sourcePath} -> ${targetPath}`);
      stats.movedFiles += 1;
      movedNames.add(entry);
      continue;
    }
    await renameWithFallback(sourcePath, targetPath);
    stats.movedFiles += 1;
    movedNames.add(entry);
  }
  return movedNames;
};

const updatePhotoJsons = async (availableNames) => {
  let files = [];
  try {
    files = await fs.readdir(DATA_IMAGES_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️  Keine photo_*.json Dateien gefunden.');
      return;
    }
    throw error;
  }
  const photoFiles = files.filter((name) => name.startsWith('photo_') && name.endsWith('.json'));
  for (const fileName of photoFiles) {
    const absolute = path.join(DATA_IMAGES_DIR, fileName);
    try {
      const raw = await fs.readFile(absolute, 'utf8');
      const payload = JSON.parse(raw);
      const original = payload?.original || '';
      const preview = payload?.preview || '';
      let changed = false;

      const updatePath = (value) => {
        if (typeof value !== 'string') {
          return value;
        }
        if (!value.startsWith('/images/')) {
          return value;
        }
        const basename = path.basename(value);
        if (availableNames.size > 0 && !availableNames.has(basename)) {
          // File may have been moved earlier; still rewrite path.
          return `/files/images/${basename}`;
        }
        return `/files/images/${basename}`;
      };

      if (original.startsWith('/images/')) {
        const next = updatePath(original);
        if (next !== original) {
          payload.original = next;
          changed = true;
        }
      }

      if (preview && preview.startsWith('/images/')) {
        const nextPreview = updatePath(preview);
        if (nextPreview !== preview) {
          payload.preview = nextPreview;
          changed = true;
        }
      }

      if (!changed) {
        stats.jsonSkipped += 1;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[dry-run] rewrite ${fileName}`);
        stats.jsonUpdated += 1;
        continue;
      }
      const serialized = `${JSON.stringify(payload, null, 2)}\n`;
      await fs.writeFile(absolute, serialized, 'utf8');
      stats.jsonUpdated += 1;
      console.log(`Updated ${fileName}`);
    } catch (error) {
      stats.errors += 1;
      console.error(`❌ Fehler beim Verarbeiten von ${fileName}:`, error);
    }
  }
};

const main = async () => {
  const movedNames = await moveImages();
  await updatePhotoJsons(movedNames);

  console.log('\n=== Zusammenfassung ===');
  console.log(`Assets insgesamt gesichtet: ${stats.totalFiles}`);
  console.log(`Davon verschoben:          ${stats.movedFiles}`);
  console.log(`Bereits vorhanden:         ${stats.skippedExisting}`);
  console.log(`Photo JSONs aktualisiert:  ${stats.jsonUpdated}`);
  console.log(`Photo JSONs unverändert:   ${stats.jsonSkipped}`);
  console.log(`Fehler:                    ${stats.errors}`);
  if (DRY_RUN) {
    console.log('\nHinweis: Es wurden keine Dateien geändert (dry-run).');
  }
};

main().catch((error) => {
  console.error('Unerwarteter Fehler:', error);
  process.exitCode = 1;
});
