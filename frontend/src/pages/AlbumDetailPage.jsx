import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AlbumEditor from '../components/AlbumEditor';
import PhotoCard from '../components/PhotoCard';
import { fetchAlbumById, fetchAlbumPhotos, updateAlbum } from '../services/api.js';

const PAGE_SIZE = 24;

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

      <AlbumEditor album={album} onSubmit={handleAlbumSave} saving={saving} />

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
