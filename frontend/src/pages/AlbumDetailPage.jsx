import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Save, Trash2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AlbumEditor from '../components/AlbumEditor';
import PhotoCard from '../components/PhotoCard';
import {
  fetchAlbumById,
  fetchAlbumPhotos,
  fetchAlbums,
  deleteAlbum,
  removePhotoFromAlbum,
  reorderAlbumPhotos,
  updateAlbum,
  uploadAlbumPhoto
} from '../services/api.js';

const PAGE_SIZE = 24;
const defaultUploadForm = {
  name: '',
  description: '',
  date_taken: '',
  file: null,
  setAsCover: true
};

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [photoSearch, setPhotoSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadForm, setUploadForm] = useState(defaultUploadForm);
  const [photoActionError, setPhotoActionError] = useState('');
  const [photoActionSuccess, setPhotoActionSuccess] = useState('');
  const [removingPhotoId, setRemovingPhotoId] = useState(null);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [isSortingPhotos, setIsSortingPhotos] = useState(false);
  const [orderedPhotos, setOrderedPhotos] = useState([]);
  const [draggedPhotoId, setDraggedPhotoId] = useState(null);
  const [savingPhotoOrder, setSavingPhotoOrder] = useState(false);
  const uploadInputRef = useRef(null);
  const isUnassignedAlbum = ((album?.title ?? '').trim().toLowerCase() === 'nicht zugewiesen');

  const loadAlbum = useCallback(async () => {
    if (!albumId) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [albumData, photosData] = await Promise.all([
        fetchAlbumById(albumId),
        fetchAlbumPhotos(albumId)
      ]);
      setAlbum(albumData);
      setPhotos(photosData);
      setUploadForm(defaultUploadForm);
      setUploadError('');
      setUploadSuccess('');
      setPhotoActionError('');
      setPhotoActionSuccess('');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setPhotoSearch('');
      setPage(1);
    } catch (err) {
      setError(err.message || 'Konnte Album nicht laden.');
      if (err.message?.includes('not found')) {
        navigate('/albums');
      }
    } finally {
      setLoading(false);
    }
  }, [albumId, navigate]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);
  useEffect(() => {
    if (!isSortingPhotos) {
      setOrderedPhotos(photos);
    }
  }, [isSortingPhotos, photos]);
  useEffect(() => {
    const loadAllAlbums = async () => {
      try {
        const data = await fetchAlbums();
        setAllAlbums(data);
      } catch (albumErr) {
        console.error('Albenliste konnte nicht geladen werden.', albumErr);
      }
    };
    loadAllAlbums();
  }, []);

  const handleAlbumSave = async (payload) => {
    if (!albumId) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateAlbum(albumId, payload);
      setAlbum(updated);
      setAllAlbums((prev) => {
        const exists = prev.some((entry) => entry.id === updated.id);
        if (exists) {
          return prev.map((entry) => (entry.id === updated.id ? updated : entry));
        }
        return [updated, ...prev];
      });
    } catch (err) {
      setError(err.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    const needle = photoSearch.trim().toLowerCase();
    return photos.filter((photo) => {
      const name = photo?.name || '';
      return name.toLowerCase().includes(needle);
    });
  }, [photos, photoSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPhotos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPhotos.slice(start, start + PAGE_SIZE);
  }, [filteredPhotos, currentPage]);
  const displayedPhotos = isSortingPhotos ? orderedPhotos : paginatedPhotos;
  const photoOrderChanged = useMemo(() => {
    if (!isSortingPhotos || orderedPhotos.length !== photos.length) {
      return false;
    }
    return orderedPhotos.some((photo, index) => photo.id !== photos[index]?.id);
  }, [isSortingPhotos, orderedPhotos, photos]);

  const hasChildAlbums = useMemo(
    () => allAlbums.some((entry) => String(entry.parent_id || '') === String(albumId)),
    [allAlbums, albumId]
  );
  const canDeleteAlbum = Boolean(album) &&
    photos.length === 0 &&
    Number(album.photo_count || 0) === 0 &&
    !hasChildAlbums &&
    !isUnassignedAlbum;

  const handleDeleteAlbum = async () => {
    if (!albumId || !album) {
      return;
    }
    if (!canDeleteAlbum) {
      setError('Nur leere Alben ohne Unteralben können gelöscht werden.');
      return;
    }
    if (!window.confirm(`Leeres Album "${album.title}" löschen?`)) {
      return;
    }
    setDeletingAlbum(true);
    setError('');
    try {
      await deleteAlbum(albumId);
      navigate('/albums');
    } catch (deleteError) {
      setError(deleteError.message || 'Album konnte nicht gelöscht werden.');
    } finally {
      setDeletingAlbum(false);
    }
  };

  const handleUploadFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUploadForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUploadFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setUploadForm((prev) => ({ ...prev, file }));
  };

  const handleUploadPhoto = async (event) => {
    event.preventDefault();
    if (!albumId) {
      setUploadError('Album nicht gefunden.');
      return;
    }
    if (!uploadForm.file) {
      setUploadError('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }
    setUploadingPhoto(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const response = await uploadAlbumPhoto(albumId, uploadForm);
      if (response?.album) {
        setAlbum(response.album);
      }
      if (response?.photo) {
        setPhotos((prev) => [response.photo, ...prev]);
      } else {
        await loadAlbum();
      }
      setUploadForm(defaultUploadForm);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      setUploadSuccess('Foto erfolgreich hinzugefügt.');
    } catch (uploadErr) {
      setUploadError(uploadErr.message || 'Foto konnte nicht hochgeladen werden.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhotoFromAlbum = async (photo) => {
    if (!albumId || !photo?.id) {
      return;
    }
    setRemovingPhotoId(photo.id);
    setPhotoActionError('');
    setPhotoActionSuccess('');
    try {
      const response = await removePhotoFromAlbum(albumId, photo.id);
      setPhotos((prev) => prev.filter((entry) => entry.id !== photo.id));
      if (response?.album) {
        setAlbum(response.album);
      }
      setPhotoActionSuccess(
        `Foto wurde dem Album "${response?.unassignedAlbum?.title ?? 'nicht zugewiesen'}" zugeordnet.`
      );
    } catch (actionError) {
      setPhotoActionError(actionError.message || 'Foto konnte nicht entfernt werden.');
    } finally {
      setRemovingPhotoId(null);
    }
  };

  const handleStartSorting = () => {
    setPhotoSearch('');
    setPage(1);
    setOrderedPhotos(photos);
    setDraggedPhotoId(null);
    setPhotoActionError('');
    setPhotoActionSuccess('');
    setIsSortingPhotos(true);
  };

  const handleCancelSorting = () => {
    setOrderedPhotos(photos);
    setDraggedPhotoId(null);
    setIsSortingPhotos(false);
  };

  const movePhotoInOrder = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }
    setOrderedPhotos((prev) => {
      const sourceIndex = prev.findIndex((photo) => photo.id === sourceId);
      const targetIndex = prev.findIndex((photo) => photo.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const [movedPhoto] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedPhoto);
      return next;
    });
  };

  const handleSavePhotoOrder = async () => {
    if (!albumId) {
      return;
    }
    setSavingPhotoOrder(true);
    setPhotoActionError('');
    setPhotoActionSuccess('');
    try {
      const response = await reorderAlbumPhotos(
        albumId,
        orderedPhotos.map((photo) => photo.id)
      );
      if (response?.album) {
        setAlbum(response.album);
      }
      const nextPhotos = response?.photos ?? orderedPhotos;
      setPhotos(nextPhotos);
      setOrderedPhotos(nextPhotos);
      setIsSortingPhotos(false);
      setPhotoActionSuccess('Foto-Reihenfolge gespeichert.');
    } catch (orderError) {
      setPhotoActionError(orderError.message || 'Foto-Reihenfolge konnte nicht gespeichert werden.');
    } finally {
      setSavingPhotoOrder(false);
      setDraggedPhotoId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link to="/albums" className="text-sm text-ink/70 hover:text-ink">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-serif">
            {album?.title || 'Album'}
          </h1>
          <p className="text-ink/70 text-sm">ID: {albumId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink/60">{photos.length} Fotos geladen</p>
          {canDeleteAlbum && (
            <button
              type="button"
              onClick={handleDeleteAlbum}
              className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-md text-sm font-semibold disabled:opacity-50"
              disabled={deletingAlbum}
            >
              <Trash2 size={16} />
              {deletingAlbum ? 'Löscht...' : 'Leeres Album löschen'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {uploadError && <p className="text-red-600">{uploadError}</p>}
      {uploadSuccess && <p className="text-emerald-600">{uploadSuccess}</p>}
      {photoActionError && <p className="text-red-600">{photoActionError}</p>}
      {photoActionSuccess && <p className="text-emerald-600">{photoActionSuccess}</p>}

      <AlbumEditor album={album} onSubmit={handleAlbumSave} saving={saving} allAlbums={allAlbums} />

      <form onSubmit={handleUploadPhoto} className="bg-white border border-parchment-dark rounded-lg shadow-sm p-6 flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50 mb-2">Album ergänzen</p>
          <h2 className="text-xl font-serif">Neues Foto hochladen</h2>
        </div>
        <label className="text-sm text-ink/80 space-y-1">
          Titel
          <input
            name="name"
            value={uploadForm.name}
            onChange={handleUploadFieldChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="z.B. Vereinsfest"
            disabled={uploadingPhoto}
          />
        </label>
        <label className="text-sm text-ink/80 space-y-1">
          Beschreibung
          <textarea
            name="description"
            rows={3}
            value={uploadForm.description}
            onChange={handleUploadFieldChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            disabled={uploadingPhoto}
          />
        </label>
        <label className="text-sm text-ink/80 space-y-1">
          Aufnahmedatum
          <input
            type="date"
            name="date_taken"
            value={uploadForm.date_taken}
            onChange={handleUploadFieldChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            disabled={uploadingPhoto}
          />
        </label>
        <label className="text-sm text-ink/80 space-y-1">
          Bilddatei*
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadFileChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            ref={uploadInputRef}
            disabled={uploadingPhoto}
          />
          {uploadForm.file && (
            <span className="text-xs text-ink/60">Ausgewählt: {uploadForm.file.name}</span>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            name="setAsCover"
            checked={uploadForm.setAsCover}
            onChange={handleUploadFieldChange}
            disabled={uploadingPhoto}
          />
          Dieses Foto als Cover verwenden
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-parchment-dark text-ink rounded-md disabled:opacity-50"
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? 'Ladet hoch...' : 'Foto hinzufügen'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-parchment-dark rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-search">
            Fotos filtern
          </label>
          <input
            id="photo-search"
            type="search"
            value={photoSearch}
            onChange={(event) => setPhotoSearch(event.target.value)}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="Foto-Name"
            disabled={isSortingPhotos}
          />
        </div>
        {!isSortingPhotos && (
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="page">
            Seite
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-2 border border-parchment-dark rounded-md"
              disabled={currentPage === 1}
            >
              Zurück
            </button>
            <span className="text-sm text-ink/70">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-2 border border-parchment-dark rounded-md"
              disabled={currentPage === totalPages}
            >
              Weiter
            </button>
          </div>
        </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!isSortingPhotos ? (
            <button
              type="button"
              onClick={handleStartSorting}
              className="px-4 py-2 border border-parchment-dark rounded-md text-sm disabled:opacity-50"
              disabled={photos.length < 2}
            >
              Sortieren
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSavePhotoOrder}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-md text-sm disabled:opacity-50"
                disabled={savingPhotoOrder || !photoOrderChanged}
              >
                <Save size={16} />
                Speichern
              </button>
              <button
                type="button"
                onClick={handleCancelSorting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-parchment-dark rounded-md text-sm disabled:opacity-50"
                disabled={savingPhotoOrder}
              >
                <X size={16} />
                Abbrechen
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-ink/70">Fotos werden geladen...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedPhotos.map((photo) => (
            <div
              key={photo.id}
              draggable={isSortingPhotos && !savingPhotoOrder}
              onDragStart={() => setDraggedPhotoId(photo.id)}
              onDragEnd={() => setDraggedPhotoId(null)}
              onDragOver={(event) => {
                if (isSortingPhotos) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                movePhotoInOrder(draggedPhotoId, photo.id);
              }}
              className={`relative ${isSortingPhotos ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedPhotoId === photo.id ? 'opacity-50' : ''}`}
            >
              {isSortingPhotos && (
                <div className="absolute left-2 top-2 z-10 rounded bg-white/90 border border-parchment-dark p-1 text-ink shadow-sm">
                  <GripVertical size={18} />
                </div>
              )}
              {!isSortingPhotos && !isUnassignedAlbum && (
                <button
                  type="button"
                  className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded bg-white/95 px-2 py-1 text-xs font-semibold text-red-700 shadow-sm border border-red-200 hover:bg-red-50 disabled:opacity-60"
                  onClick={() => handleRemovePhotoFromAlbum(photo)}
                  disabled={removingPhotoId === photo.id}
                >
                  <X size={14} />
                  {removingPhotoId === photo.id ? 'Entfernt...' : 'Entfernen'}
                </button>
              )}
              <PhotoCard
                photo={photo}
                to={isSortingPhotos ? undefined : `/photos/${photo.id}`}
                state={isSortingPhotos ? undefined : { fromAlbumId: albumId, fromAlbumTitle: album?.title || '' }}
              />
            </div>
          ))}
          {displayedPhotos.length === 0 && (
            <p className="text-ink/70">Keine Fotos entsprechen dem Filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumDetailPage;
