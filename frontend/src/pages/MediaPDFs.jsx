import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import PdfEditorModal from '../components/PdfEditorModal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  deletePdfAsset,
  fetchPdfs,
  importLocalPdfFile,
  importRemotePdf
} from '../services/api.js';

const MediaPDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    year: '',
    status: '',
    sort: 'updatedAt',
    order: 'desc'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorPdf, setEditorPdf] = useState(null);
  const [importData, setImportData] = useState({
    url: '',
    title: '',
    year: '',
    description: '',
    source: ''
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const previewUrl = useMemo(() => {
    return (pdf) => {
      if (pdf.file?.type === 'remote') {
        return pdf.file?.originalUrl || pdf.file?.path || '';
      }
      return pdf.file?.path || pdf.file?.originalUrl || '';
    };
  }, []);

  const loadPdfs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPdfs(filters);
      setPdfs(result);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPdfs();
  }, [loadPdfs]);

  const handleDelete = async (pdf) => {
    if (!window.confirm(`PDF "${pdf.title}" wirklich löschen?`)) {
      return;
    }
    try {
      await deletePdfAsset(pdf.id);
      loadPdfs();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    if (!importData.url.trim()) {
      setError('Bitte geben Sie eine PDF-URL ein.');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      await importRemotePdf({
        url: importData.url.trim(),
        title: importData.title.trim() || undefined,
        year: importData.year ? Number(importData.year) : undefined,
        description: importData.description.trim() || undefined,
        source: importData.source.trim() || undefined
      });
      setImportData({ url: '', title: '', year: '', description: '', source: '' });
      await loadPdfs();
    } catch (importError) {
      setError(importError.message);
    } finally {
      setImporting(false);
    }
  };

  const handleLocalFileButton = () => {
    fileInputRef.current?.click();
  };

  const handleLocalFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setImporting(true);
    setError(null);
    try {
      await importLocalPdfFile({
        file,
        title: importData.title,
        year: importData.year,
        description: importData.description,
        source: importData.source
      });
      setImportData({ url: '', title: '', year: '', description: '', source: '' });
      await loadPdfs();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setImporting(false);
    }
  };

  const handleOpenEditor = (pdf = null) => {
    setEditorPdf(pdf);
    setIsEditorOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Mediathek</p>
        <div className="flex items-center gap-3">
          <FileText className="text-accent" />
          <h1 className="text-4xl font-serif font-bold">PDF-Bibliothek</h1>
        </div>
        <p className="text-ink/70 text-sm">Verwalten Sie zentrale PDF-Dateien, Review-Status und Verknüpfungen zu Dokumenten.</p>
      </header>

      {error && <div className="bg-red-50 text-red-700 px-4 py-2 mb-4 text-sm">{error}</div>}

      <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4 mb-8">
        <div className="grid lg:grid-cols-6 gap-3">
          <input
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="Suche nach Titel, Quelle, Tags"
            className="border border-parchment-dark rounded-sm px-3 py-2 lg:col-span-2"
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
            <option value="">Alle Stati</option>
            <option value="pending">Ausstehend</option>
            <option value="in_review">In Prüfung</option>
            <option value="approved">Freigegeben</option>
            <option value="rejected">Abgelehnt</option>
          </select>
          <select
            value={filters.sort}
            onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
          >
            <option value="updatedAt">Aktualisiert</option>
            <option value="year">Jahr</option>
          </select>
          <select
            value={filters.order}
            onChange={(event) => setFilters((prev) => ({ ...prev, order: event.target.value }))}
            className="border border-parchment-dark rounded-sm px-3 py-2 bg-white"
          >
            <option value="desc">Neueste zuerst</option>
            <option value="asc">Älteste zuerst</option>
          </select>
          <button
            type="button"
            onClick={loadPdfs}
            className="flex items-center justify-center gap-2 border border-parchment-dark rounded-sm px-3 py-2 text-sm"
          >
            <RefreshCcw size={16} />
            Aktualisieren
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 border-t border-parchment-dark pt-4">
          <form onSubmit={handleImport} className="flex flex-wrap gap-2 flex-1">
            <input
              value={importData.url}
              onChange={(event) => setImportData((prev) => ({ ...prev, url: event.target.value }))}
              className="flex-1 min-w-[200px] border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="PDF-URL importieren"
            />
            <input
              value={importData.title}
              onChange={(event) => setImportData((prev) => ({ ...prev, title: event.target.value }))}
              className="w-48 border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Titel"
            />
            <input
              value={importData.year}
              onChange={(event) => setImportData((prev) => ({ ...prev, year: event.target.value }))}
              className="w-28 border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Jahr"
              type="number"
            />
            <input
              value={importData.source}
              onChange={(event) => setImportData((prev) => ({ ...prev, source: event.target.value }))}
              className="w-48 border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Quelle"
            />
            <input
              value={importData.description}
              onChange={(event) => setImportData((prev) => ({ ...prev, description: event.target.value }))}
              className="flex-1 min-w-[200px] border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Kurzbeschreibung"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-parchment-dark text-sm font-semibold rounded-sm disabled:opacity-60"
                disabled={importing}
              >
                URL importieren
              </button>
              <button
                type="button"
                onClick={handleLocalFileButton}
                className="px-4 py-2 border border-parchment-dark text-sm font-semibold rounded-sm disabled:opacity-60"
                disabled={importing}
              >
                Datei auswählen
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleLocalFileChange}
            />
          </form>
          <button
            type="button"
            onClick={() => handleOpenEditor(null)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-sm"
          >
            <Plus size={16} />
            Neues PDF
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {loading && <p className="text-sm text-ink/60">Lade PDFs…</p>}
        {!loading && pdfs.length === 0 && (
          <p className="text-sm text-ink/60">Keine PDFs vorhanden.</p>
        )}
        <ul className="space-y-4">
          {pdfs.map((pdf) => {
            const url = previewUrl(pdf);
            return (
              <li key={pdf.id} className="bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-ink/60">PDF</p>
                    <h3 className="text-xl font-serif font-bold text-ink">{pdf.title}</h3>
                    <p className="text-sm text-ink/70">
                      {pdf.year || 'Unbekannt'} · {pdf.location || 'Ohne Ort'} · Quelle: {pdf.source || 'Unbekannt'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={pdf.review?.status} />
                    <button
                      type="button"
                      onClick={() => handleOpenEditor(pdf)}
                      className="px-4 py-2 border border-parchment-dark rounded-sm text-sm"
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pdf)}
                      className="px-3 py-2 border border-red-200 text-red-700 rounded-sm text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Löschen
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-parchment-dark rounded-sm overflow-hidden bg-white">
                    {url ? (
                      <iframe src={url} className="w-full h-64" title={pdf.title} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-sm text-ink/60">
                        Keine Vorschau verfügbar
                      </div>
                    )}
                  </div>
                  <div className="bg-parchment/30 border border-parchment-dark rounded-sm p-4 space-y-3">
                    <p className="text-sm text-ink/80">{pdf.description || 'Keine Beschreibung hinterlegt.'}</p>
                    <div className="text-xs text-ink/60 space-y-1">
                      <p>ID: {pdf.id}</p>
                      <p>Lizenz: {pdf.license || 'rights-reserved'}</p>
                      {pdf.linkedDocuments?.length > 0 && (
                        <p>Verknüpfte Dokumente: {pdf.linkedDocuments.join(', ')}</p>
                      )}
                      <p>Aktualisiert: {new Date(pdf.updatedAt).toLocaleString()}</p>
                    </div>
                    {url && (
                      <div className="flex items-center gap-4 text-sm">
                        <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          Im neuen Tab öffnen
                        </a>
                        <a href={url} download className="text-ink hover:underline">
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <PdfEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        pdf={editorPdf}
        onSaved={loadPdfs}
      />
    </div>
  );
};

export default MediaPDFs;
