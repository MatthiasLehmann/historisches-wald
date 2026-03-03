import { useEffect, useState } from 'react';
import { fetchAlbumPhotos, fetchAlbums, fetchPhotos } from '../services/api.js';

const AlbumPhotoSelectorModal = ({ isOpen, onClose, onConfirm, selectedPhotos = [] }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectionMap, setSelectionMap] = useState(new Map());
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const normalizedSearch = search.trim();

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initSelection = new Map();
    selectedPhotos.forEach((photo) => {
      if (photo?.id) {
        initSelection.set(String(photo.id), photo);
      }
    });
    setSelectionMap(initSelection);
  }, [isOpen, selectedPhotos]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const loadAlbums = async () => {
      try {
        const data = await fetchAlbums();
        setAlbums(data);
      } catch (err) {
        setError(err.message || 'Alben konnten nicht geladen werden.');
      }
    };
    loadAlbums();
  }, [isOpen]);

  useEffect(() => {
    if (albums.length > 0 && !selectedAlbumId) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!selectedAlbumId || !isOpen) {
        setPhotos([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await fetchAlbumPhotos(selectedAlbumId);
        setPhotos(data);
      } catch (err) {
        setError(err.message || 'Fotos konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, [selectedAlbumId, isOpen]);

  const handleToggleSelection = (photo) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      const key = String(photo.id);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, photo);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectionMap.values()));
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !normalizedSearch) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    const runSearch = async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const data = await fetchPhotos({ search: normalizedSearch });
        if (!cancelled) {
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err.message || 'Fotosuche fehlgeschlagen.');
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };
    runSearch();
    return () => {
      cancelled = true;
    };
  }, [isOpen, normalizedSearch]);

  const visiblePhotos = normalizedSearch ? searchResults : photos;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-6">
      <div className="bg-white rounded-md shadow-xl w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-parchment-dark px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-ink/60">Alben</p>
            <h2 className="text-2xl font-serif font-bold">Album-Fotos auswählen</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
            Schließen
          </button>
        </header>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <select
              value={selectedAlbumId}
              onChange={(event) => setSelectedAlbumId(event.target.value)}
              className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
            >
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach Foto-Name"
              className="border border-parchment-dark rounded-sm px-3 py-2 md:col-span-2"
            />
          </div>
          {searchError && normalizedSearch && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-xs rounded-sm">
              {searchError}
            </div>
          )}
          {normalizedSearch && !searchError && (
            <p className="text-xs text-ink/60">
              {searchLoading
                ? 'Durchsuche alle photo*.json-Dateien …'
                : `Treffer in allen photo*.json-Dateien: ${visiblePhotos.length}`}
            </p>
          )}

          <div className="text-sm text-ink/60 flex items-center justify-between">
            <span>{selectionMap.size} Foto(s) ausgewählt</span>
            {normalizedSearch ? (
              <span>Globale Treffer: {visiblePhotos.length}</span>
            ) : (
              <span>Album enthält {photos.length} Fotos</span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && !normalizedSearch && (
              <p className="text-sm text-ink/60 sm:col-span-2 lg:col-span-3">Lade Album-Fotos…</p>
            )}
            {normalizedSearch && searchLoading && (
              <p className="text-sm text-ink/60 sm:col-span-2 lg:col-span-3">Durchsuche alle Foto-Dateien…</p>
            )}
            {!loading && !(normalizedSearch && searchLoading) && visiblePhotos.length === 0 && (
              <p className="text-sm text-ink/60 sm:col-span-2 lg:col-span-3">Keine Fotos gefunden.</p>
            )}
            {visiblePhotos.map((photo) => {
              const isSelected = selectionMap.has(String(photo.id));
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleToggleSelection(photo)}
                  className={`text-left border rounded-sm p-3 space-y-2 transition ${
                    isSelected ? 'border-accent bg-accent/10' : 'border-parchment-dark hover:border-accent'
                  }`}
                >
                  <div className="aspect-video overflow-hidden rounded-sm bg-parchment-dark">
                    {photo.preview || photo.original ? (
                      <img
                        src={photo.preview || photo.original}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-ink/60">
                        Keine Vorschau
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{photo.name || `Foto ${photo.id}`}</p>
                    <p className="text-xs text-ink/60">{photo.date_taken || 'Unbekannt'}</p>
                  </div>
                  {isSelected && <span className="text-accent text-xs font-semibold">Ausgewählt</span>}
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
              className="px-4 py-2 bg-ink text-white rounded-sm text-sm"
              onClick={handleConfirm}
              disabled={selectionMap.size === 0}
            >
              Auswahl übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumPhotoSelectorModal;
