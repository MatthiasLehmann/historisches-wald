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
  photos: Array.isArray(album.photos) ? album.photos.map((photoId) => String(photoId)) : []
});

const sanitizeAlbumInput = (input = {}, existing = {}) => {
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

  if (Object.keys(payload).length === 0) {
    const error = new Error('No editable album fields provided.');
    error.statusCode = 400;
    throw error;
  }

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

  const updatedRaw = sanitizeAlbumInput(input, payload.albums[index]);
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
