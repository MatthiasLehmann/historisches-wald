import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Save, X } from 'lucide-react';
import categoriesData from '../data/categories.json';
import PdfSelectorModal from '../components/PdfSelectorModal.jsx';
import AlbumPhotoSelectorModal from '../components/AlbumPhotoSelectorModal.jsx';
import { fetchPdfs, fetchPhotos, reorderDocuments } from '../services/api.js';
import MarkdownEditor from '../components/MarkdownEditor.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const formatLicenseLabel = (license) => (!license || license === 'rights-reserved' ? 'Rechte vorbehalten' : license);

const initialForm = {
  title: '',
  year: '',
  location: '',
  description: '',
  descriptionJson: null,
  transcription: '',
  transcriptionJson: null,
  author: '',
  source: '',
  editor: '',
  showInTimeline: true,
  showInArchive: true,
  showInWordCloud: true,
  coverPhotoId: '',
  albumPhotoIds: [],
  pdfIds: [],
  parent_id: '',
};

const defaultOpenSections = {
  document: true,
  content: false,
  media: false,
  sources: false,
  publishing: false,
};

const collectAlbumPhotoIdsFromTipTapJson = (node, ids = new Set()) => {
  if (!node || typeof node !== 'object') {
    return ids;
  }
  if (node.type === 'albumPhoto' && node.attrs?.photoId) {
    ids.add(String(node.attrs.photoId));
  }
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => collectAlbumPhotoIdsFromTipTapJson(child, ids));
  }
  return ids;
};

const collectInlineAlbumPhotoIds = (...jsonValues) =>
  Array.from(
    jsonValues.reduce((ids, value) => collectAlbumPhotoIdsFromTipTapJson(value, ids), new Set())
  );

const mergeAlbumPhotoIds = ({ selectedIds = [], inlineIds = [], coverPhotoId = '' }) => {
  const cover = coverPhotoId ? String(coverPhotoId) : '';
  return Array.from(
    new Set(
      [...selectedIds, ...inlineIds]
        .map((id) => String(id))
        .filter((id) => id && id !== cover)
    )
  );
};

const CollapsibleSection = ({ title, eyebrow, summary, isOpen, onToggle, children }) => (
  <section className="border border-parchment-dark rounded-sm bg-white shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      aria-expanded={isOpen}
    >
      <span>
        {eyebrow && <span className="block text-xs uppercase tracking-[0.3em] text-ink/50 mb-1">{eyebrow}</span>}
        <span className="block text-xl font-serif font-bold text-ink">{title}</span>
      </span>
      <span className="flex min-w-0 items-center gap-3 text-xs text-ink/60">
        {summary && <span className="max-w-[11rem] truncate sm:max-w-xs">{summary}</span>}
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </span>
    </button>
    {isOpen && (
      <div className="border-t border-parchment-dark/60 px-5 py-5">
        {children}
      </div>
    )}
  </section>
);

