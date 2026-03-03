import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PhotoEditor from '../components/PhotoEditor';
import StatusBadge from '../components/StatusBadge';
import { fetchPhotoAlbums, fetchPhotoById, updatePhoto } from '../services/api.js';

const mapPhotoToForm = (photo) => ({
  name: photo?.name ?? '',
  description: photo?.description ?? '',
  date_taken: photo?.date_taken ?? '',
  source: photo?.source ?? '',
  tags: photo?.tags ?? [],
  tagsInput: (photo?.tags ?? []).join(', '),
  review: {
    status: photo?.review?.status ?? 'pending',
    reviewer: photo?.review?.reviewer ?? '',
    reviewedAt: photo?.review?.reviewedAt ?? null,
    comments: photo?.review?.comments ?? []
  },
  reviewCommentsInput: (photo?.review?.comments ?? []).join('\n')
});

const PhotoDetailPage = () => {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [formState, setFormState] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPhoto = useCallback(async () => {
    if (!photoId) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [photoData, albumData] = await Promise.all([
        fetchPhotoById(photoId),
        fetchPhotoAlbums(photoId)
      ]);
      setPhoto(photoData);
      setFormState(mapPhotoToForm(photoData));
      setAlbums(albumData);
    } catch (err) {
      setError(err.message || 'Foto konnte nicht geladen werden.');
      if (err.message?.includes('not found')) {
        navigate('/albums');
      }
    } finally {
      setLoading(false);
    }
  }, [photoId, navigate]);

  useEffect(() => {
    loadPhoto();
  }, [loadPhoto]);

  const handleSave = async () => {
    if (!photoId || !formState) {
      return;
    }
    if (!formState.name.trim()) {
      setError('Name darf nicht leer sein.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: formState.name,
        description: formState.description,
        date_taken: formState.date_taken,
        source: formState.source,
        tags: formState.tags,
        review: {
          ...formState.review,
          reviewedAt: formState.review.reviewedAt || null,
          comments: formState.review.comments
        }
      };
      const updated = await updatePhoto(photoId, payload);
      setPhoto(updated);
      setFormState(mapPhotoToForm(updated));
      setSuccess('Foto erfolgreich gespeichert.');
    } catch (err) {
      setError(err.message || 'Konnte Foto nicht speichern.');
    } finally {
      setSaving(false);
    }
  };

  const albumsList = useMemo(() => albums ?? [], [albums]);

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <Link to="/albums" className="text-sm text-ink/70 hover:text-ink">
            ← Zurück zu den Alben
          </Link>
          <h1 className="text-3xl font-serif">Foto {photoId}</h1>
          {photo?.missing && <p className="text-red-600 text-sm">Datei fehlt auf dem Datenträger.</p>}
        </div>
        {photo && <StatusBadge status={photo.review?.status} />}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-emerald-600">{success}</p>}

      {photo && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-parchment-dark rounded-lg shadow-sm p-4 flex flex-col gap-4">
            <div className="w-full">
              {photo.original ? (
                <img
                  src={photo.original}
                  alt={photo.name || `Foto ${photo.id}`}
                  className="w-full max-h-[480px] object-contain rounded-md bg-parchment"
                />
              ) : (
                <div className="w-full h-64 bg-parchment flex items-center justify-center text-ink/50">
                  Kein Vorschaubild verfügbar
                </div>
              )}
            </div>
            <div className="text-sm text-ink/80 space-y-2">
              <p><strong>Flickr-Seite:</strong> {photo.photopage ? <a href={photo.photopage} className="text-accent" target="_blank" rel="noreferrer">Öffnen</a> : 'nicht verfügbar'}</p>
              <p><strong>Lizenz:</strong> {photo.license}</p>
              <p><strong>Privatsphäre:</strong> {photo.privacy}</p>
            </div>
            <div>
              <h3 className="font-semibold text-ink mb-2">Kommentare</h3>
              {photo.comments?.length ? (
                <ul className="space-y-2 text-sm text-ink/80">
                  {photo.comments.map((comment, index) => (
                    <li key={comment.id ?? `${comment.user}-${index}`} className="border border-parchment-dark rounded-md p-2">
                      <p className="font-semibold">{comment.user}</p>
                      <p className="text-xs text-ink/60">{comment.date}</p>
                      <p>{comment.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink/60">Keine Kommentare vorhanden.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-ink mb-2">Albumszugehörigkeit</h3>
              {albumsList.length ? (
                <ul className="text-sm text-ink/80 space-y-1">
                  {albumsList.map((album) => (
                    <li key={album.id}>
                      <Link to={`/albums/${album.id}`} className="text-accent">
                        {album.title}
                      </Link>{' '}
                      <span className="text-ink/60">({album.photo_count} Fotos)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink/60">Foto ist keinem Album zugeordnet.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <PhotoEditor value={formState} onChange={setFormState} disabled={saving} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-ink text-white rounded-md disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Speichern...' : 'Foto speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-ink/70">Lade Foto...</p>}
    </div>
  );
};

export default PhotoDetailPage;
