import React, { useEffect, useState } from 'react';
import { fetchImages } from '../services/api.js';

const statusOptions = [
  { value: '', label: 'Alle Stati' },
  { value: 'pending', label: 'Ausstehend' },
  { value: 'in_review', label: 'In Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' }
];

const ImageSelectorModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedIds = [],
  selectedImages = []
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: '', year: '', status: '' });
  const [selectionMap, setSelectionMap] = useState(new Map());

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initial = new Map();
    selectedImages.forEach((img) => {
      if (img?.id) {
        initial.set(img.id, img);
      }
    });
    setSelectionMap(initial);
  }, [isOpen, selectedImages]);

  const loadImages = async () => {
    if (!isOpen) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImages({ ...filters, sort: 'updatedAt', order: 'desc' });
      setImages(data);
      if (selectedIds.length > 0) {
        setSelectionMap((prev) => {
          const next = new Map(prev);
          const selectedSet = new Set(selectedIds);
          data.forEach((img) => {
            if (selectedSet.has(img.id) && !next.has(img.id)) {
              next.set(img.id, img);
            }
          });
          return next;
        });
      }
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.year, filters.status, isOpen]);

  const toggleSelection = (image) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      if (next.has(image.id)) {
        next.delete(image.id);
      } else {
        next.set(image.id, image);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = Array.from(selectionMap.values());
    onConfirm(selected);
    onClose();
  };

  const previewUrl = (image) => {
    if (image.file?.type === 'remote') {
      return image.file?.originalUrl || image.file?.path || '';
    }
    return image.file?.path || image.file?.originalUrl || '';
  };

  const selectedCount = selectionMap.size;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-6">
      <div className="bg-white rounded-md shadow-xl w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-parchment-dark px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-ink/60">Mediathek</p>
            <h2 className="text-2xl font-serif font-bold">Bilder auswählen</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
            Schließen
          </button>
        </header>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="grid md:grid-cols-4 gap-4">
            <input
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Suche nach Titel, Ort, Tags"
              className="border border-parchment-dark rounded-sm px-3 py-2 md:col-span-2"
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-ink/60 flex items-center justify-between">
            <span>{selectedCount} Bild(er) ausgewählt</span>
            <button type="button" className="text-accent hover:underline" onClick={loadImages}>
              Aktualisieren
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && <p className="text-sm text-ink/60">Lade Bilder…</p>}
            {!loading && images.length === 0 && (
              <p className="text-sm text-ink/60">Keine Bilder gefunden.</p>
            )}
            {images.map((image) => {
              const isSelected = selectionMap.has(image.id);
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => toggleSelection(image)}
                  className={`text-left border rounded-sm p-3 space-y-2 transition ${
                    isSelected ? 'border-accent bg-accent/10' : 'border-parchment-dark hover:border-accent'
                  }`}
                >
                  <div className="aspect-video overflow-hidden rounded-sm bg-parchment-dark">
                    {previewUrl(image) ? (
                      <img src={previewUrl(image)} alt={image.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-ink/60">
                        Keine Vorschau
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{image.title}</p>
                    <p className="text-xs text-ink/60">{image.year || 'Unbekannt'} · {image.location || 'Ohne Ort'}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${
                      image.review?.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : image.review?.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-parchment/70 text-ink/70'
                    }`}>
                      {statusOptions.find((option) => option.value === image.review?.status)?.label ?? 'Unbekannt'}
                    </span>
                    {isSelected && <span className="text-accent text-xs font-semibold">Ausgewählt</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-parchment-dark">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-sm"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorModal;
