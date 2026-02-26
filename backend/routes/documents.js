import { Router } from 'express';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentReview,
  addReviewComment,
  updateReviewStatus,
  completeReview
} from '../controllers/documentsController.js';

const router = Router();

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.get('/:id/review', getDocumentReview);
router.post('/:id/review/comment', addReviewComment);
router.put('/:id/review/status', updateReviewStatus);
router.put('/:id/review/complete', completeReview);

router.route('/:id')
  .put(updateDocument)
  .delete(deleteDocument);

export default router;
