import React, { useEffect, useMemo, useState } from 'react';
import { fetchPdfs } from '../services/api.js';

const statusOptions = [
  { value: '', label: 'Alle Stati' },
  { value: 'pending', label: 'Ausstehend' },
  { value: 'in_review', label: 'In Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' }
];

const PdfSelectorModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedIds = [],
  selectedPdfs = [],
  pdfLibrary,
  pdfLibraryLoading = false,
  pdfLibraryError = null,
  onRefreshLibrary
}) => {
  const [pdfs, setPdfs] = useState([]);
  const [filters, setFilters] = useState({ q: '', year: '', status: '', tag: '' });
  const [selectionMap, setSelectionMap] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedCount = selectionMap.size;
  const selectedIdsKey = useMemo(() => (Array.isArray(selectedIds) ? selectedIds.join(',') : ''), [selectedIds]);
  const hasExternalLibrary = Array.isArray(pdfLibrary);
  const dataSource = hasExternalLibrary ? pdfLibrary : pdfs;
  const combinedLoading = hasExternalLibrary ? pdfLibraryLoading : loading;
  const combinedError = hasExternalLibrary ? pdfLibraryError : error;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initial = new Map();
    selectedPdfs.forEach((pdf) => {
      if (pdf?.id) {
        initial.set(pdf.id, pdf);
      }
    });
    setSelectionMap(initial);
  }, [isOpen, selectedPdfs]);

  const previewUrl = useMemo(() => {
    return (pdf) => {
      if (pdf.file?.type === 'remote') {
        return pdf.file?.originalUrl || pdf.file?.path || '';
      }
      return pdf.file?.path || pdf.file?.originalUrl || '';
    };
  }, []);

  const loadPdfs = async () => {
    if (!isOpen || hasExternalLibrary) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPdfs({
        sort: 'updatedAt',
        order: 'desc'
      });
      setPdfs(data);
      if (selectedIds.length > 0) {
        setSelectionMap((prev) => {
          const next = new Map(prev);
          const desired = new Set(selectedIds);
          data.forEach((pdf) => {
            if (desired.has(pdf.id) && !next.has(pdf.id)) {
              next.set(pdf.id, pdf);
            }
          });
          return next;
        });
      }
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || hasExternalLibrary) {
      return;
    }
    loadPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasExternalLibrary, selectedIdsKey]);

  const filteredPdfs = useMemo(() => {
    const base = Array.isArray(dataSource) ? dataSource : [];
    const query = filters.q.trim().toLowerCase();
    const yearFilter = filters.year.trim();
    const statusFilter = filters.status.trim();
    const tagFilter = filters.tag.trim().toLowerCase();

    const matches = base.filter((pdf) => {
      if (query) {
        const haystack = [
          pdf.title,
          pdf.description,
          pdf.source,
          pdf.location,
          pdf.author,
          ...(Array.isArray(pdf.tags) ? pdf.tags : [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      if (yearFilter) {
        const parsedYear = Number(yearFilter);
        if (!Number.isNaN(parsedYear)) {
          if (Number(pdf.year) !== parsedYear) {
            return false;
          }
        }
      }
      if (statusFilter) {
        if ((pdf.review?.status || 'pending') !== statusFilter) {
          return false;
        }
      }
      if (tagFilter) {
        const tags = Array.isArray(pdf.tags) ? pdf.tags.map((tag) => String(tag).toLowerCase()) : [];
        if (!tags.includes(tagFilter)) {
          return false;
        }
      }
      return true;
    });

    return matches
      .slice()
      .sort((a, b) => {
        const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return right - left;
      });
  }, [dataSource, filters.q, filters.year, filters.status, filters.tag]);

  if (!isOpen) {
    return null;
  }

  const toggleSelection = (pdf) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      if (next.has(pdf.id)) {
        next.delete(pdf.id);
      } else {
        next.set(pdf.id, pdf);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectionMap.values()));
    onClose();
  };

  const handleRefresh = () => {
    if (hasExternalLibrary) {
      onRefreshLibrary?.();
    } else {
      loadPdfs();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-6">
      <div className="bg-white rounded-md shadow-xl w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-parchment-dark px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-ink/60">Mediathek</p>
            <h2 className="text-2xl font-serif font-bold">PDFs auswählen</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
            Schließen
          </button>
        </header>

        <div className="p-6 space-y-4">
          {combinedError && <div className="bg-red-50 text-red-700 px-4 py-2 text-sm">{combinedError}</div>}

          <div className="grid md:grid-cols-4 gap-4">
            <input
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Suche nach Titel, Quelle, Tags"
              className="border border-parchment-dark rounded-sm px-3 py-2 md:col-span-2"
            />
            <input
              value={filters.year}
              onChange={(event) => setFilters((prev) => ({ ...prev, year: event.target.value }))}
              placeholder="Jahr"
              className="border border-parchment-dark rounded-sm px-3 py-2"
            />
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <input
              value={filters.tag}
              onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
              placeholder="Tag"
              className="border border-parchment-dark rounded-sm px-3 py-2 md:col-span-2"
            />
            <div className="text-sm text-ink/60 flex items-center">
              {selectedCount} PDF(s) ausgewählt
            </div>
            <button
              type="button"
              className="text-sm text-accent hover:underline justify-self-end disabled:opacity-50"
              onClick={handleRefresh}
              disabled={combinedLoading}
            >
              Aktualisieren
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {combinedLoading && <p className="text-sm text-ink/60">Lade PDFs…</p>}
            {!combinedLoading && filteredPdfs.length === 0 && (
              <p className="text-sm text-ink/60">Keine PDFs gefunden.</p>
            )}
            {filteredPdfs.map((pdf) => {
              const isSelected = selectionMap.has(pdf.id);
              const url = previewUrl(pdf);
              return (
                <button
                  key={pdf.id}
                  type="button"
                  onClick={() => toggleSelection(pdf)}
                  className={`text-left border rounded-sm p-3 space-y-3 transition ${
                    isSelected ? 'border-accent bg-accent/10' : 'border-parchment-dark hover:border-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{pdf.title}</p>
                      <p className="text-xs text-ink/60">{pdf.year || 'Unbekannt'} · {pdf.location || 'Ohne Ort'}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      pdf.review?.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : pdf.review?.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : pdf.review?.status === 'in_review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-parchment/60 text-ink/70'
                    }`}>
                      {statusOptions.find((option) => option.value === pdf.review?.status)?.label ?? 'Unbekannt'}
                    </span>
                  </div>
                  <div className="text-xs text-ink/70 line-clamp-2">{pdf.description}</div>
                  <div className="border border-dashed border-parchment-dark/70 rounded-sm overflow-hidden bg-white">
                    {url ? (
                      <iframe
                        src={url}
                        title={pdf.title}
                        className="w-full h-40"
                      />
                    ) : (
                      <div className="h-40 flex items-center justify-center text-xs text-ink/60">
                        Keine Vorschau
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>ID: {pdf.id}</span>
                    {isSelected && <span className="text-accent font-semibold">Ausgewählt</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-parchment-dark pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-sm"
            >
              Auswahl übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfSelectorModal;
