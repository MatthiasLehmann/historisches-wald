import { readHydratedDocuments } from './documentsController.js';
import { getAlbumById, listAlbums } from '../services/albumsService.js';
import { getPhotoById, getPhotosByIds, listPhotos } from '../services/photosService.js';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

const places = [
  'Wald',
  'Glashuette',
  'Hippetsweiler',
  'Kappel',
  'Reischach',
  'Riedetsweiler',
  'Rothenlachen',
  'Ruhestetten',
  'Sentenhart',
  'Walbertsweiler'
];

const topics = [
  { id: 'ortsteile', title: 'Ortsteile', description: 'Geschichte nach Teilorten entdecken.' },
  { id: 'personen', title: 'Personen', description: 'Menschen, Namen und Erinnerungen aus dem Archiv.' },
  { id: 'gebaeude', title: 'Gebäude', description: 'Häuser, Kirchen, Kloster und verschwundene Orte.' },
  { id: 'vereine', title: 'Vereine', description: 'Vereinsleben, Veranstaltungen und Gemeinschaft.' },
  { id: 'luftbilder', title: 'Luftbilder', description: 'Wald und seine Ortsteile aus der Vogelperspektive.' },
  { id: 'quellen', title: 'Quellen', description: 'PDFs, Adressbücher, Chroniken und weitere Dokumente.' }
];

const asText = (value) => {
  if (value == null) {
    return '';
  }
  const text = Array.isArray(value) ? value.join(' ') : String(value);
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalize = (value) => asText(value).toLowerCase();

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePageOptions = (query = {}) => {
  const page = parsePositiveInteger(query.page, 1);
  const requestedPageSize = parsePositiveInteger(query.pageSize ?? query.limit, DEFAULT_PAGE_SIZE);
  return {
    page,
    pageSize: Math.min(requestedPageSize, MAX_PAGE_SIZE)
  };
};

const paginate = (items, query = {}) => {
  const { page, pageSize } = parsePageOptions(query);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages
    }
  };
};

const isPublicDocument = (document) =>
  document?.review?.status === 'approved' && document?.showInArchive !== false;

const isPublicPhoto = (photo) =>
  Boolean(photo) &&
  !photo.deletedAt &&
  !photo.missing &&
  Boolean(photo.preview || photo.original) &&
  photo.review?.status === 'approved';

const getDocumentCover = (document) => {
  const cover = document.coverImage || document.images?.[0] || null;
  if (!cover) {
    return null;
  }
  if (typeof cover === 'string') {
    return { src: cover, original: cover, title: document.title };
  }
  return {
    id: cover.id,
    src: cover.src || cover.preview || cover.previewUrl || '',
    original: cover.original || cover.originalUrl || cover.src || '',
    title: cover.title || cover.name || document.title,
    description: cover.description || '',
    source: cover.source || '',
    license: cover.license || ''
  };
};

const summarizeDocument = (document) => ({
  id: document.id,
  title: document.title,
  year: document.year ?? null,
  location: document.location || '',
  category: document.category || '',
  subcategories: Array.isArray(document.subcategories) ? document.subcategories : [],
  description: document.description || '',
  excerpt: asText(document.description || document.transcription).slice(0, 220),
  coverImage: getDocumentCover(document),
  imageCount: Array.isArray(document.images) ? document.images.length : 0,
  pdfCount: Array.isArray(document.pdfs) ? document.pdfs.length : 0
});

const summarizePdf = (pdf) => ({
  id: pdf.id,
  title: pdf.title,
  year: pdf.year ?? null,
  description: pdf.description || '',
  location: pdf.location || '',
  source: pdf.source || '',
  author: pdf.author || '',
  license: pdf.license || '',
  tags: Array.isArray(pdf.tags) ? pdf.tags : [],
  url: pdf.file?.type === 'remote'
    ? (pdf.file?.originalUrl || pdf.file?.path || '')
    : (pdf.file?.path || pdf.file?.originalUrl || '')
});

const summarizeImage = (image) => {
  if (!image) {
    return null;
  }
  if (typeof image === 'string') {
    return { src: image, original: image, title: '', description: '', source: '', license: '' };
  }
  const src = image.src || image.preview || image.previewUrl || image.url || '';
  return {
    id: image.id,
    src,
    original: image.original || image.originalUrl || image.fullUrl || src,
    title: image.title || image.name || '',
    description: image.description || image.caption || '',
    source: image.source || '',
    author: image.author || '',
    license: image.license || '',
    year: image.year || image.date || null,
    location: image.location || ''
  };
};

