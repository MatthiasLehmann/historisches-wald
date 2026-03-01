import { useEffect, useState } from 'react';

const defaultAlbumState = {
  title: '',
  description: '',
  cover_photo: '',
  parent_id: ''
};

const AlbumEditor = ({ album, onSubmit, saving, allAlbums = [] }) => {
  const [formState, setFormState] = useState(defaultAlbumState);

  useEffect(() => {
    if (!album) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState({
      title: album.title ?? '',
      description: album.description ?? '',
      cover_photo: album.cover_photo ?? '',
      parent_id: album.parent_id ?? ''
    });
  }, [album]);

  if (!album) {
    return (
      <div className="bg-white border border-parchment-dark rounded-lg p-6 shadow-sm">
        <p className="text-sm text-ink/70">Albumdaten werden geladen...</p>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(formState);
    }
  };

  const parentOptions = allAlbums
    .filter((entry) => entry.id !== album?.id)
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-parchment-dark rounded-lg shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-2" htmlFor="title">
            Titel
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formState.title}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            required
            disabled={saving}
          />
        </div>
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-2" htmlFor="cover_photo">
            Cover Foto URL
          </label>
          <input
            id="cover_photo"
            name="cover_photo"
            type="url"
            value={formState.cover_photo}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="https://..."
            disabled={saving}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-ink/60 mb-2" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formState.description}
          onChange={handleChange}
          className="w-full border border-parchment-dark rounded-md px-3 py-2"
          disabled={saving}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs uppercase tracking-wide text-ink/60 mb-2" htmlFor="parent_id">
            Übergeordnetes Album
          </label>
          <select
            id="parent_id"
            name="parent_id"
            value={formState.parent_id}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2 bg-white"
            disabled={saving}
          >
            <option value="">(Keines)</option>
            {parentOptions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-ink/80">
        <p>Fotos: <strong>{album.photo_count}</strong></p>
        <p>Erstellt: <strong>{album.created ? new Date(album.created * 1000).toLocaleDateString() : 'unbekannt'}</strong></p>
        <p>Aktualisiert: <strong>{album.last_updated ? new Date(album.last_updated * 1000).toLocaleDateString() : 'unbekannt'}</strong></p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-ink text-white rounded-md disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  );
};

export default AlbumEditor;
