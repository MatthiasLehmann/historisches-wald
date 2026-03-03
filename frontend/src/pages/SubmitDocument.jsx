import React, { useCallback, useEffect, useMemo, useState } from 'react';
import categoriesData from '../data/categories.json';
import PdfSelectorModal from '../components/PdfSelectorModal.jsx';
import AlbumPhotoSelectorModal from '../components/AlbumPhotoSelectorModal.jsx';
import { fetchPdfs, fetchPhotos } from '../services/api.js';
import MarkdownEditor from '../components/MarkdownEditor.jsx';

const initialForm = {
  title: '',
  year: '',
  location: '',
  description: '',
  transcription: '',
  author: '',
  source: '',
  condition: '',
  albumPhotoIds: [],
  pdfIds: [],
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
  const [selectedAlbumPhotos, setSelectedAlbumPhotos] = useState([]);
  const [isAlbumPhotoSelectorOpen, setIsAlbumPhotoSelectorOpen] = useState(false);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [isPdfSelectorOpen, setIsPdfSelectorOpen] = useState(false);
  const [pdfLibrary, setPdfLibrary] = useState([]);
  const [pdfLibraryLoading, setPdfLibraryLoading] = useState(false);
  const [pdfLibraryError, setPdfLibraryError] = useState(null);

  const areaOptions = useMemo(() => {
    const root = categoriesData[0];
    return Array.isArray(root?.subcategories) ? root.subcategories : [];
  }, []);

  const currentArea = areaOptions.find((area) => area.label === selectedArea);
  const availableSubs = currentArea?.subcategories ?? [];

  const filteredDocuments = useMemo(() => {
    if (!documentSearchQuery.trim()) {
      return documents;
    }
    const query = documentSearchQuery.toLowerCase();
    return documents.filter((doc) => {
      const searchable = [
        doc.title,
        doc.year ? String(doc.year) : '',
        doc.category,
        Array.isArray(doc.subcategories)
          ? doc.subcategories.join(' ')
          : doc.subcategory ?? '',
        doc.metadata?.author ?? '',
        doc.location ?? '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [documents, documentSearchQuery]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Dokumentenliste konnte nicht geladen werden.');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

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
    setSelectedAlbumPhotos([]);
    setSelectedPdfs([]);
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
      transcription: Array.isArray(doc.transcription)
        ? doc.transcription.join('\n\n')
        : doc.transcription ?? '',
      author: doc.metadata?.author ?? '',
      source: doc.metadata?.source ?? '',
      condition: doc.metadata?.condition ?? '',
      albumPhotoIds: Array.isArray(doc.albumPhotoIds) ? doc.albumPhotoIds : [],
      pdfIds: Array.isArray(doc.pdfIds) ? doc.pdfIds : [],
    });
    setSelectedArea(doc.category ?? '');
    setSelectedSubcategories(
      Array.isArray(doc.subcategories)
        ? doc.subcategories
        : doc.subcategory
          ? [doc.subcategory]
          : [],
    );
    const nextAlbumPhotoIds = Array.isArray(doc.albumPhotoIds) ? doc.albumPhotoIds : [];
    loadSelectedAlbumPhotos(nextAlbumPhotoIds);
    const nextPdfIds = Array.isArray(doc.pdfIds) ? doc.pdfIds : [];
    loadSelectedPdfs(nextPdfIds);
    if (nextPdfIds.length > 0) {
      loadPdfLibrary();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : '',
        category: selectedArea,
        subcategories: selectedSubcategories,
        transcription: form.transcription,
        albumPhotoIds: Array.isArray(form.albumPhotoIds) ? form.albumPhotoIds : [],
        pdfIds: Array.isArray(form.pdfIds) ? form.pdfIds : [],
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

  const loadSelectedAlbumPhotos = async (photoIds) => {
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      setSelectedAlbumPhotos([]);
      return;
    }
    try {
      const data = await fetchPhotos({ ids: photoIds });
      const ordered = photoIds
        .map((id) => data.find((photo) => String(photo.id) === String(id)))
        .filter(Boolean);
      setSelectedAlbumPhotos(ordered);
    } catch (error) {
      console.error('Album-Fotos konnten nicht geladen werden:', error);
    }
  };

  const handleAlbumPhotoSelectionSave = (photos) => {
    const ids = photos.map((photo) => photo.id);
    setForm((prev) => ({ ...prev, albumPhotoIds: ids }));
    setSelectedAlbumPhotos(photos);
  };

  const removeAlbumPhotoFromSelection = (id) => {
    setSelectedAlbumPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setForm((prev) => ({
      ...prev,
      albumPhotoIds: prev.albumPhotoIds.filter((photoId) => photoId !== id),
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

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Neuer Eintrag</p>
        <h1 className="text-4xl font-serif font-bold text-ink">Dokument hinzufügen</h1>
        <p className="text-ink/70">Bitte füllen Sie alle Pflichtfelder aus. Die Daten werden über die lokale API direkt in der JSON-Datei gespeichert.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-1/5 bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <h2 className="text-lg font-serif font-bold text-ink">Gespeicherte Dokumente</h2>
            <p className="text-xs text-ink/60">Klicken zum Bearbeiten</p>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-ink/50">Noch keine Dokumente geladen.</p>
          ) : (
            <>
              <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wide">
                Suche
                <input
                  type="search"
                  placeholder="Titel, Jahr, Kategorie ..."
                  value={documentSearchQuery}
                  onChange={(event) => setDocumentSearchQuery(event.target.value)}
                  className="mt-1 w-full rounded-sm border border-parchment-dark/70 px-3 py-2 text-sm"
                />
              </label>
              {filteredDocuments.length === 0 ? (
                <p className="text-sm text-ink/50">Keine Dokumente passend zur Suche.</p>
              ) : (
                <ul className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectDocument(doc)}
                        className={`w-full text-left border rounded-sm px-3 py-2 transition-colors ${
                          editingId === doc.id
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-parchment-dark/60 hover:border-accent'
                        }`}
                      >
                        <p className="font-semibold text-sm">{doc.title}</p>
                        <p className="text-xs text-ink/60">{doc.year} · {doc.category}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>

        <form onSubmit={handleSubmit} className="w-full lg:w-4/5 space-y-6 bg-white border border-parchment-dark rounded-sm shadow-sm p-6">
          {editingId && (
            <div className="flex items-center justify-between bg-parchment/60 border border-parchment-dark/50 rounded-sm px-4 py-2 text-sm text-ink/80">
              <span>Bearbeite: {form.title || editingId}</span>
              <button type="button" onClick={resetForm} className="text-accent hover:underline text-xs">
                Neuen Eintrag anlegen
              </button>
            </div>
          )}

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
          Ort*
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            required
          />
        </label>

        <MarkdownEditor
          label="Beschreibung*"
          value={form.description}
          onChange={(nextValue) => setForm((prev) => ({ ...prev, description: nextValue }))}
          placeholder="Beschreiben Sie das Dokument samt Kontext in Markdown."
          required
          helperText="Nutzen Sie Markdown für strukturierte Absätze, Listen und Links."
        />

        <MarkdownEditor
          label="Transkription / Notizen"
          value={form.transcription}
          onChange={(nextValue) => setForm((prev) => ({ ...prev, transcription: nextValue }))}
          placeholder="Optionaler Volltext, Notizen oder Beobachtungen als Markdown."
          helperText="Optional: Nutzen Sie die Vorschau, um die Transkription zu kontrollieren."
        />

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
                      <p>Lizenz: {pdf.license || 'rights-reserved'}</p>
                      <p>ID: {pdf.id}</p>
                      {pdfPreviewUrl(pdf) && (
                        <div className="flex items-center gap-4 text-xs pt-2">
                          <a href={pdfPreviewUrl(pdf)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                            Im neuen Tab öffnen
                          </a>
                          <a href={pdfPreviewUrl(pdf)} download className="text-ink hover:underline">
                            Download
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
            Zustand
            <input
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto px-6 py-3 bg-accent text-white font-semibold rounded-sm shadow hover:bg-accent-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Speichern…' : editingId ? 'Dokument aktualisieren' : 'Dokument speichern'}
          </button>
        </div>
        </form>
      </div>

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
