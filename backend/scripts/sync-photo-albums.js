#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const DATA_DIR = path.join(BACKEND_DIR, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const writeJson = async (filePath, data) => {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, 'utf8');
};

const buildAlbumLookup = (albums = []) => {
  const lookup = new Map();

  albums.forEach((album) => {
    const albumId = album?.id;
    if (!albumId) {
      return;
    }
    const meta = {
      id: String(albumId),
      title: album?.title ?? '',
      url: album?.url ?? ''
    };
    const photoIds = Array.isArray(album?.photos) ? album.photos : [];
    photoIds.forEach((photoId) => {
      if (photoId === undefined || photoId === null) {
        return;
      }
      const normalized = String(photoId);
      if (!lookup.has(normalized)) {
        lookup.set(normalized, new Map());
      }
      lookup.get(normalized).set(meta.id, meta);
    });
  });

  return lookup;
};

const stats = {
  processed: 0,
  matched: 0,
  updated: 0,
  alreadyLinked: 0,
  missingLookup: 0,
  errors: 0
};

const determineFormat = (photo, currentAlbums) => {
  if (currentAlbums.some((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))) {
    return 'object';
  }
  if (currentAlbums.length > 0) {
    return 'id';
  }
  return typeof photo?.id === 'string' && photo.id.startsWith('local_') ? 'id' : 'object';
};

const normalizeExistingIds = (currentAlbums) => {
  const ids = new Set();
  currentAlbums.forEach((entry) => {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    } else if (typeof entry === 'number') {
      ids.add(String(entry));
    } else if (entry && typeof entry === 'object' && entry.id) {
      ids.add(String(entry.id));
    }
  });
  return ids;
};

const processPhoto = async (filePath, lookup, remainingRefs) => {
  const fileContent = await readJson(filePath);
  const photoId = fileContent?.id ? String(fileContent.id) : null;
  stats.processed += 1;

  if (!photoId) {
    console.warn(`⚠️  ${path.basename(filePath)} enthält keine Foto-ID.`);
    stats.errors += 1;
    return;
  }

  remainingRefs.delete(photoId);

  const albumEntries = lookup.get(photoId);
  if (!albumEntries || albumEntries.size === 0) {
    stats.missingLookup += 1;
    return;
  }

  stats.matched += 1;

  const currentAlbums = Array.isArray(fileContent.albums) ? fileContent.albums : [];
  const existingIds = normalizeExistingIds(currentAlbums);
  const desiredAlbums = Array.from(albumEntries.values());
  const missingAlbums = desiredAlbums.filter((album) => !existingIds.has(album.id));

  if (missingAlbums.length === 0) {
    stats.alreadyLinked += 1;
    return;
  }

  const format = determineFormat(fileContent, currentAlbums);
  if (format === 'object') {
    const additions = missingAlbums.map((album) => ({
      id: album.id,
      title: album.title ?? '',
      url: album.url ?? ''
    }));
    fileContent.albums = [...currentAlbums, ...additions];
  } else {
    const additions = missingAlbums.map((album) => album.id);
    fileContent.albums = [...currentAlbums, ...additions];
  }

  if (fileContent.updatedAt) {
    fileContent.updatedAt = new Date().toISOString();
  }

  if (DRY_RUN) {
    if (VERBOSE) {
      console.log(
        `[dry-run] ${path.basename(filePath)}: +${missingAlbums.length} Albumverknüpfungen`
      );
    }
  } else {
    await writeJson(filePath, fileContent);
    if (VERBOSE) {
      console.log(`✅ ${path.basename(filePath)} → ${missingAlbums.length} neue Albumverknüpfungen`);
    }
  }
  stats.updated += 1;
};

const main = async () => {
  const albumsJson = await readJson(ALBUMS_FILE);
  const albums = Array.isArray(albumsJson?.albums) ? albumsJson.albums : [];
  const albumLookup = buildAlbumLookup(albums);

  const remainingRefs = new Set(albumLookup.keys());
  const files = await fs.readdir(IMAGES_DIR);

  for (const fileName of files) {
    if (!fileName.endsWith('.json') || !fileName.startsWith('photo_')) {
      continue;
    }
    const filePath = path.join(IMAGES_DIR, fileName);
    try {
      await processPhoto(filePath, albumLookup, remainingRefs);
    } catch (error) {
      stats.errors += 1;
      console.error(`❌ Fehler bei ${fileName}:`, error);
    }
  }

  if (remainingRefs.size > 0) {
    const sample = Array.from(remainingRefs).slice(0, 20);
    console.warn(
      `⚠️  ${remainingRefs.size} Albumverknüpfungen verweisen auf fehlende Foto-Dateien. Beispiele: ${sample.join(
        ', '
      )}`
    );
  }

  console.log('---');
  console.log(`Verarbeitete Fotos: ${stats.processed}`);
  console.log(`Mit Album-Referenzen: ${stats.matched}`);
  console.log(`Aktualisiert: ${stats.updated}`);
  console.log(`Bereits vollständig: ${stats.alreadyLinked}`);
  console.log(`Ohne Album-Lookup: ${stats.missingLookup}`);
  console.log(`Fehler: ${stats.errors}`);

  if (DRY_RUN) {
    console.log('Hinweis: --dry-run war aktiv, es wurden keine Dateien geändert.');
  }
};

main().catch((error) => {
  console.error('❌ Unerwarteter Fehler:', error);
  process.exitCode = 1;
});
