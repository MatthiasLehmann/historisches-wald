import React, { useEffect, useMemo, useState } from 'react';
import {
  addPdfReviewComment,
  completePdfReview,
  createPdfAsset,
  fetchLocalPdfFiles,
  updatePdfAsset,
  updatePdfReviewStatus
} from '../services/api.js';

const REVIEW_STATUS_OPTIONS = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'in_review', label: 'In Prüfung' },
  { value: 'approved', label: 'Freigegeben' },
  { value: 'rejected', label: 'Abgelehnt' }
];

const defaultForm = {
  title: '',
  year: '',
  description: '',
  location: '',
  source: '',
  author: '',
  license: 'rights-reserved',
  tags: '',
  fileType: 'local',
  filePath: '',
  fileOriginalUrl: ''
};

const PdfEditorModal = ({ isOpen, onClose, pdf = null, onSaved }) => {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reviewerName, setReviewerName] = useState('');
  const [statusValue, setStatusValue] = useState('pending');
  const [commentText, setCommentText] = useState('');
  const [localFiles, setLocalFiles] = useState([]);
  const [localFilesLoading, setLocalFilesLoading] = useState(false);
  const [localFilesError, setLocalFilesError] = useState(null);

  const previewUrl = useMemo(() => {
    if (form.fileType === 'remote') {
      return form.fileOriginalUrl || form.filePath || '';
    }
    return form.filePath || form.fileOriginalUrl || '';
  }, [form.fileOriginalUrl, form.filePath, form.fileType]);
  const hasCurrentLocalFile = useMemo(
    () => (form.filePath ? localFiles.some((file) => file.path === form.filePath) : false),
    [form.filePath, localFiles]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setError(null);
    setSaving(false);
    setCommentText('');
    const nextForm = pdf
      ? {
          title: pdf.title ?? '',
          year: pdf.year ? String(pdf.year) : '',
          description: pdf.description ?? '',
          location: pdf.location ?? '',
          source: pdf.source ?? '',
          author: pdf.author ?? '',
          license: pdf.license ?? 'rights-reserved',
          tags: Array.isArray(pdf.tags) ? pdf.tags.join(', ') : '',
          fileType: pdf.file?.type === 'remote' ? 'remote' : 'local',
          filePath: pdf.file?.path ?? '',
          fileOriginalUrl: pdf.file?.originalUrl ?? ''
        }
      : { ...defaultForm };
    setForm(nextForm);
    setReviewerName(pdf?.review?.reviewer ?? '');
    setStatusValue(pdf?.review?.status ?? 'pending');
  }, [isOpen, pdf]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    let cancelled = false;
    const loadLocalFiles = async () => {
      setLocalFilesLoading(true);
      setLocalFilesError(null);
      try {
        const files = await fetchLocalPdfFiles();
        if (!cancelled) {
          setLocalFiles(Array.isArray(files) ? files : []);
        }
      } catch (loadError) {
        console.error('Lokale PDF-Dateien konnten nicht geladen werden:', loadError);
        if (!cancelled) {
          setLocalFiles([]);
          setLocalFilesError('Lokale PDF-Dateien konnten nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLocalFilesLoading(false);
        }
      }
    };
    loadLocalFiles();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        year: form.year ? Number(form.year) : undefined,
        description: form.description,
        location: form.location,
        source: form.source,
        author: form.author,
        license: form.license,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        file: {
          type: form.fileType,
          path: form.fileType === 'local' ? form.filePath.trim() : '',
          originalUrl: form.fileType === 'remote'
            ? form.fileOriginalUrl.trim()
            : form.fileOriginalUrl.trim() || null
        }
      };

      if (!payload.title) {
        throw new Error('Bitte geben Sie einen Titel an.');
      }

      if (form.fileType === 'local' && !payload.file.path) {
        throw new Error('Bitte geben Sie einen lokalen PDF-Pfad an.');
      }

      if (form.fileType === 'remote' && !payload.file.originalUrl) {
        throw new Error('Bitte geben Sie eine PDF-URL an.');
      }

      const saved = pdf?.id
        ? await updatePdfAsset(pdf.id, payload)
        : await createPdfAsset(payload);

      onSaved?.(saved);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!pdf?.id) {
      return;
    }
    if (!reviewerName.trim()) {
      setError('Reviewer-Name erforderlich.');
      return;
    }
    try {
      await updatePdfReviewStatus(pdf.id, { reviewer: reviewerName.trim(), status: statusValue });
      onSaved?.();
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  const handleAddComment = async () => {
    if (!pdf?.id) {
      return;
    }
    if (!reviewerName.trim() || !commentText.trim()) {
      setError('Reviewer und Kommentar erforderlich.');
      return;
    }
    try {
      await addPdfReviewComment(pdf.id, {
        reviewer: reviewerName.trim(),
        comment: commentText.trim()
      });
      setCommentText('');
      onSaved?.();
    } catch (commentError) {
      setError(commentError.message);
    }
  };

  const handleCompleteReview = async () => {
    if (!pdf?.id || !reviewerName.trim()) {
      setError('Reviewer-Name erforderlich.');
      return;
    }
    try {
      await completePdfReview(pdf.id, { reviewer: reviewerName.trim() });
      onSaved?.();
    } catch (completeError) {
      setError(completeError.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-6">
      <div className="bg-white rounded-md shadow-xl w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-parchment-dark px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-ink/60">PDF bearbeiten</p>
            <h2 className="text-2xl font-serif font-bold">{pdf ? 'PDF aktualisieren' : 'Neues PDF anlegen'}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink/60 hover:text-ink">
            Schließen
          </button>
        </header>

        {error && <div className="bg-red-50 text-red-700 px-6 py-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Titel*
              <input
                required
                name="title"
                value={form.title}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Jahr
              <input
                name="year"
                type="number"
                value={form.year}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Ort
              <input
                name="location"
                value={form.location}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Quelle
              <input
                name="source"
                value={form.source}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Autor
              <input
                name="author"
                value={form.author}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm font-medium text-ink/80 block">
            Lizenz
            <input
              name="license"
              value={form.license}
              onChange={handleFieldChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-ink/80 block">
            Beschreibung
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleFieldChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm font-medium text-ink/80 block">
            Tags (kommagetrennt)
            <input
              name="tags"
              value={form.tags}
              onChange={handleFieldChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              placeholder="Zeitung, Brand"
            />
          </label>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Datei-Typ
              <select
                name="fileType"
                value={form.fileType}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
              >
                <option value="local">Lokaler Pfad</option>
                <option value="remote">Remote URL</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Pfad
              {form.fileType === 'local' ? (
                <div className="space-y-1">
                  <select
                    name="filePath"
                    value={form.filePath}
                    onChange={handleFieldChange}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
                    required
                    disabled={localFilesLoading}
                  >
                    <option value="">PDF auswählen…</option>
                    {form.filePath && !hasCurrentLocalFile && (
                      <option value={form.filePath}>{`Aktueller Pfad (${form.filePath})`}</option>
                    )}
                    {localFiles.map((file) => (
                      <option key={file.path} value={file.path}>
                        {file.name}
                      </option>
                    ))}
                  </select>
                  {localFilesLoading && <p className="text-xs text-ink/60">Lade lokale PDFs…</p>}
                  {!localFilesLoading && localFilesError && (
                    <p className="text-xs text-red-600">{localFilesError}</p>
                  )}
                  {!localFilesLoading && !localFilesError && localFiles.length === 0 && !hasCurrentLocalFile && (
                    <p className="text-xs text-ink/60">Keine lokalen PDFs gefunden.</p>
                  )}
                </div>
              ) : (
                <input
                  name="filePath"
                  value={form.filePath}
                  onChange={handleFieldChange}
                  className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                  placeholder="/files/pdf/abc.pdf"
                />
              )}
            </label>
            <label className="space-y-1 text-sm font-medium text-ink/80">
              Original-URL
              <input
                name="fileOriginalUrl"
                value={form.fileOriginalUrl}
                onChange={handleFieldChange}
                className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                placeholder="https://example.com/file.pdf"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-parchment-dark rounded-sm p-3 bg-parchment/30 space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-ink/60">Vorschau</p>
              {previewUrl ? (
                <>
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    className="w-full h-64 border border-parchment-dark rounded-sm"
                  />
                  <div className="flex items-center gap-4 text-sm">
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      In neuem Tab öffnen
                    </a>
                    <a href={previewUrl} download className="text-ink hover:underline">
                      Download
                    </a>
                  </div>
                </>
              ) : (
                <div className="w-full h-64 border border-dashed border-parchment-dark/70 flex items-center justify-center text-xs text-ink/50">
                  Keine Vorschau verfügbar
                </div>
              )}
            </div>

            <div className="border border-parchment-dark rounded-sm p-3 bg-parchment/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-ink/60">Review</p>
                  <p className="text-lg font-serif font-semibold">Status & Feedback</p>
                </div>
                {pdf && pdf.linkedDocuments?.length > 0 && (
                  <span className="text-xs text-ink/60">Verknüpft mit: {pdf.linkedDocuments.join(', ')}</span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm font-medium text-ink/80 space-y-1">
                  Reviewer
                  <input
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                    placeholder="Name"
                  />
                </label>
                <label className="text-sm font-medium text-ink/80 space-y-1">
                  Status
                  <select
                    value={statusValue}
                    onChange={(event) => setStatusValue(event.target.value)}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
                  >
                    {REVIEW_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-parchment-dark text-sm font-semibold rounded-sm"
                  onClick={handleStatusUpdate}
                  disabled={!pdf?.id}
                >
                  Status aktualisieren
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-sm disabled:bg-green-800/40"
                  onClick={handleCompleteReview}
                  disabled={!pdf?.id}
                >
                  Review abschließen
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink/80">
                  Kommentar hinzufügen
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    className="w-full border border-parchment-dark rounded-sm px-3 py-2"
                    placeholder="Feedback oder Redaktion"
                  />
                </label>
                <button
                  type="button"
                  className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-sm"
                  onClick={handleAddComment}
                  disabled={!pdf?.id}
                >
                  Kommentar speichern
                </button>
              </div>

              {pdf?.review?.comments?.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-parchment-dark rounded-sm p-2 bg-white">
                  <ul className="space-y-2 text-sm">
                    {pdf.review.comments.map((comment) => (
                      <li key={`${comment.date}-${comment.comment}`} className="border-b border-parchment-dark/30 pb-1 last:border-none">
                        <p className="font-semibold text-ink">
                          {comment.reviewer}
                          <span className="text-xs text-ink/60 ml-2">{new Date(comment.date).toLocaleString()}</span>
                        </p>
                        <p className="text-ink/80">{comment.comment}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-parchment-dark pt-4 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-accent text-white text-sm font-semibold rounded-sm disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PdfEditorModal;
