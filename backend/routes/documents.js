import { Router } from 'express';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documentsController.js';

const router = Router();

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id')
  .put(updateDocument)
  .delete(deleteDocument);

export default router;
