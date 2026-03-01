import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AlbumEditor from '../components/AlbumEditor';
import PhotoCard from '../components/PhotoCard';
import { fetchAlbumById, fetchAlbumPhotos, updateAlbum, uploadAlbumPhoto } from '../services/api.js';

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
  const [photoSearch, setPhotoSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadForm, setUploadForm] = useState(defaultUploadForm);
  const uploadInputRef = useRef(null);

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

  const handleAlbumSave = async (payload) => {
    if (!albumId) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateAlbum(albumId, payload);
      setAlbum(updated);
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

  const handleSelectPhoto = (photo) => {
    navigate(`/photos/${photo.id}`);
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
        <p className="text-sm text-ink/60">{photos.length} Fotos geladen</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {uploadError && <p className="text-red-600">{uploadError}</p>}
      {uploadSuccess && <p className="text-emerald-600">{uploadSuccess}</p>}

      <AlbumEditor album={album} onSubmit={handleAlbumSave} saving={saving} />

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
          />
        </div>
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
      </div>

      {loading ? (
        <p className="text-ink/70">Fotos werden geladen...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedPhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onSelect={handleSelectPhoto} />
          ))}
          {paginatedPhotos.length === 0 && (
            <p className="text-ink/70">Keine Fotos entsprechen dem Filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumDetailPage;
