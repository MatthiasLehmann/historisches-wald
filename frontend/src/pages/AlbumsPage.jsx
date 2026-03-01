import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAlbum, fetchAlbums, uploadAlbumPhoto } from '../services/api.js';

const sortAlbums = (albums, sortKey, order) => {
  const sorted = [...albums].sort((a, b) => {
    if (sortKey === 'last_updated') {
      return (a.last_updated - b.last_updated) || a.title.localeCompare(b.title);
    }
    return a.title.localeCompare(b.title);
  });
  if (order === 'desc') {
    sorted.reverse();
  }
  return sorted;
};

const defaultAlbumForm = {
  title: '',
  description: '',
  cover_photo: ''
};

const defaultPhotoForm = {
  albumId: '',
  name: '',
  description: '',
  date_taken: '',
  file: null,
  setAsCover: true
};

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('title');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [albumForm, setAlbumForm] = useState(defaultAlbumForm);
  const [photoForm, setPhotoForm] = useState(defaultPhotoForm);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadAlbums = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      try {
        const data = await fetchAlbums();
        setAlbums(data);
      } catch (err) {
        setError(err.message || 'Fehler beim Laden der Alben.');
      } finally {
        setLoading(false);
      }
    };

    loadAlbums();
  }, []);

  useEffect(() => {
    if (albums.length > 0 && !photoForm.albumId) {
      setPhotoForm((prev) => ({ ...prev, albumId: prev.albumId || albums[0].id }));
    }
  }, [albums, photoForm.albumId]);

  const handleAlbumFieldChange = (event) => {
    const { name, value } = event.target;
    setAlbumForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAlbum = async (event) => {
    event.preventDefault();
    if (!albumForm.title.trim()) {
      setError('Bitte geben Sie einen Titel für das Album ein.');
      return;
    }
    setCreatingAlbum(true);
    setError('');
    setSuccessMessage('');
    try {
      const newAlbum = await createAlbum({
        title: albumForm.title.trim(),
        description: albumForm.description.trim(),
        cover_photo: albumForm.cover_photo.trim()
      });
      setAlbums((prev) => [newAlbum, ...prev]);
      setAlbumForm(defaultAlbumForm);
      setSuccessMessage('Album erfolgreich erstellt.');
    } catch (err) {
      setError(err.message || 'Album konnte nicht erstellt werden.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handlePhotoFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPhotoForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoForm((prev) => ({ ...prev, file }));
  };

  const handlePhotoUpload = async (event) => {
    event.preventDefault();
    if (!photoForm.albumId) {
      setError('Bitte wählen Sie ein Album aus.');
      return;
    }
    if (!photoForm.file) {
      setError('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }
    setUploadingPhoto(true);
    setError('');
    setSuccessMessage('');
    const targetAlbumId = photoForm.albumId;
    try {
      const response = await uploadAlbumPhoto(targetAlbumId, photoForm);
      if (response?.album) {
        setAlbums((prev) => prev.map((album) => (album.id === response.album.id ? response.album : album)));
      }
      setPhotoForm((prev) => ({
        ...defaultPhotoForm,
        albumId: targetAlbumId
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccessMessage('Foto erfolgreich hinzugefügt.');
    } catch (err) {
      setError(err.message || 'Foto konnte nicht hochgeladen werden.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const filteredAlbums = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = needle
      ? albums.filter((album) => album.title?.toLowerCase().includes(needle))
      : albums;
    return sortAlbums(base, sortKey, order);
  }, [albums, search, sortKey, order]);

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-serif mb-2">Flickr Alben</h1>
        <p className="text-ink/70">
          Durchsuche und bearbeite deine Alben. Klicke auf ein Album, um Details und Fotos zu sehen.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreateAlbum} className="bg-white border border-parchment-dark rounded-lg shadow-sm p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50 mb-2">Neues Album</p>
            <h2 className="text-xl font-serif">Album erstellen</h2>
          </div>
          <label className="text-sm text-ink/80 space-y-1">
            Titel*
            <input
              name="title"
              value={albumForm.title}
              onChange={handleAlbumFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              required
              disabled={creatingAlbum}
            />
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Beschreibung
            <textarea
              name="description"
              rows={3}
              value={albumForm.description}
              onChange={handleAlbumFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              disabled={creatingAlbum}
            />
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Cover Foto URL
            <input
              name="cover_photo"
              type="url"
              value={albumForm.cover_photo}
              onChange={handleAlbumFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              placeholder="https://..."
              disabled={creatingAlbum}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-ink text-white rounded-md disabled:opacity-50"
              disabled={creatingAlbum}
            >
              {creatingAlbum ? 'Speichern...' : 'Album erstellen'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePhotoUpload} className="bg-white border border-parchment-dark rounded-lg shadow-sm p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50 mb-2">Neues Bild</p>
            <h2 className="text-xl font-serif">Foto zu Album hinzufügen</h2>
          </div>
          <label className="text-sm text-ink/80 space-y-1">
            Album
            <select
              name="albumId"
              value={photoForm.albumId}
              onChange={handlePhotoFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2 bg-white"
              disabled={albums.length === 0 || uploadingPhoto}
            >
              {albums.length === 0 && <option value="">Keine Alben vorhanden</option>}
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Titel
            <input
              name="name"
              value={photoForm.name}
              onChange={handlePhotoFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              placeholder="z.B. Dorfplatz"
              disabled={uploadingPhoto}
            />
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Beschreibung
            <textarea
              name="description"
              rows={3}
              value={photoForm.description}
              onChange={handlePhotoFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              disabled={uploadingPhoto}
            />
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Aufnahmedatum
            <input
              type="date"
              name="date_taken"
              value={photoForm.date_taken}
              onChange={handlePhotoFieldChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              disabled={uploadingPhoto}
            />
          </label>
          <label className="text-sm text-ink/80 space-y-1">
            Bilddatei*
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="w-full border border-parchment-dark rounded-md px-3 py-2"
              ref={fileInputRef}
              disabled={uploadingPhoto}
            />
            {photoForm.file && (
              <span className="text-xs text-ink/60">Ausgewählt: {photoForm.file.name}</span>
            )}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              name="setAsCover"
              checked={photoForm.setAsCover}
              onChange={handlePhotoFieldChange}
              disabled={uploadingPhoto}
            />
            Dieses Foto als Cover verwenden
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-parchment-dark text-ink rounded-md disabled:opacity-50"
              disabled={uploadingPhoto || albums.length === 0}
            >
              {uploadingPhoto ? 'Ladet hoch...' : 'Foto hinzufügen'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-parchment-dark rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="album-search">
            Suche
          </label>
          <input
            id="album-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="z.B. Postkarten"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="sort-key">
            Sortierung
          </label>
          <select
            id="sort-key"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value)}
            className="border border-parchment-dark rounded-md px-3 py-2"
          >
            <option value="title">Titel (A-Z)</option>
            <option value="last_updated">Zuletzt aktualisiert</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="sort-order">
            Reihenfolge
          </label>
          <select
            id="sort-order"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="border border-parchment-dark rounded-md px-3 py-2"
          >
            <option value="asc">Aufsteigend</option>
            <option value="desc">Absteigend</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-ink/70">Lade Alben...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {successMessage && <p className="text-emerald-600">{successMessage}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAlbums.map((album) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              className="border border-parchment-dark rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{album.title}</p>
                <span className="text-xs text-ink/60">{album.photo_count} Fotos</span>
              </div>
              <p className="text-xs text-ink/70 line-clamp-3">{album.description || 'Keine Beschreibung.'}</p>
              <p className="text-xs text-ink/60">
                Aktualisiert: {album.last_updated ? new Date(album.last_updated * 1000).toLocaleDateString() : 'unbekannt'}
              </p>
            </Link>
          ))}
          {filteredAlbums.length === 0 && (
            <p className="text-ink/70">Keine Alben gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumsPage;