const buildDocumentTree = (documents = []) => {
  const nodes = new Map();
  documents.forEach((document) => {
    nodes.set(document.id, { ...document, children: [] });
  });

  const roots = [];
  nodes.forEach((node) => {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursive = (list) => {
    list.sort((left, right) => {
      const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 0;
      const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 0;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return String(left.title || '').localeCompare(String(right.title || ''), 'de', { sensitivity: 'base' });
    });
    list.forEach((child) => sortRecursive(child.children));
  };

  sortRecursive(roots);
  return roots;
};

const flattenDocumentTree = (nodes = [], level = 0) =>
  nodes.flatMap((node) => [
    { ...node, level },
    ...flattenDocumentTree(node.children, level + 1)
  ]);

const collectDescendantIds = (documents = [], documentId = '') => {
  const descendants = new Set();
  let changed = true;

  while (changed) {
    changed = false;
    documents.forEach((document) => {
      const parentId = document.parent_id ? String(document.parent_id) : '';
      if ((parentId === documentId || descendants.has(parentId)) && !descendants.has(document.id)) {
        descendants.add(document.id);
        changed = true;
      }
    });
  }

  return descendants;
};

const getPublishingTargets = (doc) => {
  const targets = [];
  if (doc?.showInArchive !== false) targets.push('Archiv');
  if (doc?.showInTimeline !== false) targets.push('Zeitleiste');
  if (doc?.showInWordCloud !== false) targets.push('Wortwolke');
  return targets;
};

const PublishingTargets = ({ doc }) => {
  const targets = getPublishingTargets(doc);

  if (targets.length === 0) {
    return <p className="mt-2 text-xs font-semibold text-red-600">Nicht veröffentlicht</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {targets.map((target) => (
        <span
          key={target}
          className="rounded-sm border border-parchment-dark bg-white px-2 py-1 text-xs font-semibold text-ink/60"
        >
          {target}
        </span>
      ))}
    </div>
  );
};

const DocumentTreeNode = ({
  node,
  level = 0,
  expandedIds,
  editingId,
  onToggle,
  onSelect
}) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.includes(node.id);

  return (
    <li className="space-y-2" style={{ marginLeft: level * 10 }}>
      <div className="flex items-stretch gap-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-parchment-dark bg-parchment text-xs leading-none hover:bg-parchment-dark/40"
            aria-label={isExpanded ? 'Einklappen' : 'Ausklappen'}
          >
            {isExpanded ? '−' : '+'}
          </button>
        ) : (
          <span className="mt-3 h-6 w-6 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(node)}
          className={`w-full text-left border rounded-sm px-4 py-3 transition-colors ${
            editingId === node.id
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-parchment-dark/60 hover:border-accent'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-base leading-snug text-ink">{node.title}</p>
            <StatusBadge status={node.review?.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink/60">
            <span>{node.year || 'Ohne Jahr'}</span>
            <span>{node.category || 'Ohne Kategorie'}</span>
            {node.location && <span>{node.location}</span>}
          </div>
          {(node.metadata?.editor || node.metadata?.author) && (
            <p className="mt-1 text-xs text-ink/50">
              {node.metadata?.editor ? `Bearbeiter: ${node.metadata.editor}` : `Autor: ${node.metadata.author}`}
            </p>
          )}
          <PublishingTargets doc={node} />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="space-y-2 border-l border-parchment-dark/60 pl-3">
          {node.children.map((child) => (
            <DocumentTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              editingId={editingId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const DocumentTree = ({ documents, expandedIds, editingId, onToggle, onSelect }) => {
  if (!documents.length) {
    return <p className="text-sm text-ink/50">Keine Dokumente passend zur Suche.</p>;
  }

  return (
    <ul className="space-y-3">
      {documents.map((node) => (
        <DocumentTreeNode
          key={node.id}
          node={node}
          expandedIds={expandedIds}
          editingId={editingId}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
};

const SubmitDocument = () => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedCoverPhoto, setSelectedCoverPhoto] = useState(null);
  const [isCoverPhotoSelectorOpen, setIsCoverPhotoSelectorOpen] = useState(false);
  const [selectedAlbumPhotos, setSelectedAlbumPhotos] = useState([]);
  const [inlineAlbumPhotos, setInlineAlbumPhotos] = useState([]);
  const [isAlbumPhotoSelectorOpen, setIsAlbumPhotoSelectorOpen] = useState(false);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [isPdfSelectorOpen, setIsPdfSelectorOpen] = useState(false);
  const [pdfLibrary, setPdfLibrary] = useState([]);
  const [pdfLibraryLoading, setPdfLibraryLoading] = useState(false);
  const [pdfLibraryError, setPdfLibraryError] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSortingDocuments, setIsSortingDocuments] = useState(false);
  const [orderedDocuments, setOrderedDocuments] = useState([]);
  const [draggedDocumentId, setDraggedDocumentId] = useState(null);
  const [isSavingDocumentOrder, setIsSavingDocumentOrder] = useState(false);
  const [openSections, setOpenSections] = useState(defaultOpenSections);
  const [expandedDocumentIds, setExpandedDocumentIds] = useState([]);

  const areaOptions = useMemo(() => {
    const root = categoriesData[0];
    return Array.isArray(root?.subcategories) ? root.subcategories : [];
  }, []);

  const currentArea = areaOptions.find((area) => area.label === selectedArea);
  const availableSubs = currentArea?.subcategories ?? [];

  const filteredDocuments = useMemo(() => {
    const query = documentSearchQuery.trim().toLowerCase();
    if (!query) {
      return documents;
    }
    const documentsById = new Map(documents.map((doc) => [doc.id, doc]));
    const visibleIds = new Set();

    documents.forEach((doc) => {
      const searchable = [
        doc.title,
        doc.year ? String(doc.year) : '',
        doc.category,
        Array.isArray(doc.subcategories)
          ? doc.subcategories.join(' ')
          : doc.subcategory ?? '',
        doc.metadata?.author ?? '',
        doc.metadata?.editor ?? '',
        doc.location ?? '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) {
        return;
      }
      visibleIds.add(doc.id);
      let parentId = doc.parent_id ? String(doc.parent_id) : '';
      while (parentId && documentsById.has(parentId)) {
        visibleIds.add(parentId);
        parentId = documentsById.get(parentId)?.parent_id || '';
      }
    });

    return documents.filter((doc) => visibleIds.has(doc.id));
  }, [documents, documentSearchQuery]);
  const displayedDocuments = isSortingDocuments ? orderedDocuments : filteredDocuments;
  const displayedDocumentTree = useMemo(
    () => buildDocumentTree(displayedDocuments),
    [displayedDocuments]
  );
  const documentTreeOrder = useMemo(
    () => flattenDocumentTree(buildDocumentTree(documents)),
    [documents]
  );
  const parentDocumentOptions = useMemo(() => {
    const blockedIds = new Set();
    if (editingId) {
      blockedIds.add(editingId);
      collectDescendantIds(documents, editingId).forEach((id) => blockedIds.add(id));
    }
    return documentTreeOrder.filter((doc) => !blockedIds.has(doc.id));
  }, [documentTreeOrder, documents, editingId]);
  const publishingSummary = useMemo(() => {
    const targets = [];
    if (form.showInArchive !== false) targets.push('Archiv');
    if (form.showInTimeline !== false) targets.push('Zeitleiste');
    if (form.showInWordCloud !== false) targets.push('Wortwolke');
    return targets.length > 0 ? targets.join(', ') : 'Nirgends sichtbar';
  }, [form.showInArchive, form.showInTimeline, form.showInWordCloud]);
  const documentOrderChanged = useMemo(() => {
    if (!isSortingDocuments || orderedDocuments.length !== documents.length) {
      return false;
    }
    return orderedDocuments.some((doc, index) => doc.id !== documents[index]?.id);
  }, [documents, isSortingDocuments, orderedDocuments]);
  const inlineAlbumPhotoIds = useMemo(
    () => collectInlineAlbumPhotoIds(form.descriptionJson, form.transcriptionJson),
    [form.descriptionJson, form.transcriptionJson]
  );
  const inlineAlbumPhotoKey = inlineAlbumPhotoIds.join(',');

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
    setSelectedSubcategories([]);
  };

  const toggleSubcategory = (label) => {
    setSelectedSubcategories((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleDocumentNode = (documentId) => {
    setExpandedDocumentIds((prev) => (
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    ));
  };

  const handleExpandAllDocuments = () => {
    setExpandedDocumentIds(documents.map((doc) => doc.id));
  };

  const handleCollapseAllDocuments = () => {
    setExpandedDocumentIds([]);
  };

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Dokumentenliste konnte nicht geladen werden.');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
      throw error;
    }
  }, []);

  useEffect(() => {
    loadDocuments().catch(() => {});
  }, [loadDocuments]);

  useEffect(() => {
    if (!isSortingDocuments) {
      setOrderedDocuments(documents);
    }
  }, [documents, isSortingDocuments]);

  useEffect(() => {
    setExpandedDocumentIds(documents.map((doc) => doc.id));
  }, [documents]);

  const loadPdfLibrary = useCallback(async () => {
    setPdfLibraryLoading(true);
    setPdfLibraryError(null);
    try {
      const data = await fetchPdfs({ sort: 'updatedAt', order: 'desc' });
      setPdfLibrary(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('PDF-Bibliothek konnte nicht geladen werden:', error);
      setPdfLibraryError(error.message || 'PDFs konnten nicht geladen werden.');
      setPdfLibrary([]);
    } finally {
      setPdfLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPdfLibrary();
  }, [loadPdfLibrary]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedArea('');
    setSelectedSubcategories([]);
    setEditingId(null);
    setSelectedCoverPhoto(null);
    setSelectedAlbumPhotos([]);
    setInlineAlbumPhotos([]);
    setSelectedPdfs([]);
    setOpenSections(defaultOpenSections);
    setExpandedDocumentIds(documents.map((doc) => doc.id));
  };

  const handleSelectDocument = (doc) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title ?? '',
      year: doc.year ? String(doc.year) : '',
      location: doc.location ?? '',
      description: Array.isArray(doc.description)
        ? doc.description.join('\n\n')
        : doc.description ?? '',
      descriptionJson: doc.descriptionJson ?? null,
      transcription: Array.isArray(doc.transcription)
        ? doc.transcription.join('\n\n')
        : doc.transcription ?? '',
      transcriptionJson: doc.transcriptionJson ?? null,
      author: doc.metadata?.author ?? '',
      source: doc.metadata?.source ?? '',
      editor: doc.metadata?.editor ?? '',
      showInTimeline: doc.showInTimeline !== false,
      showInArchive: doc.showInArchive !== false,
      showInWordCloud: doc.showInWordCloud !== false,
      coverPhotoId: doc.coverPhotoId ?? '',
      albumPhotoIds: Array.isArray(doc.albumPhotoIds)
        ? doc.albumPhotoIds.filter((id) => String(id) !== String(doc.coverPhotoId || ''))
        : [],
      pdfIds: Array.isArray(doc.pdfIds) ? doc.pdfIds : [],
      parent_id: doc.parent_id ?? '',
    });
    setSelectedArea(doc.category ?? '');
    setSelectedSubcategories(
      Array.isArray(doc.subcategories)
        ? doc.subcategories
        : doc.subcategory
          ? [doc.subcategory]
          : [],
    );
    const nextCoverPhotoId = doc.coverPhotoId ? String(doc.coverPhotoId) : '';
    loadSelectedCoverPhoto(nextCoverPhotoId, doc.coverImage);
    const nextAlbumPhotoIds = Array.isArray(doc.albumPhotoIds) ? doc.albumPhotoIds : [];
    loadSelectedAlbumPhotos(nextAlbumPhotoIds, nextCoverPhotoId);
    const nextPdfIds = Array.isArray(doc.pdfIds) ? doc.pdfIds : [];
    loadSelectedPdfs(nextPdfIds);
    if (nextPdfIds.length > 0) {
      loadPdfLibrary();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const hasMissingDocumentFields = !form.title.trim() || !String(form.year).trim() || !selectedArea;
    const hasMissingSourceFields = !form.editor.trim();

    if (hasMissingDocumentFields || hasMissingSourceFields) {
      setOpenSections((prev) => ({
        ...prev,
        document: hasMissingDocumentFields ? true : prev.document,
        sources: hasMissingSourceFields ? true : prev.sources,
      }));
      setStatus({
        type: 'error',
        message: hasMissingDocumentFields && hasMissingSourceFields
          ? 'Bitte Pflichtfelder in Beitrag und Quellen ausfüllen.'
          : hasMissingDocumentFields
            ? 'Bitte Pflichtfelder im Bereich Beitrag ausfüllen.'
            : 'Bitte den Bearbeiter im Bereich Quellen eintragen.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const mergedAlbumPhotoIds = mergeAlbumPhotoIds({
        selectedIds: form.albumPhotoIds,
        inlineIds: inlineAlbumPhotoIds,
        coverPhotoId: form.coverPhotoId,
      });
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : '',
        category: selectedArea,
        subcategories: selectedSubcategories,
        descriptionJson: form.descriptionJson,
        transcription: form.transcription,
        transcriptionJson: form.transcriptionJson,
        editor: form.editor,
        showInTimeline: form.showInTimeline !== false,
        showInArchive: form.showInArchive !== false,
        showInWordCloud: form.showInWordCloud !== false,
        coverPhotoId: form.coverPhotoId || '',
        albumPhotoIds: mergedAlbumPhotoIds,
        pdfIds: Array.isArray(form.pdfIds) ? form.pdfIds : [],
        parent_id: form.parent_id || '',
      };

      const endpoint = editingId ? `/api/documents/${editingId}` : '/api/documents';
      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Speichern fehlgeschlagen');
      }

      const saved = await response.json();

      setStatus({ type: 'success', message: editingId ? 'Dokument aktualisiert.' : 'Dokument gespeichert.' });
      if (editingId) {
        handleSelectDocument(saved);
      } else {
        setEditingId(saved.id);
        handleSelectDocument(saved);
      }
      loadDocuments();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSelectedCoverPhoto = async (photoId, hydratedCover = null) => {
    if (!photoId) {
      setSelectedCoverPhoto(null);
      return;
    }
    if (hydratedCover?.id && String(hydratedCover.id) === String(photoId)) {
      setSelectedCoverPhoto({
        id: hydratedCover.id,
        name: hydratedCover.title,
        preview: hydratedCover.src,
        original: hydratedCover.src,
        date_taken: hydratedCover.date || '',
      });
      return;
    }
    try {
      const data = await fetchPhotos({ ids: [photoId] });
      const photo = Array.isArray(data)
        ? data.find((item) => String(item.id) === String(photoId))
        : null;
      setSelectedCoverPhoto(photo ?? null);
    } catch (error) {
      console.error('Beitragsbild konnte nicht geladen werden:', error);
      setSelectedCoverPhoto(null);
    }
  };

  const loadSelectedAlbumPhotos = async (photoIds, excludedPhotoId = '') => {
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      setSelectedAlbumPhotos([]);
      return;
    }
    try {
      const galleryPhotoIds = excludedPhotoId
        ? photoIds.filter((id) => String(id) !== String(excludedPhotoId))
        : photoIds;
      if (galleryPhotoIds.length === 0) {
        setSelectedAlbumPhotos([]);
        return;
      }
      const data = await fetchPhotos({ ids: galleryPhotoIds });
      const ordered = galleryPhotoIds
        .map((id) => data.find((photo) => String(photo.id) === String(id)))
        .filter(Boolean);
      setSelectedAlbumPhotos(ordered);
    } catch (error) {
      console.error('Album-Fotos konnten nicht geladen werden:', error);
    }
  };

  useEffect(() => {
    const loadInlineAlbumPhotos = async () => {
      if (inlineAlbumPhotoIds.length === 0) {
        setInlineAlbumPhotos([]);
        return;
      }
      try {
        const data = await fetchPhotos({ ids: inlineAlbumPhotoIds });
        const ordered = inlineAlbumPhotoIds
          .map((id) => data.find((photo) => String(photo.id) === String(id)))
          .filter(Boolean);
        setInlineAlbumPhotos(ordered);
      } catch (error) {
        console.error('Inline-Fotos konnten nicht geladen werden:', error);
        setInlineAlbumPhotos([]);
      }
    };
    loadInlineAlbumPhotos();
  }, [inlineAlbumPhotoIds, inlineAlbumPhotoKey]);

  const handleAlbumPhotoSelectionSave = (photos) => {
    const coverPhotoId = form.coverPhotoId ? String(form.coverPhotoId) : '';
    const galleryPhotos = coverPhotoId
      ? photos.filter((photo) => String(photo.id) !== coverPhotoId)
      : photos;
    const ids = galleryPhotos.map((photo) => photo.id);
    setForm((prev) => ({ ...prev, albumPhotoIds: ids }));
    setSelectedAlbumPhotos(galleryPhotos);
  };

  const handleCoverPhotoSelectionSave = (photos) => {
    const photo = photos[0] ?? null;
    const coverPhotoId = photo?.id ? String(photo.id) : '';
    setSelectedCoverPhoto(photo);
    setForm((prev) => ({
      ...prev,
      coverPhotoId,
      albumPhotoIds: Array.isArray(prev.albumPhotoIds)
        ? prev.albumPhotoIds.filter((photoId) => String(photoId) !== coverPhotoId)
        : [],
    }));
    if (coverPhotoId) {
      setSelectedAlbumPhotos((prev) => prev.filter((item) => String(item.id) !== coverPhotoId));
    }
  };

  const removeCoverPhotoSelection = () => {
    setSelectedCoverPhoto(null);
    setForm((prev) => ({ ...prev, coverPhotoId: '' }));
  };

  const removeAlbumPhotoFromSelection = (id) => {
    setSelectedAlbumPhotos((prev) => prev.filter((photo) => String(photo.id) !== String(id)));
    setForm((prev) => ({
      ...prev,
      albumPhotoIds: prev.albumPhotoIds.filter((photoId) => String(photoId) !== String(id)),
    }));
  };

  const loadSelectedPdfs = async (pdfIds) => {
    if (!Array.isArray(pdfIds) || pdfIds.length === 0) {
      setSelectedPdfs([]);
      return;
    }
    try {
      const data = await fetchPdfs({ ids: pdfIds });
      const ordered = pdfIds
        .map((id) => data.find((pdf) => pdf.id === id))
        .filter(Boolean);
      setSelectedPdfs(ordered);
    } catch (error) {
      console.error('PDFs konnten nicht geladen werden:', error);
    }
  };

  const handlePdfSelectionSave = (pdfs) => {
    const ids = pdfs.map((pdf) => pdf.id);
    setForm((prev) => ({ ...prev, pdfIds: ids }));
    setSelectedPdfs(pdfs);
  };

  const removePdfFromSelection = (id) => {
    setSelectedPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
    setForm((prev) => ({
      ...prev,
      pdfIds: Array.isArray(prev.pdfIds) ? prev.pdfIds.filter((pdfId) => pdfId !== id) : []
    }));
  };

  const pdfPreviewUrl = (pdf) => {
    if (pdf.file?.type === 'remote') {
      return pdf.file?.originalUrl || pdf.file?.path || '';
    }
    return pdf.file?.path || pdf.file?.originalUrl || '';
  };

  const handleManualReload = async () => {
    setIsReloading(true);
    setStatus(null);
    resetForm();
    setDocumentSearchQuery('');
    try {
      await loadDocuments();
    } catch {
      // Fehler wurde bereits in loadDocuments behandelt
    } finally {
      setIsReloading(false);
    }
  };

  const handleStartSortingDocuments = () => {
    setDocumentSearchQuery('');
    setOrderedDocuments(documents);
    setDraggedDocumentId(null);
    setStatus(null);
    setIsSortingDocuments(true);
  };

  const handleCancelSortingDocuments = () => {
    setOrderedDocuments(documents);
    setDraggedDocumentId(null);
    setIsSortingDocuments(false);
  };

  const moveDocumentInOrder = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }
    setOrderedDocuments((prev) => {
      const sourceIndex = prev.findIndex((doc) => doc.id === sourceId);
      const targetIndex = prev.findIndex((doc) => doc.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const [movedDocument] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedDocument);
      return next;
    });
  };

  const handleSaveDocumentOrder = async () => {
    setIsSavingDocumentOrder(true);
    setStatus(null);
    try {
      const data = await reorderDocuments(orderedDocuments.map((doc) => doc.id));
      setDocuments(data);
      setOrderedDocuments(data);
      setIsSortingDocuments(false);
      setStatus({ type: 'success', message: 'Beitragsreihenfolge gespeichert.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Beitragsreihenfolge konnte nicht gespeichert werden.' });
    } finally {
      setIsSavingDocumentOrder(false);
      setDraggedDocumentId(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!editingId || typeof window === 'undefined') {
      return;
    }
    const confirmed = window.confirm('Möchten Sie dieses Dokument endgültig löschen?');
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/documents/${editingId}`, { method: 'DELETE' });
      if (!response.ok) {
        let message = 'Löschen fehlgeschlagen.';
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            message = errorBody.message;
          }
        } catch {
          // Server liefert bei Erfolg keinen Body
        }
        throw new Error(message);
      }
      setStatus({ type: 'success', message: 'Dokument gelöscht.' });
      resetForm();
      await loadDocuments();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Neuer Eintrag</p>
          <h1 className="text-4xl font-serif font-bold text-ink">Dokument hinzufügen</h1>
          <p className="text-ink/70">Bitte füllen Sie alle Pflichtfelder aus. Die Daten werden über die lokale API direkt in der JSON-Datei gespeichert.</p>
        </div>
        <button
          type="button"
          onClick={handleManualReload}
          disabled={isReloading || isSortingDocuments}
          className="inline-flex items-center justify-center rounded-sm border border-parchment-dark px-4 py-2 text-sm font-semibold text-ink hover:bg-parchment-dark/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isReloading ? 'Lädt …' : 'Neu Laden'}
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(360px,38%)_1fr] items-start">
        <aside className="w-full bg-white border border-parchment-dark rounded-sm shadow-sm p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-ink">Gespeicherte Dokumente</h2>
              <p className="text-sm text-ink/60">{isSortingDocuments ? 'Per Drag-and-Drop sortieren' : 'Klicken zum Bearbeiten'}</p>
            </div>
            <span className="text-xs text-ink/60">{displayedDocuments.length} von {documents.length}</span>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-ink/50">Noch keine Dokumente geladen.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {!isSortingDocuments ? (
                  <button
                    type="button"
                    onClick={handleStartSortingDocuments}
                    className="w-full rounded-sm border border-parchment-dark px-3 py-2 text-sm font-semibold hover:bg-parchment-dark/10 disabled:opacity-50"
                    disabled={documents.length < 2}
                  >
                    Sortieren
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDocumentOrder}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={isSavingDocumentOrder || !documentOrderChanged}
                    >
                      <Save size={15} />
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSortingDocuments}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-parchment-dark px-3 py-2 text-sm font-semibold disabled:opacity-50"
                      disabled={isSavingDocumentOrder}
                    >
                      <X size={15} />
                      Abbrechen
                    </button>
                  </>
                )}
              </div>
              <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Suche
                <input
                  type="search"
                  placeholder="Titel, Jahr, Kategorie ..."
                  value={documentSearchQuery}
                  onChange={(event) => setDocumentSearchQuery(event.target.value)}
                  className="mt-1 w-full rounded-sm border border-parchment-dark/70 px-3 py-2 text-sm"
                  disabled={isSortingDocuments}
                />
              </label>
              {!isSortingDocuments && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExpandAllDocuments}
                    className="flex-1 rounded-sm border border-parchment-dark px-3 py-2 text-xs font-semibold hover:bg-parchment-dark/10 disabled:opacity-50"
                    disabled={expandedDocumentIds.length === documents.length}
                  >
                    Alles aufklappen
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAllDocuments}
                    className="flex-1 rounded-sm border border-parchment-dark px-3 py-2 text-xs font-semibold hover:bg-parchment-dark/10 disabled:opacity-50"
                    disabled={expandedDocumentIds.length === 0}
                  >
                    Alles zuklappen
                  </button>
                </div>
              )}
              {displayedDocuments.length === 0 ? (
                <p className="text-sm text-ink/50">{isSortingDocuments ? 'Keine Dokumente vorhanden.' : 'Keine Dokumente passend zur Suche.'}</p>
              ) : !isSortingDocuments ? (
                <DocumentTree
                  documents={displayedDocumentTree}
                  expandedIds={expandedDocumentIds}
                  editingId={editingId}
                  onToggle={toggleDocumentNode}
                  onSelect={handleSelectDocument}
                />
              ) : (
                <ul className="space-y-3">
                  {displayedDocuments.map((doc) => (
                    <li
                      key={doc.id}
                      draggable={isSortingDocuments && !isSavingDocumentOrder}
                      onDragStart={() => setDraggedDocumentId(doc.id)}
                      onDragEnd={() => setDraggedDocumentId(null)}
                      onDragOver={(event) => {
                        if (isSortingDocuments) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveDocumentInOrder(draggedDocumentId, doc.id);
                      }}
                      className={`${isSortingDocuments ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedDocumentId === doc.id ? 'opacity-50' : ''}`}
                    >
                      <div className="w-full border border-parchment-dark/60 rounded-sm px-4 py-3 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <GripVertical size={16} className="shrink-0 text-ink/50" />
                            <p className="text-sm font-semibold leading-snug">{doc.title}</p>
                          </div>
                          <StatusBadge status={doc.review?.status} />
                        </div>
                        <p className="pl-6 text-xs text-ink/60">{doc.year || 'Ohne Jahr'} · {doc.category || 'Ohne Kategorie'}</p>
                        <div className="pl-6">
                          <PublishingTargets doc={doc} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {editingId && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-parchment/60 border border-parchment-dark/50 rounded-sm px-4 py-2 text-sm text-ink/80">
              <span>Bearbeite: {form.title || editingId}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-accent hover:underline text-xs disabled:opacity-60"
                  disabled={isSubmitting || isDeleting}
                >
                  Neuen Eintrag anlegen
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDocument}
                  className="text-xs text-red-600 hover:underline disabled:opacity-60"
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? 'Lösche…' : 'Dokument löschen'}
                </button>
              </div>
            </div>
          )}

          <CollapsibleSection
            eyebrow="Beitrag"
            title="Beitrag"
            summary={form.title || 'Pflichtfelder'}
            isOpen={openSections.document}
            onToggle={() => toggleSection('document')}
          >
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm font-medium text-ink/80">
                  Titel*
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-ink/80">
                  Jahr*
                  <input
                    name="year"
                    type="number"
                    value={form.year}
                    onChange={handleChange}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm font-medium text-ink/80 block">
                Übergeordnetes Dokument
                <select
                  name="parent_id"
                  value={form.parent_id}
                  onChange={handleChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
                >
                  <option value="">Kein übergeordnetes Dokument</option>
                  {parentDocumentOptions.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {'- '.repeat(doc.level)}{doc.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm font-medium text-ink/80">
                  Kategorie*
                  <select
                    name="category"
                    value={selectedArea}
                    onChange={handleAreaChange}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    {areaOptions.map((area) => (
                      <option key={area.id} value={area.label}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-1 text-sm font-medium text-ink/80">
                  Unterkategorien
                  <div className="border border-parchment-dark rounded-sm px-3 py-2 bg-parchment/30 max-h-40 overflow-y-auto">
                    {availableSubs.length === 0 && (
                      <p className="text-xs text-ink/50">Keine Unterkategorien verfügbar.</p>
                    )}
                    {availableSubs.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 text-sm font-normal text-ink/70 py-1">
                        <input
                          type="checkbox"
                          value={sub.label}
                          checked={selectedSubcategories.includes(sub.label)}
                          onChange={() => toggleSubcategory(sub.label)}
                        />
                        {sub.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="space-y-1 text-sm font-medium text-ink/80 block">
                Ort
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                />
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            eyebrow="Inhalt"
            title="Inhalt"
            summary={form.description || form.transcription ? 'Inhalte vorhanden' : 'Optional'}
            isOpen={openSections.content}
            onToggle={() => toggleSection('content')}
          >
            <div className="space-y-5">
              <MarkdownEditor
                label="Kurzfassung"
                value={form.description}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, description: nextValue }))}
                jsonValue={form.descriptionJson}
                onJsonChange={(nextValue) => setForm((prev) => ({ ...prev, descriptionJson: nextValue }))}
                enableAlbumPhotos
                placeholder="Optionale Kurzfassung mit Kontext, Einordnung oder Hinweisen."
              />

              <MarkdownEditor
                label="Inhalt"
                value={form.transcription}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, transcription: nextValue }))}
                jsonValue={form.transcriptionJson}
                onJsonChange={(nextValue) => setForm((prev) => ({ ...prev, transcriptionJson: nextValue }))}
                enableAlbumPhotos
                placeholder="Optionaler Originaltext, Notizen, Beobachtungen oder Bild-Einordnungen."
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            eyebrow="Medien"
            title="Medien"
            summary={`${selectedAlbumPhotos.length + (selectedCoverPhoto ? 1 : 0)} Fotos · ${inlineAlbumPhotoIds.length} im Text · ${selectedPdfs.length} PDFs`}
            isOpen={openSections.media}
            onToggle={() => toggleSection('media')}
          >
            <div className="space-y-5">
        {inlineAlbumPhotoIds.length > 0 && (
          <section className="border border-accent/30 rounded-sm bg-accent/5 p-4 space-y-3">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">Fotos im Text</h2>
              <p className="text-sm text-ink/70">
                Diese Album-Fotos wurden direkt im Editor eingefügt und werden beim Speichern automatisch mit dem Beitrag verknüpft.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {inlineAlbumPhotos.length > 0 ? inlineAlbumPhotos.map((photo) => (
                <span
                  key={photo.id}
                  className="inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-white px-3 py-2 text-xs font-semibold text-ink/80"
                >
                  {photo.preview || photo.original ? (
                    <img
                      src={photo.preview || photo.original}
                      alt=""
                      className="h-8 w-8 rounded-sm object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {photo.name || `Foto ${photo.id}`}
                </span>
              )) : inlineAlbumPhotoIds.map((photoId) => (
                <span
                  key={photoId}
                  className="inline-flex rounded-sm border border-accent/30 bg-white px-3 py-2 text-xs font-semibold text-ink/80"
                >
                  Foto {photoId}
                </span>
              ))}
            </div>
          </section>
        )}
        <section className="border border-parchment-dark rounded-sm bg-parchment/20 p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">Beitragsbild</h2>
              <p className="text-sm text-ink/70">Wählen Sie ein Album-Foto als Titelbild des Dokuments.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCoverPhotoSelectorOpen(true)}
              className="px-4 py-2 bg-ink text-white text-sm font-semibold rounded-sm"
            >
              Beitragsbild auswählen
            </button>
          </div>
          {!selectedCoverPhoto ? (
            <p className="text-sm text-ink/60">Noch kein Beitragsbild ausgewählt.</p>
          ) : (
            <div className="border border-parchment-dark rounded-sm overflow-hidden bg-white max-w-md">
              <div className="aspect-video bg-parchment-dark">
                {selectedCoverPhoto.preview || selectedCoverPhoto.original ? (
                  <img
                    src={selectedCoverPhoto.preview || selectedCoverPhoto.original}
                    alt={selectedCoverPhoto.name || `Foto ${selectedCoverPhoto.id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-ink/50">Keine Vorschau</div>
                )}
              </div>
              <div className="p-3 text-sm space-y-1">
                <p className="font-semibold text-ink">{selectedCoverPhoto.name || `Foto ${selectedCoverPhoto.id}`}</p>
                <p className="text-ink/60">{selectedCoverPhoto.date_taken || 'Aufnahmedatum unbekannt'}</p>
                <p className="text-ink/60 text-xs">ID: {selectedCoverPhoto.id}</p>
                <button
                  type="button"
                  onClick={removeCoverPhotoSelection}
                  className="text-xs text-red-600 hover:underline"
                >
                  Beitragsbild entfernen
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="border border-parchment-dark rounded-sm bg-parchment/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">Fotos aus Alben</h2>
              <p className="text-sm text-ink/70">Wählen Sie vorhandene Album-Fotos als Referenz aus.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAlbumPhotoSelectorOpen(true)}
              className="px-4 py-2 bg-parchment-dark text-ink text-sm font-semibold rounded-sm"
            >
              Album-Fotos hinzufügen
            </button>
          </div>
          {selectedAlbumPhotos.length === 0 ? (
            <p className="text-sm text-ink/60">Noch keine Album-Fotos verknüpft.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedAlbumPhotos.map((photo) => (
                <div key={photo.id} className="border border-parchment-dark rounded-sm overflow-hidden bg-white">
                  <div className="aspect-video bg-parchment-dark">
                    {photo.preview || photo.original ? (
                      <img
                        src={photo.preview || photo.original}
                        alt={photo.name || `Foto ${photo.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-ink/50">Keine Vorschau</div>
                    )}
                  </div>
                  <div className="p-3 text-sm space-y-1">
                    <p className="font-semibold text-ink">{photo.name || `Foto ${photo.id}`}</p>
                    <p className="text-ink/60">{photo.date_taken || 'Aufnahmedatum unbekannt'}</p>
                    <p className="text-ink/60 text-xs">ID: {photo.id}</p>
                    <button
                      type="button"
                      onClick={() => removeAlbumPhotoFromSelection(photo.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-parchment-dark rounded-sm bg-parchment/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">Verknüpfte PDFs</h2>
              <p className="text-sm text-ink/70">Binden Sie digitale Quellen über die PDF-Bibliothek ein.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPdfSelectorOpen(true)}
              className="px-4 py-2 bg-ink text-white text-sm font-semibold rounded-sm"
            >
              PDFs aus Mediathek hinzufügen
            </button>
          </div>
          {selectedPdfs.length === 0 ? (
            <p className="text-sm text-ink/60">Noch keine PDFs verknüpft.</p>
          ) : (
            <div className="space-y-4">
              {selectedPdfs.map((pdf) => (
                <div key={pdf.id} className="border border-parchment-dark rounded-sm bg-white p-3 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{pdf.title}</p>
                      <p className="text-xs text-ink/60">{pdf.year || 'Unbekannt'} · {pdf.location || 'Ohne Ort'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePdfFromSelection(pdf.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Entfernen
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="border border-parchment-dark rounded-sm overflow-hidden bg-parchment/40">
                      {pdfPreviewUrl(pdf) ? (
                        <iframe src={pdfPreviewUrl(pdf)} title={pdf.title} className="w-full h-48" />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-ink/60">
                          Keine Vorschau
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-ink/70 space-y-1">
                      <p>Quelle: {pdf.source || 'Unbekannt'}</p>
                      <p>Lizenz: {formatLicenseLabel(pdf.license)}</p>
                      <p>ID: {pdf.id}</p>
                      {pdfPreviewUrl(pdf) && (
                        <div className="flex items-center gap-4 text-xs pt-2">
                          <a href={pdfPreviewUrl(pdf)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            Im neuen Tab öffnen
                          </a>
                          <a href={pdfPreviewUrl(pdf)} download className="text-ink hover:underline">
                            Herunterladen
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            eyebrow="Quellen"
            title="Quellen"
            summary={form.editor || form.source || form.author ? 'Metadaten vorhanden' : 'Bearbeiter erforderlich'}
            isOpen={openSections.sources}
            onToggle={() => toggleSection('sources')}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <label className="space-y-1 text-sm font-medium text-ink/80">
                Autor
                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-ink/80">
                Quelle
                <input
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-ink/80">
                Bearbeiter*
                <input
                  name="editor"
                  value={form.editor}
                  onChange={handleChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                  required
                />
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            eyebrow="Veröffentlichung"
            title="Veröffentlichung"
            summary={publishingSummary}
            isOpen={openSections.publishing}
            onToggle={() => toggleSection('publishing')}
          >
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-sm border border-parchment-dark bg-parchment/20 p-4 text-sm text-ink/80">
                <input
                  type="checkbox"
                  name="showInArchive"
                  checked={form.showInArchive !== false}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-ink">Im Archiv anzeigen</span>
                  <span className="block text-ink/60">
                    Deaktivieren, wenn der Beitrag gespeichert bleiben, aber nicht in der Archivübersicht erscheinen soll.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-sm border border-parchment-dark bg-parchment/20 p-4 text-sm text-ink/80">
                <input
                  type="checkbox"
                  name="showInTimeline"
                  checked={form.showInTimeline !== false}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-ink">In Zeitleiste anzeigen</span>
                  <span className="block text-ink/60">
                    Deaktivieren, wenn der Beitrag nicht in der Zeitleiste erscheinen soll.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-sm border border-parchment-dark bg-parchment/20 p-4 text-sm text-ink/80">
                <input
                  type="checkbox"
                  name="showInWordCloud"
                  checked={form.showInWordCloud !== false}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-ink">In Wortwolke berücksichtigen</span>
                  <span className="block text-ink/60">
                    Deaktivieren, wenn der Titel nicht in die Wortwolke einfließen soll.
                  </span>
                </span>
              </label>
            </div>
          </CollapsibleSection>

        <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-sm border border-parchment-dark bg-white px-4 py-3 shadow-md">
          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className="ml-auto px-6 py-3 bg-accent text-white font-semibold rounded-sm shadow hover:bg-accent-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Speichern…' : editingId ? 'Dokument aktualisieren' : 'Dokument speichern'}
          </button>
        </div>
        </form>
      </div>

      <AlbumPhotoSelectorModal
        isOpen={isCoverPhotoSelectorOpen}
        onClose={() => setIsCoverPhotoSelectorOpen(false)}
        onConfirm={handleCoverPhotoSelectionSave}
        selectedPhotos={selectedCoverPhoto ? [selectedCoverPhoto] : []}
        selectionMode="single"
        title="Beitragsbild auswählen"
        eyebrow="Titelbild"
        confirmLabel="Beitragsbild übernehmen"
      />
      <AlbumPhotoSelectorModal
        isOpen={isAlbumPhotoSelectorOpen}
        onClose={() => setIsAlbumPhotoSelectorOpen(false)}
        onConfirm={handleAlbumPhotoSelectionSave}
        selectedPhotos={selectedAlbumPhotos}
      />
      <PdfSelectorModal
        isOpen={isPdfSelectorOpen}
        onClose={() => setIsPdfSelectorOpen(false)}
        onConfirm={handlePdfSelectionSave}
        selectedIds={form.pdfIds}
        selectedPdfs={selectedPdfs}
        pdfLibrary={pdfLibrary}
        pdfLibraryLoading={pdfLibraryLoading}
        pdfLibraryError={pdfLibraryError}
        onRefreshLibrary={loadPdfLibrary}
      />
    </div>
  );
};

export default SubmitDocument;
