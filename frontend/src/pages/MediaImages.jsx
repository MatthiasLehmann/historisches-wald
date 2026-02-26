import React, { useCallback, useEffect, useState } from 'react';
import { Grid, Images as ImagesIcon, LayoutList, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import ImageEditorModal from '../components/ImageEditorModal.jsx';
import {
  deleteImageAsset,
  fetchImages,
  importRemoteImage
} from '../services/api.js';

const statusColors = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-parchment/80 text-ink/80'
};

const viewModes = [
  { id: 'grid', label: 'Grid', icon: Grid },
  { id: 'list', label: 'Liste', icon: LayoutList }
];

const MediaImages = () => {
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState({ q: '', year: '', status: '', sort: 'updatedAt', order: 'desc' });
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorImage, setEditorImage] = useState(null);
  const [importData, setImportData] = useState({ url: '', title: '', year: '', description: '' });
  const [importing, setImporting] = useState(false);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchImages(filters);
      setImages(result);
      return result;
    } catch (fetchError) {
      setError(fetchError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const previewUrl = useCallback((image) => {
    if (image.file?.type === 'remote') {
      return image.file?.originalUrl || image.file?.path || '';
    }
    return image.file?.path || image.file?.originalUrl || '';
  }, []);

  const handleOpenEditor = (image = null) => {
    setEditorImage(image);
    setIsEditorOpen(true);
  };

  const handleDelete = async (image) => {
    if (!window.confirm(`Bild ${image.title} wirklich löschen?`)) {
      return;
    }
    try {
      await deleteImageAsset(image.id);
      loadImages();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!importData.url.trim()) {
      setError('Bitte geben Sie eine URL ein.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      await importRemoteImage({
        url: importData.url.trim(),
        title: importData.title.trim() || undefined,
        year: importData.year ? Number(importData.year) : undefined,
        description: importData.description.trim() || undefined
      });
      setImportData({ url: '', title: '', year: '', description: '' });
      loadImages();
    } catch (importError) {
      setError(importError.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Mediathek</p>
        <div className="flex items-center gap-3">
          <ImagesIcon className="text-accent" />
          <h1 className="text-4xl font-serif font-bold">Bildbibliothek</h1>
        </div>
        <p className="text-ink/70 text-sm">Verwalten Sie zentrale Bildressourcen mit Metadaten, Review-Status und Verknüpfung zu Dokumenten.</p>
      </header>

      {error && <div className="bg-red-50 text-red-700 px-4 py-2 mb-4 text-sm">{error}</div>}

      <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4">
        <div className="grid lg:grid-cols-6 gap-3">
          <input
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="Suche nach Titel, Quelle, Tags"
            className="border border-parchment-dark rounded-sm px-3 py-2 lg:col-span-2"
          />
          <input
            value={filters.year}
            onChange={(event) => setFilters((prev) => ({ ...prev, year: event.target.value }))}
            placeholder="Jahr"
            className="border border-parchment-dark rounded-sm px-3 py-2"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
          >
            <option value="">Alle Stati</option>
            <option value="pending">Ausstehend</option>
            <option value="in_review">In Prüfung</option>
            <option value="approved">Freigegeben</option>
            <option value="rejected">Abgelehnt</option>
          </select>
          <select
            value={filters.sort}
            onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
          >
            <option value="updatedAt">Aktualisiert</option>
            <option value="year">Jahr</option>
          </select>
          <select
            value={filters.order}
            onChange={(event) => setFilters((prev) => ({ ...prev, order: event.target.value }))}
            className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
          >
            <option value="desc">Neueste zuerst</option>
            <option value="asc">Älteste zuerst</option>
          </select>
          <div className="flex items-center justify-end gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`p-2 border rounded-sm ${viewMode === mode.id ? 'border-accent bg-accent/10 text-accent' : 'border-parchment-dark text-ink/60'}`}
              >
                <mode.icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 border-t border-parchment-dark pt-4">
          <form onSubmit={handleImport} className="flex flex-wrap gap-2 flex-1">
            <input
              value={importData.url}
              onChange={(event) => setImportData((prev) => ({ ...prev, url: event.target.value }))}
              className="flex-1 min-w-[200px] border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Bild-URL importieren"
            />
            <input
              value={importData.title}
              onChange={(event) => setImportData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-48 border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Titel"
            />
            <input
              value={importData.year}
              onChange={(event) => setImportData((prev) => ({ ...prev, year: event.target.value }))}
              className="w-28 border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Jahr"
              type="number"
            />
            <input
              value={importData.description}
              onChange={(event) => setImportData((prev) => ({ ...prev, description: event.target.value }))}
              className="flex-1 min-w-[200px] border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Kurzbeschreibung"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-parchment-dark text-sm font-semibold rounded-sm disabled:opacity-60"
              disabled={importing}
            >
              Importieren
            </button>
          </form>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleOpenEditor(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-sm"
            >
              <Plus size={16} /> Neues Bild
            </button>
            <button
              type="button"
              onClick={loadImages}
              className="inline-flex items-center gap-2 px-4 py-2 border border-parchment-dark rounded-sm text-sm"
            >
              <RefreshCcw size={16} /> Aktualisieren
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        {loading && <p className="text-sm text-ink/60">Lade Bilder…</p>}
        {!loading && images.length === 0 && (
          <p className="text-sm text-ink/60">Keine Bilder verfügbar.</p>
        )}

        {!loading && images.length > 0 && viewMode === 'grid' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((image) => (
              <article key={image.id} className="border border-parchment-dark rounded-sm overflow-hidden bg-white shadow-sm">
                <div className="aspect-[4/3] bg-parchment-dark">
                  {previewUrl(image) ? (
                    <img src={previewUrl(image)} alt={image.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-ink/50">Keine Vorschau</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-serif font-semibold">{image.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[image.review?.status] || 'bg-parchment/80 text-ink/70'}`}>
                      {image.review?.status ?? 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60">{image.year || 'Unbekannt'} · {image.location || 'Ohne Ort'}</p>
                  <p className="text-sm text-ink/80 line-clamp-2">{image.description || 'Keine Beschreibung'}</p>
                  {Array.isArray(image.tags) && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs text-ink/60">
                      {image.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-parchment/80 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-parchment-dark/40 text-xs text-ink/60">
                    <span>Dokumente: {image.linkedDocuments?.length || 0}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(image)}
                        className="text-accent text-sm"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && images.length > 0 && viewMode === 'list' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-parchment/60 text-left">
                  <th className="p-2">Titel</th>
                  <th className="p-2">Jahr</th>
                  <th className="p-2">Ort</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Dokumente</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {images.map((image) => (
                  <tr key={image.id} className="border-b border-parchment-dark/40">
                    <td className="p-2 font-semibold">{image.title}</td>
                    <td className="p-2">{image.year || '—'}</td>
                    <td className="p-2">{image.location || '—'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full ${statusColors[image.review?.status] || 'bg-parchment/80 text-ink/70'}`}>
                        {image.review?.status ?? 'pending'}
                      </span>
                    </td>
                    <td className="p-2">{image.linkedDocuments?.length || 0}</td>
                    <td className="p-2 text-right">
                      <button type="button" onClick={() => handleOpenEditor(image)} className="text-accent mr-3">
                        Bearbeiten
                      </button>
                      <button type="button" onClick={() => handleDelete(image)} className="text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ImageEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        image={editorImage}
        onSaved={async (saved) => {
          if (saved) {
            setEditorImage(saved);
          }
          const updatedList = await loadImages();
          const targetId = saved?.id ?? editorImage?.id;
          if (targetId) {
            const refreshed = updatedList.find((img) => img.id === targetId);
            if (refreshed) {
              setEditorImage(refreshed);
            }
          }
        }}
      />
    </div>
  );
};

export default MediaImages;
