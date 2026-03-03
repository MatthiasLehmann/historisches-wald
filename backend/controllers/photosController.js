import { findAlbumsByPhotoId } from '../services/albumsService.js';
import { getPhotoById, listPhotos, updatePhotoById } from '../services/photosService.js';

export const getPhotos = async (req, res, next) => {
  try {
    let photos = await listPhotos();
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

export const getPhotoAlbums = async (req, res, next) => {
  try {
    const albums = await findAlbumsByPhotoId(req.params.id);
    res.json(albums);
  } catch (error) {
    next(error);
  }
};
