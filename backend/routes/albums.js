import { Router } from 'express';
import { getAlbum, getAlbumPhotos, getAlbums, updateAlbum } from '../controllers/albumsController.js';

const router = Router();

router.get('/', getAlbums);
router.get('/:id', getAlbum);
router.put('/:id', updateAlbum);
router.get('/:id/photos', getAlbumPhotos);

export default router;
