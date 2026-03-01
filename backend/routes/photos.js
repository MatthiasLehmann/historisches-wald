import { Router } from 'express';
import { getPhoto, getPhotoAlbums, updatePhoto } from '../controllers/photosController.js';

const router = Router();

router.get('/:id', getPhoto);
router.put('/:id', updatePhoto);
router.get('/:id/albums', getPhotoAlbums);

export default router;
