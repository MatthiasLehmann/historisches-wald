import { Router } from 'express';
import {
  getPublicDocument,
  getPublicHome,
  getPublicPhoto,
  listPublicAlbumPhotos,
  listPublicAlbums,
  listPublicDocuments,
  searchPublicContent
} from '../controllers/publicController.js';

const router = Router();

router.get('/home', getPublicHome);
router.get('/documents', listPublicDocuments);
router.get('/documents/:id', getPublicDocument);
router.get('/albums', listPublicAlbums);
router.get('/albums/:id/photos', listPublicAlbumPhotos);
router.get('/photos/:id', getPublicPhoto);
router.get('/search', searchPublicContent);

export default router;
