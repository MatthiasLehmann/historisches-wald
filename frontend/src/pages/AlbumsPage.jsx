import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAlbums } from '../services/api.js';

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

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('title');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAlbums = async () => {
      setLoading(true);
      setError('');
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
