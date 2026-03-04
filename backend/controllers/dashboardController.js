import { readDocuments } from './documentsController.js';
import { readImages } from '../models/imagesModel.js';
import { readPdfs } from '../models/pdfsModel.js';
import { listPhotos } from '../services/photosService.js';
import { listAlbums } from '../services/albumsService.js';

const REVIEW_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

const PHOTO_STATUS_MAP = {
  pending: 'pending',
  'in-progress': 'in_review',
  approved: 'approved',
  'needs-info': 'pending',
  rejected: 'rejected'
};

const initStatusBucket = (statuses = REVIEW_STATUSES) =>
  statuses.reduce(
    (bucket, status) => ({
      ...bucket,
      [status]: 0
    }),
    { other: 0 }
  );

const countStatuses = (items, getStatus, statuses = REVIEW_STATUSES) => {
  const bucket = initStatusBucket(statuses);
  items.forEach((item) => {
    const status = getStatus(item);
    if (statuses.includes(status)) {
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

const summarizePdfs = (pdfs) => {
  const reviewStatuses = countStatuses(pdfs, (pdf) => pdf.review?.status);
  const linkedCount = pdfs.filter((pdf) => (pdf.linkedDocuments ?? []).length > 0).length;
  return {
    total: pdfs.length,
    reviewStatuses,
    linkedDocuments: linkedCount,
    unlinked: pdfs.length - linkedCount
  };
};

const mapPhotoStatus = (status) => PHOTO_STATUS_MAP[status] ?? 'pending';

const summarizeImages = (images, photos) => {
  const combined = [
    ...images.map((image) => ({
      type: 'document',
      status: REVIEW_STATUSES.includes(image.review?.status) ? image.review?.status : 'pending',
      linked: (image.linkedDocuments ?? []).length
    })),
    ...photos.map((photo) => ({
      type: 'album',
      status: mapPhotoStatus(photo.review?.status),
      linked: (photo.albums ?? []).length
    }))
  ];

  const reviewStatuses = countStatuses(combined, (entry) => entry.status);
  const documentLinks = images.filter((image) => (image.linkedDocuments ?? []).length > 0).length;
  const albumLinks = photos.filter((photo) => (photo.albums ?? []).length > 0).length;
  const orphanAlbumPhotos = photos.filter((photo) => (photo.albums ?? []).length === 0);

  const formatPhoto = (photo) => ({
    id: photo.id,
    title: photo.name?.trim() ? photo.name : 'Ohne Titel',
    dateTaken: typeof photo.date_taken === 'string' ? photo.date_taken : '',
    preview: photo.preview || photo.original || '',
    source: typeof photo.source === 'string' ? photo.source : '',
    status: mapPhotoStatus(photo.review?.status),
    missing: Boolean(photo.missing)
  });

  return {
    total: combined.length,
    reviewStatuses,
    breakdown: {
      documentImages: {
        total: images.length,
        linkedDocuments: documentLinks,
        unlinked: images.length - documentLinks
      },
      albumPhotos: {
        total: photos.length,
        linkedAlbums: albumLinks,
        unlinked: photos.length - albumLinks
      }
    },
    orphanedAlbumPhotos: {
      count: orphanAlbumPhotos.length,
      samples: orphanAlbumPhotos.slice(0, 6).map(formatPhoto)
    }
  };
};

const summarizeAlbums = (albums) => {
  const totalPhotos = albums.reduce(
    (sum, album) => sum + ((album.photo_count ?? album.photos?.length) || 0),
    0
  );
  const emptyAlbums = albums.filter(
    (album) => ((album.photo_count ?? album.photos?.length) || 0) === 0
  );
  const missingCover = albums.filter((album) => !(album.cover_photo && album.cover_photo.trim()));
  const childAlbums = albums.filter((album) => Boolean(album.parent_id));

  const formatAlbum = (album) => ({
    id: album.id,
    title: album.title || 'Ohne Titel',
    photoCount: album.photo_count ?? album.photos?.length ?? 0
  });

  return {
    total: albums.length,
    totalPhotos,
    averagePhotos: albums.length > 0 ? Math.round(totalPhotos / albums.length) : 0,
    empty: {
      count: emptyAlbums.length,
      samples: emptyAlbums.slice(0, 5).map(formatAlbum)
    },
    missingCover: missingCover.length,
    nested: childAlbums.length
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
  if (summary.images.breakdown.documentImages.unlinked > 0) {
    suggestions.push({
      id: 'orphan-images',
      type: 'tip',
      text: `${summary.images.breakdown.documentImages.unlinked} Bilder sind keinem Dokument zugeordnet.`
    });
  }
  if (summary.images.breakdown.albumPhotos.unlinked > 0) {
    suggestions.push({
      id: 'orphan-photos',
      type: 'tip',
      text: `${summary.images.breakdown.albumPhotos.unlinked} Albumfotos sind keiner Sammlung zugeordnet.`
    });
  }
  if (summary.pdfs.unlinked > 0) {
    suggestions.push({
      id: 'orphan-pdfs',
      type: 'tip',
      text: `${summary.pdfs.unlinked} PDFs warten auf eine Zuordnung.`
    });
  }
  if (summary.albums.empty.count > 0) {
    suggestions.push({
      id: 'empty-albums',
      type: 'warning',
      text: `${summary.albums.empty.count} Alben enthalten noch keine Fotos.`
    });
  }
  if (summary.albums.missingCover > 0) {
    suggestions.push({
      id: 'missing-cover',
      type: 'info',
      text: `${summary.albums.missingCover} Alben besitzen noch kein Coverbild.`
    });
  }
  return suggestions;
};

export const getDashboardSummary = async (_req, res, next) => {
  try {
    const [documentsData, imagesData, pdfsData, photosData, albumsData] = await Promise.all([
      readDocuments(),
      readImages(),
      readPdfs(),
      listPhotos(),
      listAlbums()
    ]);

    const documents = summarizeDocuments(documentsData);
    const images = summarizeImages(imagesData, photosData);
    const pdfs = summarizePdfs(pdfsData);
    const albums = summarizeAlbums(albumsData);

    const summary = {
      lastUpdated: new Date().toISOString(),
      documents,
      images,
      pdfs,
      albums,
      queue: {
        totalsByStatus: buildQueueSummary(documents, images, pdfs)
      },
      suggestions: buildSuggestions({ documents, images, pdfs, albums })
    };

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
