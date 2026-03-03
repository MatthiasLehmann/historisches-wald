import { memo } from 'react';
import { ImageOff } from 'lucide-react';
import StatusBadge from './StatusBadge';

const PhotoCard = memo(({ photo, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(photo);
    }
  };

  const thumbnailUrl = photo?.preview || photo?.original || '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left bg-white border border-parchment-dark rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col"
    >
      <div className="relative w-full h-48 bg-parchment-dark/20 overflow-hidden rounded-t-lg">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={photo?.name || `Foto ${photo?.id}`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/50">
            <ImageOff size={48} />
          </div>
        )}
        {photo?.missing && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            Datei fehlt
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ink line-clamp-2">
            {photo?.name || 'Unbenanntes Foto'}
          </p>
          <StatusBadge status={photo?.review?.status} />
        </div>
        <p className="text-xs text-ink/70">Aufgenommen: {photo?.date_taken || 'unbekannt'}</p>
        <p className="text-xs text-ink/70">Tags: {(photo?.tags || []).join(', ') || 'keine'}</p>
      </div>
    </button>
  );
});

export default PhotoCard;