const summarizePhoto = (photo) => ({
  id: photo.id,
  title: photo.name || 'Ohne Titel',
  description: photo.description || '',
  dateTaken: photo.date_taken || '',
  preview: photo.preview || photo.original || '',
  original: photo.original || photo.preview || '',
  source: photo.source || photo.photopage || '',
  license: photo.license || '',
  tags: Array.isArray(photo.tags) ? photo.tags : [],
  albums: Array.isArray(photo.albums) ? photo.albums : []
});

const matchesQuery = (document, query) => {
  if (!query) {
    return true;
  }
  const haystack = [
    document.title,
    document.year,
    document.location,
    document.category,
    ...(Array.isArray(document.subcategories) ? document.subcategories : []),
    document.description,
    document.transcription,
    document.metadata?.source,
    document.metadata?.author
  ].map(normalize).join(' ');
  return haystack.includes(query);
};

const filterDocuments = (documents, query = {}) => {
  const searchQuery = normalize(query.q ?? query.search);
  const location = normalize(query.location ?? query.place);
  const category = normalize(query.category);
  const fromYear = query.fromYear ? Number.parseInt(query.fromYear, 10) : null;
  const toYear = query.toYear ? Number.parseInt(query.toYear, 10) : null;

  return documents.filter((document) => {
    if (!isPublicDocument(document)) {
      return false;
    }
    if (searchQuery && !matchesQuery(document, searchQuery)) {
      return false;
    }
    if (location) {
      const values = [
        document.location,
        document.category,
        ...(Array.isArray(document.subcategories) ? document.subcategories : [])
      ].map(normalize);
      if (!values.some((value) => value === location || value.includes(location))) {
        return false;
      }
    }
    if (category) {
      const values = [
        document.category,
        ...(Array.isArray(document.subcategories) ? document.subcategories : [])
      ].map(normalize);
      if (!values.some((value) => value === category || value.includes(category))) {
        return false;
      }
    }
    const year = Number.parseInt(document.year, 10);
    if (Number.isFinite(fromYear) && Number.isFinite(year) && year < fromYear) {
      return false;
    }
    if (Number.isFinite(toYear) && Number.isFinite(year) && year > toYear) {
      return false;
    }
    return true;
  });
};

const sortDocuments = (documents) =>
  [...documents].sort((left, right) => {
    const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 0;
    const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return String(left.title || '').localeCompare(String(right.title || ''), 'de', { sensitivity: 'base' });
  });

const collectFacetCounts = (documents) => {
  const locations = new Map();
  const categories = new Map();
  const years = [];

  documents.forEach((document) => {
    if (document.location) {
      locations.set(document.location, (locations.get(document.location) || 0) + 1);
    }
    if (document.category) {
      categories.set(document.category, (categories.get(document.category) || 0) + 1);
    }
    const year = Number.parseInt(document.year, 10);
    if (Number.isFinite(year)) {
      years.push(year);
    }
  });

  const mapFacet = (map) =>
    Array.from(map.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => left.value.localeCompare(right.value, 'de', { sensitivity: 'base' }));

  return {
    locations: mapFacet(locations),
    categories: mapFacet(categories),
    minYear: years.length > 0 ? Math.min(...years) : null,
    maxYear: years.length > 0 ? Math.max(...years) : null
  };
};

const buildPublicAlbums = async () => {
  const [albums, photos] = await Promise.all([listAlbums(), listPhotos()]);
  const publicPhotoMap = new Map(
    photos
      .filter(isPublicPhoto)
      .map((photo) => [String(photo.id), photo])
  );

  const publicAlbums = albums
    .map((album) => {
      const publicPhotos = album.photos
        .map((photoId) => publicPhotoMap.get(String(photoId)))
        .filter(Boolean);
      const coverPhoto = publicPhotos.find((photo) => photo.preview === album.cover_photo || photo.original === album.cover_photo)
        || publicPhotos[0]
        || null;
      return {
        id: album.id,
        title: album.title,
        description: album.description || '',
        coverPhoto: album.cover_photo || coverPhoto?.preview || coverPhoto?.original || '',
        publicPhotoCount: publicPhotos.length,
        parentId: album.parent_id || '',
        lastUpdated: album.last_updated || null
      };
    })
    .filter((album) => album.publicPhotoCount > 0)
    .sort((left, right) => left.title.localeCompare(right.title, 'de', { sensitivity: 'base' }));

  return { albums: publicAlbums, publicPhotoMap };
};

