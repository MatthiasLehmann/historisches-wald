import { getAlbumsFilePath } from '../config/mediaConfig.js';
import { readJsonFile, writeJsonFile } from '../utils/jsonStorage.js';

const emptyAlbumsPayload = { albums: [] };

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAlbum = (album) => ({
  id: album.id,
  title: album.title ?? '',
  description: album.description ?? '',
  url: album.url ?? '',
  cover_photo: album.cover_photo ?? '',
  photo_count: toNumber(album.photo_count, Array.isArray(album.photos) ? album.photos.length : 0),
  created: toNumber(album.created),
  last_updated: toNumber(album.last_updated),
  parent_id: album.parent_id ? String(album.parent_id) : '',
  photos: Array.isArray(album.photos) ? album.photos.map((photoId) => String(photoId)) : []
});

const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

const generateAlbumId = (albums = []) => {
  const existingIds = new Set(albums.map((album) => String(album.id)));
  for (let i = 0; i < 10; i += 1) {
    const candidate = `local_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  const error = new Error('Konnte keine eindeutige Album-ID erzeugen.');
  error.statusCode = 500;
  throw error;
};

const sanitizeParentId = (parentId, albumId, albums) => {
  if (!parentId && parentId !== '') {
    return albumId ? (albums.find((album) => album.id === albumId)?.parent_id ?? '') : '';
  }
  const trimmed = typeof parentId === 'string' ? parentId.trim() : String(parentId);
  if (!trimmed) {
    return '';
  }
  if (albumId && trimmed === albumId) {
    const error = new Error('Ein Album kann nicht sich selbst untergeordnet werden.');
    error.statusCode = 400;
    throw error;
  }
  const exists = albums.some((album) => album.id === trimmed);
  if (!exists) {
    const error = new Error(`Übergeordnetes Album ${trimmed} existiert nicht.`);
    error.statusCode = 400;
    throw error;
  }
  return trimmed;
};

const sanitizeAlbumInput = (input = {}, existing = {}, albums = []) => {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) {
      const error = new Error('Title is required.');
      error.statusCode = 400;
      throw error;
    }
    payload.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    payload.description = typeof input.description === 'string' ? input.description.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(input, 'cover_photo')) {
    payload.cover_photo = typeof input.cover_photo === 'string' ? input.cover_photo.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(input, 'parent_id')) {
    payload.parent_id = sanitizeParentId(input.parent_id, existing.id, albums);
  }

  if (Object.keys(payload).length === 0) {
    const error = new Error('No editable album fields provided.');
    error.statusCode = 400;
    throw error;
  }

  payload.last_updated = getUnixTimestamp();

  return { ...existing, ...payload };
};

const loadAlbumsRaw = async () => {
  const data = await readJsonFile(getAlbumsFilePath(), emptyAlbumsPayload);
  if (!data || typeof data !== 'object') {
    return { ...emptyAlbumsPayload };
  }
  return {
    albums: Array.isArray(data.albums) ? data.albums : []
  };
};

const saveAlbumsRaw = async (payload) => writeJsonFile(getAlbumsFilePath(), payload);

export const listAlbums = async () => {
  const { albums } = await loadAlbumsRaw();
  return albums.map(normalizeAlbum);
};

export const getAlbumById = async (albumId) => {
  const { albums } = await loadAlbumsRaw();
  const album = albums.find((entry) => entry.id === albumId);
  if (!album) {
    const error = new Error(`Album ${albumId} not found.`);
    error.statusCode = 404;
    throw error;
  }
  return normalizeAlbum(album);
};

export const updateAlbumById = async (albumId, input) => {
  const payload = await loadAlbumsRaw();
  const index = payload.albums.findIndex((entry) => entry.id === albumId);
  if (index === -1) {
    const error = new Error(`Album ${albumId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const updatedRaw = sanitizeAlbumInput(input, payload.albums[index], payload.albums);
  payload.albums[index] = updatedRaw;
  await saveAlbumsRaw(payload);

  return normalizeAlbum(updatedRaw);
};

export const findAlbumsByPhotoId = async (photoId) => {
  const { albums } = await loadAlbumsRaw();
  return albums
    .filter((album) => Array.isArray(album.photos) && album.photos.map(String).includes(String(photoId)))
    .map(normalizeAlbum);
};

export const createAlbum = async (input = {}) => {
  const payload = await loadAlbumsRaw();
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    const error = new Error('Titel ist erforderlich.');
    error.statusCode = 400;
    throw error;
  }

  const now = getUnixTimestamp();
  const newAlbum = {
    id: generateAlbumId(payload.albums),
    title,
    description: typeof input.description === 'string' ? input.description.trim() : '',
    url: typeof input.url === 'string' ? input.url.trim() : '',
    cover_photo: typeof input.cover_photo === 'string' ? input.cover_photo.trim() : '',
    photo_count: 0,
    created: now,
    last_updated: now,
    parent_id: sanitizeParentId(input.parent_id ?? '', null, payload.albums),
    photos: []
  };

  payload.albums.unshift(newAlbum);
  await saveAlbumsRaw(payload);
  return normalizeAlbum(newAlbum);
};

export const addPhotoToAlbum = async (albumId, photoId, options = {}) => {
  const payload = await loadAlbumsRaw();
  const index = payload.albums.findIndex((entry) => entry.id === albumId);
  if (index === -1) {
    const error = new Error(`Album ${albumId} not found.`);
    error.statusCode = 404;
    throw error;
  }
  const album = payload.albums[index];
  const normalizedPhotoId = String(photoId);
  const existingPhotos = Array.isArray(album.photos) ? album.photos.map((value) => String(value)) : [];

  if (!existingPhotos.includes(normalizedPhotoId)) {
    album.photos = [normalizedPhotoId, ...existingPhotos];
  } else {
    album.photos = existingPhotos;
  }

  album.photo_count = album.photos.length;
  album.last_updated = getUnixTimestamp();

  if (options.setCover && typeof options.coverPhoto === 'string' && options.coverPhoto.trim()) {
    album.cover_photo = options.coverPhoto.trim();
  }

  payload.albums[index] = album;
  await saveAlbumsRaw(payload);

  return normalizeAlbum(album);
};
