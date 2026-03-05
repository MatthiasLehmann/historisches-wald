import { promises as fs } from 'fs';
import {
  addPhotoToAlbum,
  createAlbum as createAlbumEntry,
  ensureUnassignedAlbum,
  getAlbumById,
  listAlbums,
  removePhotoFromAlbum,
  updateAlbumById
} from '../services/albumsService.js';
import { createPhoto, getPhotoById, getPhotosByIds, updatePhotoById } from '../services/photosService.js';
import { saveBase64Image } from '../utils/imageStorage.js';

export const getAlbums = async (_req, res, next) => {
  try {
    const albums = await listAlbums();
    res.json(albums);
  } catch (error) {
    next(error);
  }
};

export const getAlbum = async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id);
    res.json(album);
  } catch (error) {
    next(error);
  }
};

export const updateAlbum = async (req, res, next) => {
  try {
    const updated = await updateAlbumById(req.params.id, req.body || {});
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getAlbumPhotos = async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id);
    const photos = await getPhotosByIds(album.photos);
    res.json(photos);
  } catch (error) {
    next(error);
  }
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

export const createAlbum = async (req, res, next) => {
  try {
    const album = await createAlbumEntry(req.body || {});
    res.status(201).json(album);
  } catch (error) {
    next(error);
  }
};

export const createAlbumPhoto = async (req, res, next) => {
  const albumId = req.params.id;
  let storedFile;
  try {
    await getAlbumById(albumId);
    const filePayload = req.body?.file;
    if (!filePayload || !filePayload.data) {
      const error = new Error('Eine Bilddatei ist erforderlich.');
      error.statusCode = 400;
      throw error;
    }

    storedFile = await saveBase64Image({
      data: filePayload.data,
      mimeType: filePayload.type,
      originalName: filePayload.name
    });

    const photo = await createPhoto({
      name: trimString(req.body?.name) || filePayload.name || 'Neues Foto',
      description: trimString(req.body?.description),
      date_taken: trimString(req.body?.date_taken),
      original: storedFile.publicPath,
      preview: storedFile.thumbnailPublicPath,
      albums: [albumId],
      tags: req.body?.tags,
      review: {}
    });

    const updatedAlbum = await addPhotoToAlbum(albumId, photo.id, {
      setCover: parseBoolean(req.body?.set_as_cover),
      coverPhoto: storedFile.thumbnailPublicPath || storedFile.publicPath
    });

    res.status(201).json({ album: updatedAlbum, photo });
  } catch (error) {
    if (storedFile?.absolutePath) {
      await fs.unlink(storedFile.absolutePath).catch(() => {});
    }
    next(error);
  }
};

export const removeAlbumPhoto = async (req, res, next) => {
  try {
    const albumId = req.params.id;
    const photoId = req.params.photoId;
    const photo = await getPhotoById(photoId);

    const updatedAlbum = await removePhotoFromAlbum(albumId, photoId);
    const unassignedAlbum = await ensureUnassignedAlbum();

    const existingAlbums = Array.isArray(photo.albums) ? photo.albums.map((id) => String(id)) : [];
    const remainingAlbums = existingAlbums.filter((id) => id !== albumId);
    if (!remainingAlbums.includes(unassignedAlbum.id)) {
      remainingAlbums.unshift(unassignedAlbum.id);
    }

    const updatedPhoto = await updatePhotoById(photoId, { albums: remainingAlbums });
    await addPhotoToAlbum(unassignedAlbum.id, photoId);

    res.json({
      album: updatedAlbum,
      unassignedAlbum,
      photo: updatedPhoto
    });
  } catch (error) {
    next(error);
  }
};