export const getPublicHome = async (_req, res, next) => {
  try {
    const [documents, publicAlbumsResult] = await Promise.all([
      readHydratedDocuments(),
      buildPublicAlbums()
    ]);
    const publicDocuments = sortDocuments(documents.filter(isPublicDocument));
    const recentDocuments = publicDocuments.slice(0, 6).map(summarizeDocument);
    const featuredDocuments = publicDocuments
      .filter((document) => getDocumentCover(document))
      .slice(0, 8)
      .map(summarizeDocument);

    res.json({
      stats: {
        documents: publicDocuments.length,
        albums: publicAlbumsResult.albums.length,
        photos: publicAlbumsResult.publicPhotoMap.size
      },
      topics,
      places,
      recentDocuments,
      featuredDocuments,
      featuredAlbums: publicAlbumsResult.albums.slice(0, 6)
    });
  } catch (error) {
    next(error);
  }
};

export const listPublicDocuments = async (req, res, next) => {
  try {
    const documents = await readHydratedDocuments();
    const filtered = sortDocuments(filterDocuments(documents, req.query || {}));
    const paginated = paginate(filtered.map(summarizeDocument), req.query || {});
    res.json({
      ...paginated,
      facets: collectFacetCounts(documents.filter(isPublicDocument))
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicDocument = async (req, res, next) => {
  try {
    const documents = await readHydratedDocuments();
    const publicDocuments = documents.filter(isPublicDocument);
    const document = publicDocuments.find((item) => item.id === req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Dokument nicht gefunden.' });
    }

    const related = publicDocuments
      .filter((candidate) => candidate.id !== document.id)
      .filter((candidate) =>
        candidate.location === document.location ||
        candidate.category === document.category ||
        Number.parseInt(candidate.year, 10) === Number.parseInt(document.year, 10)
      )
      .slice(0, 6)
      .map(summarizeDocument);

    return res.json({
      ...summarizeDocument(document),
      description: document.description || '',
      transcription: document.transcription || '',
      metadata: {
        author: document.metadata?.author || '',
        source: document.metadata?.source || '',
        editor: document.metadata?.editor || ''
      },
      images: (Array.isArray(document.images) ? document.images : [])
        .map(summarizeImage)
        .filter((image) => Boolean(image?.src)),
      pdfs: (Array.isArray(document.pdfs) ? document.pdfs : [])
        .map(summarizePdf)
        .filter((pdf) => Boolean(pdf.url)),
      related
    });
  } catch (error) {
    return next(error);
  }
};

export const listPublicAlbums = async (req, res, next) => {
  try {
    const { albums } = await buildPublicAlbums();
    const query = normalize(req.query?.q ?? req.query?.search);
    const filtered = query
      ? albums.filter((album) => normalize(`${album.title} ${album.description}`).includes(query))
      : albums;
    res.json(paginate(filtered, req.query || {}));
  } catch (error) {
    next(error);
  }
};

export const listPublicAlbumPhotos = async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id);
    const photos = await getPhotosByIds(album.photos);
    const publicPhotos = photos.filter(isPublicPhoto).map(summarizePhoto);
    if (publicPhotos.length === 0) {
      return res.status(404).json({ message: 'Album nicht gefunden.' });
    }
    return res.json({
      album: {
        id: album.id,
        title: album.title,
        description: album.description || '',
        coverPhoto: album.cover_photo || publicPhotos[0]?.preview || '',
        publicPhotoCount: publicPhotos.length,
        parentId: album.parent_id || ''
      },
      ...paginate(publicPhotos, req.query || {})
    });
  } catch (error) {
    return next(error);
  }
};

export const getPublicPhoto = async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (!isPublicPhoto(photo)) {
      return res.status(404).json({ message: 'Foto nicht gefunden.' });
    }
    return res.json(summarizePhoto(photo));
  } catch (error) {
    return next(error);
  }
};

export const searchPublicContent = async (req, res, next) => {
  try {
    const query = normalize(req.query?.q ?? req.query?.search);
    if (!query) {
      return res.json({ documents: [], albums: [] });
    }
    const [documents, { albums }] = await Promise.all([
      readHydratedDocuments(),
      buildPublicAlbums()
    ]);
    const limit = Math.min(parsePositiveInteger(req.query?.limit, 8), 20);
    const documentResults = sortDocuments(filterDocuments(documents, { q: query }))
      .slice(0, limit)
      .map(summarizeDocument);
    const albumResults = albums
      .filter((album) => normalize(`${album.title} ${album.description}`).includes(query))
      .slice(0, limit);
    return res.json({
      documents: documentResults,
      albums: albumResults
    });
  } catch (error) {
    return next(error);
  }
};
