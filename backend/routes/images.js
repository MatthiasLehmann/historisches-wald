import { Router } from 'express';
import {
  addReviewComment,
  completeReview,
  createImage,
  deleteImage,
  getImage,
  importImageFromUrl,
  listImages,
  updateImage,
  updateReviewStatus
} from '../controllers/imagesController.js';

const router = Router();

router.get('/', listImages);
router.post('/', createImage);
router.post('/import-url', importImageFromUrl);
router.get('/:id', getImage);
router.put('/:id', updateImage);
router.delete('/:id', deleteImage);
router.post('/:id/review/comment', addReviewComment);
router.put('/:id/review/status', updateReviewStatus);
router.put('/:id/review/complete', completeReview);

export default router;
