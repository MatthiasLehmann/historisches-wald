import { useMemo } from 'react';
import StatusBadge from './StatusBadge';

const DEFAULT_REVIEW = {
  status: 'pending',
  reviewer: '',
  reviewedAt: null,
  comments: []
};

const toInputDateValue = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const buildReviewState = (source) => ({ ...DEFAULT_REVIEW, ...(source ?? {}) });

const formatStatusLabel = (status) =>
  status
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const PhotoEditor = ({ value, onChange, statusOptions = [], disabled = false }) => {
  const review = useMemo(() => buildReviewState(value?.review), [value?.review]);
  const tagsInputValue = value?.tagsInput ?? (value?.tags ?? []).join(', ');
  const reviewCommentsValue = value?.reviewCommentsInput ?? (review.comments ?? []).join('\n');
  const reviewedAtInput = toInputDateValue(review.reviewedAt);

  const statusChoices = useMemo(() => {
    const base = statusOptions.length > 0 ? statusOptions : ['pending', 'in-progress', 'approved', 'needs-info', 'rejected'];
    return base;
  }, [statusOptions]);

  if (!value) {
    return (
      <div className="bg-white border border-parchment-dark rounded-lg p-6 shadow-sm">
        <p className="text-sm text-ink/70">Foto wird geladen...</p>
      </div>
    );
  }

  const handleFieldChange = (field) => (event) => {
    const newValue = event.target.value;
    onChange((prev) => ({ ...prev, [field]: newValue }));
  };

  const handleTagsChange = (event) => {
    const newValue = event.target.value;
    const tags = newValue
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onChange((prev) => ({ ...prev, tags, tagsInput: newValue }));
  };

  const patchReview = (updater) => {
    onChange((prev) => {
      const current = buildReviewState(prev.review);
      const nextReview = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      return {
        ...prev,
        review: nextReview
      };
    });
  };

  const handleReviewFieldChange = (field) => (event) => {
    const newValue = event.target.value;
    patchReview({ [field]: newValue });
  };

  const handleReviewCommentsChange = (event) => {
    const newValue = event.target.value;
    const comments = newValue
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onChange((prev) => {
      const current = buildReviewState(prev.review);
      return {
        ...prev,
        review: { ...current, comments },
        reviewCommentsInput: newValue
      };
    });
  };

  const handleReviewDateChange = (event) => {
    const newValue = event.target.value;
    const isoValue = newValue ? new Date(newValue).toISOString() : null;
    patchReview({ reviewedAt: isoValue });
  };

  return (
    <div className="bg-white border border-parchment-dark rounded-lg shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-ink/60 tracking-wider">Review Status</p>
          <StatusBadge status={review.status} />
        </div>
        <select
          value={review.status}
          onChange={handleReviewFieldChange('status')}
          disabled={disabled}
          className="border border-parchment-dark rounded-md px-3 py-2"
        >
          {statusChoices.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-name">
            Name
          </label>
          <input
            id="photo-name"
            type="text"
            value={value.name}
            onChange={handleFieldChange('name')}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            disabled={disabled}
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-date">
            Aufnahmedatum (YYYY-MM-DD HH:MM:SS)
          </label>
          <input
            id="photo-date"
            type="text"
            value={value.date_taken || ''}
            onChange={handleFieldChange('date_taken')}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="2024-01-01 12:00:00"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-source">
          Quelle / Archiv
        </label>
        <input
          id="photo-source"
          type="text"
          value={value.source || ''}
          onChange={handleFieldChange('source')}
          className="w-full border border-parchment-dark rounded-md px-3 py-2"
          placeholder="z. B. Pfarrarchiv Wald oder https://..."
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-description">
          Beschreibung
        </label>
        <textarea
          id="photo-description"
          rows={4}
          value={value.description}
          onChange={handleFieldChange('description')}
          className="w-full border border-parchment-dark rounded-md px-3 py-2"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="photo-tags">
          Tags (mit Komma trennen)
        </label>
        <input
          id="photo-tags"
          type="text"
          value={tagsInputValue}
          onChange={handleTagsChange}
          className="w-full border border-parchment-dark rounded-md px-3 py-2"
          placeholder="wald, feuerwehr"
          disabled={disabled}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="reviewer">
            Reviewer
          </label>
          <input
            id="reviewer"
            type="text"
            value={review.reviewer}
            onChange={handleReviewFieldChange('reviewer')}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="reviewedAt">
            Reviewed At
          </label>
          <input
            id="reviewedAt"
            type="datetime-local"
            value={reviewedAtInput}
            onChange={handleReviewDateChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-ink/60 mb-2" htmlFor="review-comments">
            Review-Kommentare
          </label>
          <textarea
            id="review-comments"
            rows={3}
            value={reviewCommentsValue}
            onChange={handleReviewCommentsChange}
            className="w-full border border-parchment-dark rounded-md px-3 py-2"
            placeholder="Eine Zeile pro Kommentar"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
