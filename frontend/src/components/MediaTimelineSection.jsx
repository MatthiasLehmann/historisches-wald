import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Image as ImageIcon, Layers, Camera, Filter, ArrowRight } from 'lucide-react';
import Timeline from './Timeline';
import { fetchAlbums, fetchPhotos } from '../services/api.js';

const FILTERS = [
  { id: 'all', label: 'Alle' },
  { id: 'albums', label: 'Alben' },
  { id: 'photos', label: 'Fotos' }
];

const MAX_PHOTO_EVENTS = 300;

const formatDate = (value) => {
  if (!value) {
    return 'Unbekannt';
  }
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(value);
};

const parseAlbumDate = (album) => {
  const timestamp = Number(album?.last_updated || album?.created);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return null;
  }
  const date = new Date(timestamp * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parsePhotoDate = (photo) => {
  const tryParse = (value) => {
    if (!value) {
      return null;
    }
    const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };
  return tryParse(photo?.date_taken) || tryParse(photo?.createdAt) || tryParse(photo?.updatedAt);
};

const MediaTimelineSection = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [albumData, photoData] = await Promise.all([fetchAlbums(), fetchPhotos()]);
        if (!ignore) {
          setAlbums(albumData);
          setPhotos(photoData);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Daten konnten nicht geladen werden.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const approvedPhotos = useMemo(
    () => photos.filter((photo) => (photo.review?.status || '').toLowerCase() === 'approved'),
    [photos]
  );

  const approvedAlbumIds = useMemo(() => {
    const ids = new Set();
    approvedPhotos.forEach((photo) => {
      if (Array.isArray(photo.albums)) {
        photo.albums.forEach((albumId) => ids.add(String(albumId)));
      }
    });
    return ids;
  }, [approvedPhotos]);

  const albumEvents = useMemo(
    () =>
      albums
        .filter((album) => approvedAlbumIds.has(String(album.id)))
        .map((album) => {
          const date = parseAlbumDate(album);
          if (!date) {
            return null;
          }
          return {
            id: `album-${album.id}`,
            type: 'albums',
            title: album.title || 'Unbenanntes Album',
            year: date.getFullYear(),
            date,
            category: 'Album',
            payload: album
          };
        })
        .filter(Boolean),
    [albums, approvedAlbumIds]
  );

  const photoEvents = useMemo(() => {
    const events = approvedPhotos
      .map((photo) => {
        const date = parsePhotoDate(photo);
        if (!date) {
          return null;
        }
        return {
          id: `photo-${photo.id}`,
          type: 'photos',
          title: photo.name || `Foto ${photo.id}`,
          year: date.getFullYear(),
          date,
          category: 'Foto',
          payload: photo
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
    if (events.length > MAX_PHOTO_EVENTS) {
      return events.slice(events.length - MAX_PHOTO_EVENTS);
    }
    return events;
  }, [approvedPhotos]);

  const combinedEvents = useMemo(
    () => [...albumEvents, ...photoEvents].sort((a, b) => a.date - b.date),
    [albumEvents, photoEvents]
  );

  const visibleEvents = useMemo(
    () => combinedEvents.filter((event) => filter === 'all' || event.type === filter),
    [combinedEvents, filter]
  );

  useEffect(() => {
    if (visibleEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }
    const exists = visibleEvents.some((event) => event.id === selectedEventId);
    if (!exists) {
      setSelectedEventId(visibleEvents[0].id);
    }
  }, [visibleEvents, selectedEventId]);

  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedEventId) ?? null,
    [visibleEvents, selectedEventId]
  );

  const albumMap = useMemo(
    () => new Map(albums.map((album) => [album.id, album])),
    [albums]
  );

  const handleSelectEvent = (event) => {
    setSelectedEventId(event.id);
  };

  const handleNavigateToAlbum = (albumId) => {
    navigate(`/albums/${albumId}`);
  };

  const handleNavigateToPhoto = (photoId) => {
    navigate(`/photos/${photoId}`);
  };

  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Medien-Zeitleiste</p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink">Freigegebene Alben & Fotos</h2>
        <p className="text-ink/70">
          Zeigt ausschließlich Medien mit Prüfststatus <strong>approved</strong>. Filtern Sie nach Album- oder Fotoereignissen und
          springen Sie direkt zum Detail.
        </p>
      </header>

      <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-ink/70">
          <Filter size={16} />
          Ansicht:
        </div>
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`px-4 py-2 rounded-md border text-sm transition-colors ${
              filter === option.id
                ? 'bg-ink text-white border-ink'
                : 'bg-white border-parchment-dark text-ink/70 hover:text-ink'
            }`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
        <span className="text-sm text-ink/60 ml-auto">
          {visibleEvents.length} Ereignis(se) · {albumEvents.length} Alben · {photoEvents.length} Fotos (nur approved, max. {MAX_PHOTO_EVENTS})
        </span>
      </section>

  {loading ? (
        <div className="text-center text-ink/60 py-16">Zeitleiste wird geladen...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-16">{error}</div>
      ) : visibleEvents.length === 0 ? (
        <div className="text-center text-ink/60 py-16">Keine Ereignisse verfügbar.</div>
      ) : (
        <>
          <section className="bg-white border border-parchment-dark rounded-sm shadow-sm">
            <Timeline
              events={visibleEvents}
              onSelectEvent={handleSelectEvent}
              selectedEventId={selectedEventId}
            />
          </section>

          {selectedEvent && (
            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-accent">{selectedEvent.category}</p>
                  <h2 className="text-3xl font-serif font-bold text-ink">{selectedEvent.title}</h2>
                  <p className="text-ink/60 text-sm">{formatDate(selectedEvent.date)}</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-parchment-dark text-ink text-xs uppercase tracking-wide">
                  {selectedEvent.category === 'Album' ? <Layers size={16} /> : <Camera size={16} />}
                  {selectedEvent.category}
                </span>
              </div>

              {selectedEvent.category === 'Album' ? (
                <AlbumDetails album={selectedEvent.payload} onNavigate={handleNavigateToAlbum} />
              ) : (
                <PhotoDetails
                  photo={selectedEvent.payload}
                  onNavigate={handleNavigateToPhoto}
                  albumMap={albumMap}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

const AlbumDetails = ({ album, onNavigate }) => {
  const createdDate = album?.created ? new Date(Number(album.created) * 1000) : null;
  const updatedDate = album?.last_updated ? new Date(Number(album.last_updated) * 1000) : null;
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <p className="text-ink/70">{album.description || 'Keine Beschreibung verfügbar.'}</p>
        <div className="flex flex-wrap gap-4 text-sm text-ink/70">
          <span className="inline-flex items-center gap-2">
            <ImageIcon size={16} className="text-accent" />
            {album.photo_count} Fotos
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            Erstellt: {createdDate ? formatDate(createdDate) : 'Unbekannt'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            Aktualisiert: {updatedDate ? formatDate(updatedDate) : 'Unbekannt'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(album.id)}
          className="inline-flex items-center gap-2 px-5 py-2 bg-ink text-white rounded-md text-sm"
        >
          Album öffnen
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="bg-parchment/40 border border-parchment-dark rounded-md p-4 flex items-center justify-center">
        {album.cover_photo ? (
          <img
            src={album.cover_photo}
            alt={`${album.title} Cover`}
            className="w-full h-48 object-cover rounded-sm border border-parchment-dark"
          />
        ) : (
          <p className="text-sm text-ink/60 text-center">Kein Cover verfügbar.</p>
        )}
      </div>
    </div>
  );
};

const PhotoDetails = ({ photo, onNavigate, albumMap }) => {
  const relatedAlbums = Array.isArray(photo.albums)
    ? photo.albums.map((albumId) => albumMap.get(String(albumId))).filter(Boolean)
    : [];
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <p className="text-ink/70">{photo.description || 'Keine Beschreibung verfügbar.'}</p>
        <div className="flex flex-wrap gap-4 text-sm text-ink/70">
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            Aufgenommen: {photo.date_taken || 'Unbekannt'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers size={16} className="text-accent" />
            Zugeordnet zu: {relatedAlbums.length ? relatedAlbums.map((album) => album.title).join(', ') : 'keinem Album'}
          </span>
        </div>
        {photo.tags?.length > 0 && (
          <p className="text-sm text-ink/60">
            Tags: <span className="text-ink/80">{photo.tags.join(', ')}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate(photo.id)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-ink text-white rounded-md text-sm"
          >
            Foto öffnen
            <ArrowRight size={16} />
          </button>
          {photo.photopage && (
            <a
              href={photo.photopage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 border border-parchment-dark rounded-md text-sm text-accent"
            >
              Flickr
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
      <div className="bg-parchment/40 border border-parchment-dark rounded-md p-4 flex items-center justify-center">
        {photo.original ? (
          <img
            src={photo.original}
            alt={photo.name || `Foto ${photo.id}`}
            className="w-full h-64 object-contain rounded-sm border border-parchment-dark bg-parchment"
          />
        ) : (
          <p className="text-sm text-ink/60 text-center">Keine Vorschau verfügbar.</p>
        )}
      </div>
    </div>
  );
};

export default MediaTimelineSection;
