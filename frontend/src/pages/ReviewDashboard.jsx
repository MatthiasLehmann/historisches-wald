import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReviewPanel from '../components/ReviewPanel.jsx';

const STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

const STATUS_STYLES = {
  pending: 'bg-gray-200 text-gray-800',
  in_review: 'bg-yellow-200 text-yellow-900',
  approved: 'bg-green-200 text-green-900',
  rejected: 'bg-red-200 text-red-900'
};

const ReviewDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const selectedDocumentIdRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const sortedDocuments = useMemo(() => {
    const priority = { pending: 0, in_review: 1, rejected: 2, approved: 3 };
    return [...documents].sort((a, b) => {
      const aStatus = priority[a.review?.status] ?? 4;
      const bStatus = priority[b.review?.status] ?? 4;
      if (aStatus !== bStatus) return aStatus - bStatus;
      return (b.title || '').localeCompare(b.title || '');
    });
  }, [documents]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Dokumentenliste konnte nicht geladen werden.');
      }
      const data = await response.json();
      setDocuments(data);
      const currentId = selectedDocumentIdRef.current;
      if (currentId) {
        const refreshed = data.find((doc) => doc.id === currentId);
        if (refreshed) {
          setSelectedDocument(refreshed);
        } else {
          setSelectedDocument(null);
          selectedDocumentIdRef.current = null;
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc);
    selectedDocumentIdRef.current = doc.id;
  };

  const handleReviewChange = useCallback((docId, review) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, review } : doc)));
    setSelectedDocument((prev) => (prev && prev.id === docId ? { ...prev, review } : prev));
  }, []);

  const documentImages = useMemo(() => {
    if (!selectedDocument || !Array.isArray(selectedDocument.images)) {
      return [];
    }
    return selectedDocument.images
      .map((image, index) => {
        if (!image) {
          return null;
        }
        if (typeof image === 'string') {
          return {
            id: `${selectedDocument.id}-img-${index}`,
            src: image,
            title: `${selectedDocument.title} – Bild ${index + 1}`,
            description: ''
          };
        }
        const src = image.src || image.previewUrl || image.url || image.file?.path || image.file?.originalUrl || '';
        if (!src) {
          return null;
        }
        return {
          id: image.id || `${selectedDocument.id}-img-${index}`,
          src,
          title: image.title || image.name || `${selectedDocument.title} – Bild ${index + 1}`,
          description: image.description || image.caption || ''
        };
      })
      .filter((image) => Boolean(image?.src));
  }, [selectedDocument]);

  const documentPdfs = useMemo(() => {
    if (!selectedDocument || !Array.isArray(selectedDocument.pdfs)) {
      return [];
    }
    return selectedDocument.pdfs
      .map((pdf) => {
        const pdfUrl = pdf?.file?.path || pdf?.file?.originalUrl || pdf?.url || pdf?.link || '';
        return {
          ...pdf,
          url: pdfUrl
        };
      })
      .filter((pdf) => Boolean(pdf.url));
  }, [selectedDocument]);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Review</p>
        <h1 className="text-4xl font-serif font-bold text-ink">Review Center</h1>
        <p className="text-ink/70">Wähle ein Dokument, prüfe die Inhalte und bestätige das Ergebnis mit Git-Commit.</p>
      </header>

      {message && (
        <p className={`mb-4 text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-1/3 bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-ink">Dokumente</h2>
              <p className="text-xs text-ink/60">Status & Auswahl</p>
            </div>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={loadDocuments}
              disabled={loading}
            >
              Aktualisieren
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-ink/60">Lade…</p>
          ) : sortedDocuments.length === 0 ? (
            <p className="text-sm text-ink/50">Keine Dokumente gefunden.</p>
          ) : (
            <ul className="space-y-2">
              {sortedDocuments.map((doc) => {
                const status = doc.review?.status ?? 'pending';
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDocument(doc)}
                      className={`w-full text-left border rounded-sm px-3 py-2 transition-colors ${
                        selectedDocument?.id === doc.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-parchment-dark/60 hover:border-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{doc.title}</p>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </div>
                      <p className="text-xs text-ink/60">{doc.year} · {doc.category}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="w-full lg:w-2/3 space-y-6">
          {!selectedDocument ? (
            <div className="border border-dashed border-parchment-dark rounded-sm p-8 text-center text-ink/60">
              Bitte ein Dokument auswählen, um das Review zu starten.
            </div>
          ) : (
            <div className="space-y-6">
              <article className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 space-y-4">
                <header>
                  <p className="text-xs uppercase tracking-[0.3em] text-accent">Dokument</p>
                  <h2 className="text-2xl font-serif font-bold text-ink">{selectedDocument.title}</h2>
                  <p className="text-sm text-ink/70">{selectedDocument.year} · {selectedDocument.location}</p>
                </header>
                <p className="text-sm text-ink/80 whitespace-pre-line">{selectedDocument.description}</p>

                {documentImages.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink">Verknüpfte Bilder</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {documentImages.map((image, index) => (
                        <article
                          key={image.id || `${image.src}-${index}`}
                          className="border border-parchment-dark rounded-sm overflow-hidden bg-white flex flex-col"
                        >
                          <a
                            href={image.src}
                            target="_blank"
                            rel="noreferrer"
                            className="block bg-parchment"
                          >
                            <img
                              src={image.src}
                              alt={image.title || `${selectedDocument.title} – Bild ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                          </a>
                          <div className="px-3 py-2 border-t border-parchment-dark/60 space-y-1">
                            <p className="text-sm font-semibold text-ink">
                              {image.title || `${selectedDocument.title} – Bild ${index + 1}`}
                            </p>
                            {image.description && (
                              <p className="text-xs text-ink/60 leading-snug">{image.description}</p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {documentPdfs.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink">Verknüpfte PDFs</h3>
                    <div className="space-y-3">
                      {documentPdfs.map((pdf) => (
                        <article key={pdf.id} className="border border-parchment-dark rounded-sm p-3 bg-white text-sm">
                          <p className="font-semibold text-ink">{pdf.title}</p>
                          <p className="text-ink/60 text-xs">{pdf.year || 'Unbekannt'} · {pdf.location || 'Ohne Ort'}</p>
                          <div className="flex items-center gap-4 text-xs mt-2">
                            <a href={pdf.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                              Anzeigen
                            </a>
                            <a href={pdf.url} download className="text-ink/70 hover:underline">
                              Download
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {selectedDocument.transcription && (
                  <details className="text-sm text-ink/70">
                    <summary className="cursor-pointer text-ink font-semibold">Transkription anzeigen</summary>
                    <div className="mt-2 whitespace-pre-line border border-parchment-dark/40 rounded-sm p-3 bg-parchment/30">
                      {Array.isArray(selectedDocument.transcription)
                        ? selectedDocument.transcription.join('\n')
                        : selectedDocument.transcription}
                    </div>
                  </details>
                )}
                <dl className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-ink/60">Kategorie</dt>
                    <dd className="font-medium text-ink">{selectedDocument.category}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/60">Autor</dt>
                    <dd className="font-medium text-ink">{selectedDocument.metadata?.author || 'Unbekannt'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/60">Quelle</dt>
                    <dd className="font-medium text-ink">{selectedDocument.metadata?.source || 'Unbekannt'}</dd>
                  </div>
                </dl>
              </article>

              <ReviewPanel
                documentId={selectedDocument.id}
                document={selectedDocument}
                onReviewChange={handleReviewChange}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReviewDashboard;
