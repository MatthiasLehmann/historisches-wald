import { createElement, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Album,
  Archive,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Home,
  Image,
  Images,
  Landmark,
  MapPin,
  Search,
  ScrollText,
  Sparkles,
  X
} from 'lucide-react';
import {
  fetchAlbumPhotos,
  fetchAlbums,
  fetchDocument,
  fetchDocuments,
  fetchHome,
  fetchPhoto
} from './services/api.js';
import {
  formatYear,
  getImageOriginal,
  getImageSrc,
  isHtmlContent,
  normalizeContent,
  sanitizeHtml,
  toPlainText
} from './utils/content.js';

const navItems = [
  { to: '/', label: 'Start', icon: Home },
  { to: '/discover', label: 'Entdecken', icon: Sparkles },
  { to: '/search', label: 'Suche', icon: Search },
  { to: '/albums', label: 'Alben', icon: Album }
];

const placeLabels = {
  Glashuette: 'Glashütte'
};

const placeDescriptions = {
  Wald: 'Kloster, Ortskern und zentrale Quellen der Gemeinde.',
  Glashuette: 'Glashütte, Gewerbe und Siedlungsgeschichte.',
  Hippetsweiler: 'Höfe, Wege und historische Quellen zum Teilort.',
  Kappel: 'Dorfgeschichte, Gebäude und lokale Erinnerungen.',
  Reischach: 'Ortsgeschichte, Familien und historische Bilder.',
  Riedetsweiler: 'Kapelle, Höfe und ländliche Entwicklung.',
  Rothenlachen: 'Dorfstruktur, Alltag und alte Ansichten.',
  Ruhestetten: 'Frühe Siedlung, Dorfleben und Quellen.',
  Sentenhart: 'Badische Geschichte und lokale Dokumente.',
  Walbertsweiler: 'Ältester Teilort und historische Überlieferung.'
};

const placeDisplayName = (place) => placeLabels[place] || place;

const LoadingState = ({ label = 'Inhalte werden geladen...' }) => (
  <div className="state state--loading">{label}</div>
);

const ErrorState = ({ message = 'Inhalte konnten nicht geladen werden.' }) => (
  <div className="state state--error">{message}</div>
);

const EmptyState = ({ message = 'Keine Inhalte gefunden.' }) => (
  <div className="state">{message}</div>
);

const MetaPill = ({ children }) => <span className="meta-pill">{children}</span>;

const QuickAction = ({ href, children, external = false }) => (
  <a className="quick-action" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
    {children}
  </a>
);

const DocumentCard = ({ document }) => {
  const imageSrc = getImageSrc(document.coverImage);
  return (
    <Link className="document-card" to={`/documents/${document.id}`}>
      <div className="document-card__image">
        {imageSrc ? (
          <img src={imageSrc} alt={document.title} loading="lazy" />
        ) : (
          <FileText size={28} />
        )}
        <span>{formatYear(document.year)}</span>
      </div>
      <div className="document-card__body">
        <p className="eyebrow">{document.location || document.category || 'Archiv'}</p>
        <h3>{document.title}</h3>
        <p>{document.excerpt || toPlainText(document.description) || 'Keine Kurzfassung vorhanden.'}</p>
      </div>
    </Link>
  );
};

const AlbumCard = ({ album }) => (
  <Link className="album-card" to={`/albums/${album.id}`}>
    <div className="album-card__image">
      {album.coverPhoto ? (
        <img src={album.coverPhoto} alt={album.title} loading="lazy" />
      ) : (
        <Images size={30} />
      )}
    </div>
    <div>
      <h3>{album.title}</h3>
      <p>{album.description || `${album.publicPhotoCount} Fotos`}</p>
      <span>{album.publicPhotoCount} Fotos</span>
    </div>
  </Link>
);

const PhotoCard = ({ photo, to }) => (
  <Link className="photo-card" to={to || `/photos/${photo.id}`}>
    <img src={photo.preview || photo.original} alt={photo.title} loading="lazy" />
    <div>
      <h3>{photo.title}</h3>
      <p>{photo.dateTaken || photo.license || 'Historisches Foto'}</p>
    </div>
  </Link>
);

