import { readDocuments } from './documentsController.js';
import { readImages } from '../models/imagesModel.js';
import { readPdfs } from '../models/pdfsModel.js';

const REVIEW_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

const initStatusBucket = () =>
  REVIEW_STATUSES.reduce(
    (bucket, status) => ({
      ...bucket,
      [status]: 0
    }),
    { other: 0 }
  );

const countStatuses = (items, getStatus) => {
  const bucket = initStatusBucket();
  items.forEach((item) => {
    const status = getStatus(item);
    if (REVIEW_STATUSES.includes(status)) {
      bucket[status] += 1;
    } else {
      bucket.other += 1;
    }
  });
  return bucket;
};

const summarizeDocuments = (documents) => {
  const reviewStatuses = countStatuses(documents, (doc) => doc.review?.status);
  const withImages = documents.filter((doc) => (doc.imageIds ?? []).length > 0).length;
  const withPdfs = documents.filter((doc) => (doc.pdfIds ?? []).length > 0).length;
  const missingMedia = documents.filter(
    (doc) => (doc.imageIds ?? []).length === 0 && (doc.pdfIds ?? []).length === 0
  );
  const unassigned = documents.filter(
    (doc) =>
      ['pending', 'in_review'].includes(doc.review?.status) &&
      !(doc.review?.reviewer && doc.review.reviewer.trim())
  );

  const formatDoc = (doc) => ({
    id: doc.id,
    title: doc.title || 'Ohne Titel',
    year: doc.year ?? null,
    category: doc.category ?? '',
    status: doc.review?.status ?? 'pending'
  });

  return {
    total: documents.length,
    reviewStatuses,
    withImages,
    withPdfs,
    withMedia: documents.filter(
      (doc) => (doc.imageIds ?? []).length > 0 || (doc.pdfIds ?? []).length > 0
    ).length,
    missingMedia: {
      count: missingMedia.length,
      samples: missingMedia.slice(0, 5).map(formatDoc)
    },
    unassignedReviews: {
      count: unassigned.length,
      samples: unassigned.slice(0, 5).map(formatDoc)
    }
  };
};

const summarizeMedia = (items) => {
  const reviewStatuses = countStatuses(items, (item) => item.review?.status);
  const linkedCount = items.filter((item) => (item.linkedDocuments ?? []).length > 0).length;
  return {
    total: items.length,
    reviewStatuses,
    linkedDocuments: linkedCount,
    unlinked: items.length - linkedCount
  };
};

const buildQueueSummary = (documents, images, pdfs) => {
  const statusKeys = REVIEW_STATUSES;
  const totals = initStatusBucket();
  statusKeys.forEach((status) => {
    totals[status] =
      documents.reviewStatuses[status] +
      images.reviewStatuses[status] +
      pdfs.reviewStatuses[status];
  });
  return totals;
};

const buildSuggestions = (summary) => {
  const suggestions = [];
  if (summary.documents.missingMedia.count > 0) {
    suggestions.push({
      id: 'missing-media',
      type: 'warning',
      text: `${summary.documents.missingMedia.count} Dokumente besitzen noch keine verknüpften Medien.`
    });
  }
  if (summary.documents.unassignedReviews.count > 0) {
    suggestions.push({
      id: 'unassigned-reviewers',
      type: 'info',
      text: `${summary.documents.unassignedReviews.count} Reviews sind keinem Prüfer zugewiesen.`
    });
  }
  if (summary.images.unlinked > 0) {
    suggestions.push({
      id: 'orphan-images',
      type: 'tip',
      text: `${summary.images.unlinked} Bilder sind keinem Dokument zugeordnet.`
    });
  }
  if (summary.pdfs.unlinked > 0) {
    suggestions.push({
      id: 'orphan-pdfs',
      type: 'tip',
      text: `${summary.pdfs.unlinked} PDFs warten auf eine Zuordnung.`
    });
  }
  return suggestions;
};

export const getDashboardSummary = async (_req, res, next) => {
  try {
    const [documentsData, imagesData, pdfsData] = await Promise.all([
      readDocuments(),
      readImages(),
      readPdfs()
    ]);

    const documents = summarizeDocuments(documentsData);
    const images = summarizeMedia(imagesData);
    const pdfs = summarizeMedia(pdfsData);

    const summary = {
      lastUpdated: new Date().toISOString(),
      documents,
      images,
      pdfs,
      queue: {
        totalsByStatus: buildQueueSummary(documents, images, pdfs)
      },
      suggestions: buildSuggestions({ documents, images, pdfs })
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
};
