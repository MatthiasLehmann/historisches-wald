import { Router } from 'express';
import {
  deletePhoto,
  getPhoto,
  getPhotoAlbums,
  getPhotos,
  permanentlyDeletePhoto,
  restorePhoto,
  updatePhoto
} from '../controllers/photosController.js';

const router = Router();

router.get('/', getPhotos);
router.get('/:id', getPhoto);
router.put('/:id', updatePhoto);
router.delete('/:id', deletePhoto);
router.post('/:id/restore', restorePhoto);
router.delete('/:id/permanent', permanentlyDeletePhoto);
router.get('/:id/albums', getPhotoAlbums);

export default router;
