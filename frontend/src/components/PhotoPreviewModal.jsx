import { useState } from 'react';
import { Link } from 'react-router-dom';

const buildTags = (photo) => {
  if (!Array.isArray(photo?.tags) || photo.tags.length === 0) {
    return 'keine';
  }
  return photo.tags.join(', ');
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const PhotoPreviewModal = ({
  photo,
  onClose,
  onNavigate,
  onRemoveFromAlbum,
  removeLabel = 'Aus Album entfernen',
  isRemoving = false
}) => {
  const [zoomState, setZoomState] = useState({ photoId: null, value: 1 });

  if (!photo) {
    return null;
  }

  const zoom = photo.id === zoomState.photoId ? zoomState.value : 1;

  const updateZoom = (nextValue) => {
    setZoomState({
      photoId: photo.id,
      value: clampZoom(nextValue)
    });
  };

  const previewUrl = photo.preview || photo.original || '';
  const imageUrl = previewUrl;
  const dateTaken = photo.date_taken || 'unbekannt';

  const handleImageClick = () => {
    const nextZoom = zoom >= MAX_ZOOM ? MIN_ZOOM : clampZoom(zoom + 0.75);
    updateZoom(nextZoom);
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-10"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-parchment-dark px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Foto-Vorschau</p>
            <h2 className="text-2xl font-serif">{photo.name || `Foto ${photo.id}`}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink/70 hover:text-ink">
            Schließen
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="bg-parchment rounded-md flex flex-col gap-3 items-center justify-center min-h-[360px] overflow-hidden">
            {imageUrl ? (
              <>
                <div
                  className="relative w-full flex items-center justify-center overflow-hidden rounded-md border border-parchment-dark bg-white cursor-zoom-in"
                  onClick={handleImageClick}
                  role="presentation"
                >
                  <img
                    src={imageUrl}
                    alt={photo.name || `Foto ${photo.id}`}
                    className="max-h-[520px] w-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-ink/60">
                  <button
                    type="button"
                    className="px-2 py-1 border border-parchment-dark rounded"
                    onClick={() => updateZoom(zoom - ZOOM_STEP)}
                    disabled={zoom <= MIN_ZOOM}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => updateZoom(Number(event.target.value))}
                    className="w-40"
                  />
                  <button
                    type="button"
                    className="px-2 py-1 border border-parchment-dark rounded"
                    onClick={() => updateZoom(zoom + ZOOM_STEP)}
                    disabled={zoom >= MAX_ZOOM}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 border border-parchment-dark rounded text-xs"
                    onClick={() => updateZoom(1)}
                    disabled={zoom === 1}
                  >
                    Reset
                  </button>
                  <span className="text-ink/70">Zoom: {(zoom * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-ink/60">Tipp: Bild anklicken, um zu zoomen.</p>
              </>
            ) : (
              <p className="text-ink/60 text-sm">Kein Bild verfügbar.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 text-sm text-ink/80">
            <p><strong>ID:</strong> {photo.id}</p>
            <p><strong>Aufnahmedatum:</strong> {dateTaken}</p>
            <p><strong>Beschreibung:</strong> {photo.description || 'Keine Beschreibung vorhanden.'}</p>
            <p><strong>Tags:</strong> {buildTags(photo)}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className="uppercase tracking-wide text-xs bg-parchment-dark/30 px-2 py-1 rounded">
                {photo.review?.status || 'unbekannt'}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {photo.photopage && (
                <a
                  href={photo.photopage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-parchment-dark rounded-md text-sm text-accent"
                >
                  Auf Flickr öffnen
                </a>
              )}
              {photo.original && (photo.preview ? photo.preview !== photo.original : true) && (
                <a
                  href={photo.original}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-parchment-dark rounded-md text-sm text-ink/80"
                >
                  Original anzeigen
                </a>
              )}
              <Link
                to={`/photos/${photo.id}`}
                className="px-3 py-2 bg-ink text-white rounded-md text-sm"
                onClick={onNavigate || onClose}
              >
                Zum Foto-Detail
              </Link>
              {onRemoveFromAlbum && (
                <button
                  type="button"
                  className="px-3 py-2 border border-red-600 text-red-700 rounded-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => onRemoveFromAlbum(photo)}
                  disabled={isRemoving}
                >
                  {isRemoving ? 'Entfernen…' : removeLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoPreviewModal;
