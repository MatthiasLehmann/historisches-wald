import { findAlbumsByPhotoId } from '../services/albumsService.js';
import { getPhotoById, updatePhotoById } from '../services/photosService.js';

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
