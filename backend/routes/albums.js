import { Router } from 'express';
import {
  createAlbum,
  createAlbumPhoto,
  getAlbum,
  getAlbumPhotos,
  getAlbums,
  removeAlbumPhoto,
  updateAlbum
} from '../controllers/albumsController.js';

const router = Router();

router.get('/', getAlbums);
router.post('/', createAlbum);
router.get('/:id', getAlbum);
router.put('/:id', updateAlbum);
router.post('/:id/photos', createAlbumPhoto);
router.get('/:id/photos', getAlbumPhotos);
router.delete('/:id/photos/:photoId', removeAlbumPhoto);

export default router;
