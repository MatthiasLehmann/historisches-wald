import path from 'path';
import { fileURLToPath } from 'url';
import { findAlbumsByPhotoId, removePhotoFromAllAlbums } from '../services/albumsService.js';
import {
  getPhotoById,
  listPhotos,
  permanentlyDeletePhotoById,
  restorePhotoById,
  trashPhotoById,
  updatePhotoById
} from '../services/photosService.js';
import { readJsonArray, writeJsonArray } from '../utils/jsonStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCUMENTS_FILE = path.join(__dirname, '..', 'data', 'documents.json');

const persistDocumentPhotoRemoval = async (photoId) => {
  const documents = await readJsonArray(DOCUMENTS_FILE);
  let changed = false;
  const normalizedPhotoId = String(photoId);
  const updated = documents.map((doc) => {
    const albumPhotoIds = Array.isArray(doc.albumPhotoIds) ? doc.albumPhotoIds.map(String) : [];
    const coverPhotoId = doc.coverPhotoId ? String(doc.coverPhotoId) : '';
    const nextAlbumPhotoIds = albumPhotoIds.filter((id) => id !== normalizedPhotoId);
    const nextCoverPhotoId = coverPhotoId === normalizedPhotoId ? '' : doc.coverPhotoId;
    if (nextAlbumPhotoIds.length === albumPhotoIds.length && nextCoverPhotoId === doc.coverPhotoId) {
      return doc;
    }
    changed = true;
    return {
      ...doc,
      albumPhotoIds: nextAlbumPhotoIds,
      coverPhotoId: nextCoverPhotoId
    };
  });
  if (changed) {
    await writeJsonArray(DOCUMENTS_FILE, updated);
  }
};

export const getPhotos = async (req, res, next) => {
  try {
    const trashOnly = req.query?.trash === 'true' || req.query?.deleted === 'only';
    const includeDeleted = req.query?.includeDeleted === 'true' || req.query?.deleted === 'all';
    let photos = await listPhotos({ trashOnly, includeDeleted });
    const idsParam = req.query?.ids;
    if (idsParam) {
      const idSet = new Set(
        idsParam
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      );
      photos = photos.filter((photo) => idSet.has(String(photo.id)));
    }
    const searchQuery = (req.query?.search ?? req.query?.q ?? '').trim().toLowerCase();
    if (searchQuery) {
      photos = photos.filter((photo) => (photo.name || '').toLowerCase().includes(searchQuery));
    }
    res.json(photos);
  } catch (error) {
    next(error);
  }
};

export const getPhoto = async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id);
    res.json(photo);
  } catch (error) {
    next(error);
  }
};

export const updatePhoto = async (req, res, next) => {
  try {
    const photo = await updatePhotoById(req.params.id, req.body || {});
    res.json(photo);
  } catch (error) {
    next(error);
  }
};

export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await trashPhotoById(req.params.id);
    res.json(photo);
  } catch (error) {
    next(error);
  }
};

export const restorePhoto = async (req, res, next) => {
  try {
    const photo = await restorePhotoById(req.params.id);
    res.json(photo);
  } catch (error) {
    next(error);
  }
};

export const permanentlyDeletePhoto = async (req, res, next) => {
  try {
    await permanentlyDeletePhotoById(req.params.id);
    await removePhotoFromAllAlbums(req.params.id);
    await persistDocumentPhotoRemoval(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getPhotoAlbums = async (req, res, next) => {
  try {
    const albums = await findAlbumsByPhotoId(req.params.id);
    res.json(albums);
  } catch (error) {
    next(error);
  }
};