const Gallery = ({ images = [], initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const image = images[index];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowLeft') {
        setIndex((current) => (current - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        setIndex((current) => (current + 1) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  if (!image) {
    return null;
  }

  return (
    <div className="gallery-overlay" role="dialog" aria-modal="true">
      <button className="icon-button gallery-overlay__close" type="button" onClick={onClose} aria-label="Galerie schließen">
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="icon-button gallery-overlay__prev"
            type="button"
            onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            className="icon-button gallery-overlay__next"
            type="button"
            onClick={() => setIndex((current) => (current + 1) % images.length)}
            aria-label="Nächstes Bild"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}
      <figure>
        <img src={getImageOriginal(image)} alt={image.title || 'Historisches Bild'} />
        <figcaption>
          <strong>{image.title || 'Ohne Titel'}</strong>
          {image.description && <span>{image.description}</span>}
          <small>
            {image.source && `Quelle: ${image.source}`}
            {image.license && `${image.source ? ' · ' : ''}Lizenz: ${image.license}`}
            {images.length > 1 && ` · Bild ${index + 1} von ${images.length}`}
          </small>
        </figcaption>
      </figure>
    </div>
  );
};

const AppShell = () => (
  <div className="app-shell">
    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/wald" element={<WaldExperiencePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/documents/:id" element={<DocumentPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:id" element={<AlbumDetailPage />} />
        <Route path="/photos/:id" element={<PhotoDetailPage />} />
      </Routes>
    </main>
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'}>
          {createElement(item.icon, { size: 21 })}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

const HomePage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHome()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!data) {
    return <LoadingState />;
  }

  const hero = data.featuredDocuments?.[0];
  const heroImage = getImageSrc(hero?.coverImage) || '/files/images/logo-historisches-wald.png';

  return (
    <div className="page page--home">
      <section className="hero">
        <img src={heroImage} alt="" />
        <div className="hero__shade" />
        <div className="hero__content">
          <p>Historisches Wald</p>
          <h1>Geschichte entdecken, Bilder betrachten, Quellen öffnen.</h1>
          <Link to="/search" className="primary-action">
            <Search size={18} />
            Archiv durchsuchen
          </Link>
        </div>
      </section>

      <section className="stats-row" aria-label="Archivumfang">
        <div><strong>{data.stats.documents}</strong><span>Dokumente</span></div>
        <div><strong>{data.stats.albums}</strong><span>Alben</span></div>
        <div><strong>{data.stats.photos}</strong><span>Fotos</span></div>
      </section>

      <SectionHeader title="Entdecken" action={{ to: '/discover', label: 'Alle Themen' }} />
      <div className="topic-grid">
        {data.topics.slice(0, 4).map((topic) => (
          <Link className="topic-tile" key={topic.id} to={`/search?category=${encodeURIComponent(topic.title)}`}>
            <Landmark size={21} />
            <strong>{topic.title}</strong>
            <span>{topic.description}</span>
          </Link>
        ))}
      </div>

      <SectionHeader title="Neue Fundstücke" action={{ to: '/search', label: 'Mehr' }} />
      <div className="card-scroll">
        {data.recentDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>

      <SectionHeader title="Alben" action={{ to: '/albums', label: 'Alle Alben' }} />
      <div className="stack">
        {data.featuredAlbums.slice(0, 3).map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, action }) => (
  <div className="section-header">
    <h2>{title}</h2>
    {action && <Link to={action.to}>{action.label}</Link>}
  </div>
);

const DiscoverPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHome()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!data) {
    return <LoadingState />;
  }

  return (
    <div className="page">
      <PageTitle eyebrow="Entdecken" title="Stöbern nach Themen und Ortsteilen" />
      <Link className="wald-experience-card" to="/wald">
        <div>
          <span>Wald erleben</span>
          <strong>Street View und Luftaufnahmen</strong>
          <p>Heute durch Wald blicken und historische Ansichten aus dem Archiv vergleichen.</p>
        </div>
        <MapPin size={28} />
      </Link>

      <div className="topic-grid topic-grid--wide">
        {data.topics.map((topic) => (
          <Link className="topic-tile" key={topic.id} to={`/search?q=${encodeURIComponent(topic.title)}`}>
            <Sparkles size={21} />
            <strong>{topic.title}</strong>
            <span>{topic.description}</span>
          </Link>
        ))}
      </div>

      <SectionHeader title="Ortsteile" />
      <PlaceExplorer places={data.places} />
    </div>
  );
};

const PlaceExplorer = ({ places = [] }) => {
  const [selectedPlace, setSelectedPlace] = useState(places[0] || '');
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedPlace) {
      return;
    }
    fetchDocuments({ location: selectedPlace, pageSize: 8 })
      .then((payload) => {
        setError(null);
        setDocuments({ place: selectedPlace, ...payload });
      })
      .catch((err) => setError({ place: selectedPlace, message: err.message }));
  }, [selectedPlace]);

  if (places.length === 0) {
    return <EmptyState message="Keine Ortsteile gefunden." />;
  }

  const selectedLabel = placeDisplayName(selectedPlace);
  const currentDocuments = documents?.place === selectedPlace ? documents : null;
  const currentError = error?.place === selectedPlace ? error.message : '';
  const previewDocuments = currentDocuments?.items || [];
  const coverImages = previewDocuments
    .map((document) => getImageSrc(document.coverImage))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section className="place-explorer" aria-label="Ortsteil Explorer">
      <div className="place-explorer__map">
        <div className="place-explorer__map-header">
          <span>Ortsteil Explorer</span>
          <strong>{selectedLabel}</strong>
          <p>{placeDescriptions[selectedPlace] || 'Dokumente und Bilder nach Ortsteil entdecken.'}</p>
        </div>
        <div className="place-explorer__image-strip" aria-hidden="true">
          {coverImages.length > 0 ? (
            coverImages.map((src) => <img key={src} src={src} alt="" loading="lazy" />)
          ) : (
            <div>
              <MapPin size={34} />
            </div>
          )}
        </div>
      </div>

      <div className="place-explorer__chips" role="list" aria-label="Ortsteil auswählen">
        {places.map((place) => {
          const isSelected = place === selectedPlace;
          return (
            <button
              key={place}
              type="button"
              className={isSelected ? 'is-selected' : ''}
              onClick={() => setSelectedPlace(place)}
              aria-pressed={isSelected}
            >
              <MapPin size={15} />
              {placeDisplayName(place)}
            </button>
          );
        })}
      </div>

      <div className="place-explorer__results">
        <div className="place-explorer__result-head">
          <div>
            <span>{selectedLabel}</span>
            <strong>{currentDocuments?.pagination?.total ?? 0} Fundstücke</strong>
          </div>
          <Link to={`/search?location=${encodeURIComponent(selectedPlace)}`}>Alle anzeigen</Link>
        </div>

        {currentError && <ErrorState message={currentError} />}
        {!currentDocuments && !currentError && <LoadingState label="Ortsteil wird geladen..." />}
        {currentDocuments && previewDocuments.length === 0 && (
          <EmptyState message="Für diesen Ortsteil wurden noch keine öffentlichen Dokumente gefunden." />
        )}
        {previewDocuments.length > 0 && (
          <div className="stack">
            {previewDocuments.slice(0, 3).map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const WaldExperiencePage = () => {
  const [streetViewLoaded, setStreetViewLoaded] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState('');
  const streetViewUrl = 'https://www.google.com/maps?q=Wald%20(Hohenzollern)&layer=c&cbll=47.9335,9.1717&cbp=11,0,0,0,0&output=svembed';

  useEffect(() => {
    Promise.all([
      fetchDocuments({ location: 'Wald', q: 'Luft', pageSize: 12 }),
      fetchDocuments({ location: 'Wald', category: 'Luftbilder', pageSize: 12 })
    ])
      .then(([byText, byCategory]) => {
        const byId = new Map();
        [...(byText.items || []), ...(byCategory.items || [])].forEach((document) => {
          byId.set(document.id, document);
        });
        setError('');
        setDocuments({
          items: Array.from(byId.values()),
          total: Math.max(byText.pagination?.total || 0, byCategory.pagination?.total || 0)
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const aerialDocuments = documents?.items || [];

  return (
    <div className="page wald-page">
      <BackLink />
      <PageTitle eyebrow="Wald erleben" title="Street View und Luftaufnahmen" />

      <section className="street-view-panel">
        {streetViewLoaded ? (
          <iframe
            title="Street View Wald"
            src={streetViewUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="street-view-panel__placeholder">
            <MapPin size={34} />
            <strong>Street View Wald laden</strong>
            <p>Die aktuelle Straßenansicht wird erst nach deiner Auswahl von Google Maps geladen.</p>
            <button className="primary-action" type="button" onClick={() => setStreetViewLoaded(true)}>
              <ExternalLink size={18} />
              Street View anzeigen
            </button>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Luftaufnahmen von Wald" action={{ to: '/search?q=Luft&location=Wald', label: 'Alle suchen' }} />
        {error && <ErrorState message={error} />}
        {!documents && !error && <LoadingState label="Luftaufnahmen werden geladen..." />}
        {documents && aerialDocuments.length === 0 && (
          <EmptyState message="Keine öffentlichen Luftaufnahmen zu Wald gefunden." />
        )}
        {aerialDocuments.length > 0 && (
          <div className="aerial-grid">
            {aerialDocuments.map((document) => (
              <Link className="aerial-card" key={document.id} to={`/documents/${document.id}`}>
                <div>
                  {getImageSrc(document.coverImage) ? (
                    <img src={getImageSrc(document.coverImage)} alt={document.title} loading="lazy" />
                  ) : (
                    <Image size={30} />
                  )}
                </div>
                <span>{formatYear(document.year)}</span>
                <strong>{document.title}</strong>
                <p>{document.excerpt || 'Luftaufnahme aus dem Archiv.'}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = {
      q: searchParams.get('q') || '',
      location: searchParams.get('location') || '',
      category: searchParams.get('category') || ''
    };
    fetchDocuments({ ...params, pageSize: 30 })
      .then((payload) => {
        setError('');
        setData(payload);
      })
      .catch((err) => setError(err.message));
  }, [searchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    const next = {};
    if (query.trim()) next.q = query.trim();
    setSearchParams(next);
  };

  return (
    <div className="page">
      <PageTitle eyebrow="Suche" title="Archiv gezielt durchsuchen" />
      <form className="search-panel" onSubmit={submitSearch}>
        <label>
          <span>Suchbegriff</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Person, Ort..." />
        </label>
        <button className="primary-action" type="submit">
          <Search size={18} />
          Suchen
        </button>
      </form>

      {error && <ErrorState message={error} />}
      {!data && !error && <LoadingState label="Suche wird geladen..." />}
      {data && (
        <>
          <p className="result-count">{data.pagination.total} Treffer</p>
          {data.items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="stack">
              {data.items.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const DocumentPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocument(id)
      .then((payload) => {
        setError('');
        setDocument(payload);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!document || document.id !== id) {
    return <LoadingState label="Dokument wird geladen..." />;
  }

  const cover = getImageSrc(document.coverImage);
  const hasDescription = Boolean(toPlainText(document.description));
  const hasTranscription = Boolean(toPlainText(document.transcription));
  const images = Array.isArray(document.images) ? document.images : [];
  const pdfs = Array.isArray(document.pdfs) ? document.pdfs : [];
  const hasGallery = images.length > 0;
  const singlePdf = pdfs.length === 1 ? pdfs[0] : null;
  const hasQuickActions = hasDescription || hasTranscription || hasGallery || pdfs.length > 0;

  return (
    <article className="page detail-page">
      <BackLink />
      <header id="document-header" className="detail-hero">
        {cover && <img src={cover} alt={document.title} />}
        <div>
          <p className="eyebrow">{document.category || 'Dokument'}</p>
          <h1>{document.title}</h1>
          <div className="meta-row">
            <MetaPill>{formatYear(document.year)}</MetaPill>
            {document.location && <MetaPill>{document.location}</MetaPill>}
            {document.pdfCount > 0 && <MetaPill>{document.pdfCount} PDF</MetaPill>}
          </div>
          {hasQuickActions && (
            <nav className="quick-actions" aria-label="Beitragsbereiche">
              {(hasDescription || hasTranscription) && (
                <QuickAction href="#inhalt">
                  <ScrollText size={16} />
                  Inhalt
                </QuickAction>
              )}
              {hasGallery && (
                <QuickAction href="#galerie">
                  <Images size={16} />
                  Bilder
                </QuickAction>
              )}
              {singlePdf ? (
                <QuickAction href={singlePdf.url} external>
                  <ExternalLink size={16} />
                  PDF öffnen
                </QuickAction>
              ) : pdfs.length > 1 ? (
                <QuickAction href="#pdfs">
                  <FileText size={16} />
                  PDFs
                </QuickAction>
              ) : null}
            </nav>
          )}
        </div>
      </header>

      {hasDescription && <RichTextBlock id="inhalt" content={document.description} />}
      {!hasDescription && hasTranscription && <RichTextBlock id="inhalt" content={document.transcription} />}
      {hasDescription && hasTranscription && <RichTextBlock content={document.transcription} />}

      {hasGallery && (
        <section id="galerie" className="section-anchor">
          <SectionHeader title="Bilder" />
          <div className="gallery-grid">
            {images.map((image, index) => (
              <button key={image.id || image.src} type="button" onClick={() => setGalleryIndex(index)}>
                <img src={getImageSrc(image)} alt={image.title || document.title} loading="lazy" />
                <span>{image.title || 'Bild ansehen'}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {pdfs.length > 0 && (
        <section id="pdfs" className="section-anchor">
          <SectionHeader title="PDF-Quellen" />
          <div className="stack">
            {pdfs.map((pdf) => (
              <a className="pdf-link" key={pdf.id} href={pdf.url} target="_blank" rel="noreferrer">
                <FileText size={22} />
                <span>
                  <strong>{pdf.title}</strong>
                  <small>{pdf.source || pdf.description || 'PDF öffnen'}</small>
                </span>
                <ExternalLink size={18} />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="source-box">
        <h2>Quelle</h2>
        <p>{document.metadata.source || 'Unbekannt'}</p>
        {document.metadata.author && <p>Autor: {document.metadata.author}</p>}
      </section>

      {document.related.length > 0 && (
        <section>
          <SectionHeader title="Verwandte Inhalte" />
          <div className="stack">
            {document.related.map((item) => (
              <DocumentCard key={item.id} document={item} />
            ))}
          </div>
        </section>
      )}

      {galleryIndex !== null && (
        <Gallery images={images} initialIndex={galleryIndex} onClose={() => setGalleryIndex(null)} />
      )}

      <a className="floating-top-link" href="#document-header" aria-label="Zurück zum Dokumentkopf">
        <ArrowUp size={18} />
        <span>Nach oben</span>
      </a>
    </article>
  );
};

const AlbumsPage = () => {
  const [albums, setAlbums] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlbums({ pageSize: 60 })
      .then(setAlbums)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!albums) {
    return <LoadingState label="Alben werden geladen..." />;
  }

  return (
    <div className="page">
      <PageTitle eyebrow="Alben" title="Fotosammlungen durchsuchen" />
      {albums.items.length === 0 ? (
        <EmptyState message="Keine öffentlichen Alben gefunden." />
      ) : (
        <div className="stack">
          {albums.items.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
};

const AlbumDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlbumPhotos(id, { pageSize: 60 })
      .then((payload) => {
        setError('');
        setData(payload);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!data || data.album.id !== id) {
    return <LoadingState label="Album wird geladen..." />;
  }

  return (
    <div className="page">
      <BackLink />
      <PageTitle eyebrow={`${data.album.publicPhotoCount} Fotos`} title={data.album.title} />
      {data.album.description && <p className="lead">{data.album.description}</p>}
      <div className="photo-grid">
        {data.items.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  );
};

const PhotoDetailPage = () => {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPhoto(id)
      .then((payload) => {
        setError('');
        setPhoto(payload);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const galleryImages = useMemo(() => photo ? [{
    id: photo.id,
    src: photo.preview,
    original: photo.original,
    title: photo.title,
    description: photo.description,
    source: photo.source,
    license: photo.license
  }] : [], [photo]);

  if (error) {
    return <ErrorState message={error} />;
  }
  if (!photo || photo.id !== id) {
    return <LoadingState label="Foto wird geladen..." />;
  }

  return (
    <div className="page detail-page">
      <BackLink />
      <button className="photo-detail-image" type="button" onClick={() => setShowGallery(true)}>
        <img src={photo.original || photo.preview} alt={photo.title} />
      </button>
      <PageTitle eyebrow={photo.dateTaken || 'Historisches Foto'} title={photo.title} />
      {photo.description && <p className="lead">{photo.description}</p>}
      <section className="source-box">
        <h2>Quelle</h2>
        <p>{photo.source || 'Unbekannt'}</p>
        <p>{photo.license || 'Rechtehinweis nicht angegeben'}</p>
      </section>
      {showGallery && <Gallery images={galleryImages} onClose={() => setShowGallery(false)} />}
    </div>
  );
};

const RichTextBlock = ({ id, content }) => {
  const html = useMemo(() => sanitizeHtml(content), [content]);
  const plainText = useMemo(() => normalizeContent(content).trim(), [content]);

  if (!toPlainText(content)) {
    return null;
  }

  if (isHtmlContent(content)) {
    return (
      <section
        id={id}
        className="text-block rich-text section-anchor"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <section id={id} className="text-block rich-text section-anchor">
      {plainText.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
};

const TextBlock = ({ title, text }) => (
  <section className="text-block">
    {title && <h2>{title}</h2>}
    <p>{text}</p>
  </section>
);

const PageTitle = ({ eyebrow, title }) => (
  <header className="page-title">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>
  </header>
);

const BackLink = () => (
  <BackButton />
);

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button className="back-link" type="button" onClick={() => navigate(-1)}>
      <ArrowLeft size={18} />
      Zurück
    </button>
  );
};

export default AppShell;
