import React, { useState } from 'react';

const FlickrImageSelector = ({ selectedImages = [], onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Bitte geben Sie einen Suchbegriff ein.');
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/flickr/search?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error('Die Suche bei Flickr war nicht erfolgreich.');
      }
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (searchError) {
      setError(searchError.message || 'Unerwarteter Fehler bei der Flickr-Suche.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSelection = (next) => {
    if (typeof onSelect === 'function') {
      onSelect(next);
    }
  };

  const handleSelect = (url) => {
    if (!url || selectedImages.includes(url)) {
      return;
    }
    updateSelection([...selectedImages, url]);
  };

  const handleRemove = (url) => {
    updateSelection(selectedImages.filter((imageUrl) => imageUrl !== url));
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-xl font-serif font-semibold text-ink">Flickr Image Search</h3>
        <p className="text-sm text-ink/70">Suchen Sie nach Bildern, wählen Sie passende Motive aus und fügen Sie sie dem Dokument hinzu.</p>
      </header>

      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Begriff oder Thema"
          className="flex-1 border border-parchment-dark rounded-sm px-3 py-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-ink text-white rounded-sm shadow-sm disabled:opacity-60"
          disabled={isSearching}
        >
          {isSearching ? 'Suche…' : 'Suchen'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {results.length === 0 && !isSearching ? (
          <p className="col-span-full text-sm text-ink/60">Noch keine Ergebnisse. Starten Sie eine Suche.</p>
        ) : (
          results.map((result) => (
            <article key={result.url} className="border border-parchment-dark rounded-sm overflow-hidden bg-white shadow-sm flex flex-col">
              <img
                src={result.url}
                alt={result.title || 'Flickr Bild'}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{result.title || 'Unbenannt'}</p>
                  <p className="text-xs text-ink/60">{result.author ? `von ${result.author}` : 'Autor unbekannt'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(result.url)}
                  disabled={selectedImages.includes(result.url)}
                  className="mt-auto px-3 py-2 text-sm border rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-accent text-accent hover:bg-accent/10"
                >
                  {selectedImages.includes(result.url) ? 'Bereits ausgewählt' : 'Bild auswählen'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {selectedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-lg font-serif font-semibold text-ink">Ausgewählte Bilder</h4>
          <div className="flex flex-wrap gap-4">
            {selectedImages.map((url) => (
              <figure key={url} className="relative w-32">
                <img src={url} alt="Ausgewähltes Flickr Bild" className="w-32 h-32 object-cover rounded-sm border" />
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded-sm"
                >
                  Entfernen
                </button>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default FlickrImageSelector;
