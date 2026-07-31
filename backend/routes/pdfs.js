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
  permanentlyDeletePdf,
  restorePdf,
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
router.post('/:id/restore', restorePdf);
router.delete('/:id/permanent', permanentlyDeletePdf);
router.post('/:id/review/comment', addReviewComment);
router.put('/:id/review/status', updateReviewStatus);
router.put('/:id/review/complete', completeReview);

export default router;
