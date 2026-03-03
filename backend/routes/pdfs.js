import { Router } from 'express';
import {
  addReviewComment,
  completeReview,
  createPdf,
  deletePdf,
  getPdf,
  importPdfFromFile,
  importPdfFromUrl,
  listLocalPdfFiles,
  listPdfs,
  updatePdf,
  updateReviewStatus
} from '../controllers/pdfsController.js';

const router = Router();

router.get('/', listPdfs);
router.get('/files/local', listLocalPdfFiles);
router.post('/', createPdf);
router.post('/import-url', importPdfFromUrl);
router.post('/import-file', importPdfFromFile);
router.get('/:id', getPdf);
router.put('/:id', updatePdf);
router.delete('/:id', deletePdf);
router.post('/:id/review/comment', addReviewComment);
router.put('/:id/review/status', updateReviewStatus);
router.put('/:id/review/complete', completeReview);

export default router;
