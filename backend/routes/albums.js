import { Router } from 'express';
import {
  createAlbum,
  createAlbumPhoto,
  deleteAlbum,
  getAlbum,
  getAlbumPhotos,
  getAlbums,
  removeAlbumPhoto,
  updateAlbumPhotoOrder,
  updateAlbum
} from '../controllers/albumsController.js';

const router = Router();

router.get('/', getAlbums);
router.post('/', createAlbum);
router.get('/:id', getAlbum);
router.put('/:id', updateAlbum);
router.delete('/:id', deleteAlbum);
router.post('/:id/photos', createAlbumPhoto);
router.get('/:id/photos', getAlbumPhotos);
router.put('/:id/photos/order', updateAlbumPhotoOrder);
router.delete('/:id/photos/:photoId', removeAlbumPhoto);

export default router;
