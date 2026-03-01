import { getAlbumById, listAlbums, updateAlbumById } from '../services/albumsService.js';
import { getPhotosByIds } from '../services/photosService.js';

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
