import { Router } from 'express';
import {
  addReviewComment,
  completeReview,
  createPdf,
  deletePdf,
  getPdf,
  importPdfFromUrl,
  listPdfs,
  updatePdf,
  updateReviewStatus
} from '../controllers/pdfsController.js';

const router = Router();

router.get('/', listPdfs);
router.post('/', createPdf);
router.post('/import-url', importPdfFromUrl);
router.get('/:id', getPdf);
router.put('/:id', updatePdf);
router.delete('/:id', deletePdf);
router.post('/:id/review/comment', addReviewComment);
router.put('/:id/review/status', updateReviewStatus);
router.put('/:id/review/complete', completeReview);

export default router;
