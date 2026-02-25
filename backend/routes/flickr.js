import { Router } from 'express';
import { searchFlickr } from '../controllers/flickrController.js';

const router = Router();

router.get('/search', searchFlickr);

export default router;
