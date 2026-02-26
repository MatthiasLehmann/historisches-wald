import React, { useEffect, useMemo, useState } from 'react';

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

const defaultReview = {
  status: 'pending',
  reviewer: '',
  reviewedAt: null,
  comments: []
};

const ReviewPanel = ({ documentId, document, onReviewChange }) => {
  const [review, setReview] = useState(document?.review ?? defaultReview);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [statusSelection, setStatusSelection] = useState(review.status);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setReview(document?.review ?? defaultReview);
    setStatusSelection(document?.review?.status ?? 'pending');
  }, [document?.review, documentId]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    let cancelled = false;

    const loadReview = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/documents/${documentId}/review`);
        if (!response.ok) {
          throw new Error('Review data could not be loaded.');
        }
        const data = await response.json();
        if (!cancelled) {
          setReview(data);
          setStatusSelection(data.status);
          onReviewChange?.(documentId, data);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({ type: 'error', text: error.message });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReview();
    return () => {
      cancelled = true;
    };
  }, [documentId, onReviewChange]);

  const statusBadgeClass = useMemo(() => {
    return STATUS_STYLES[review.status] ?? STATUS_STYLES.pending;
  }, [review.status]);

  const requireReviewer = () => {
    const trimmed = reviewerName.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Reviewer name is required.' });
      return null;
    }
    return trimmed;
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const reviewer = requireReviewer();
    if (!reviewer) return;
    if (!commentText.trim()) {
      setMessage({ type: 'error', text: 'Comment text is required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/review/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer, comment: commentText.trim() })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add comment.');
      }
      const data = await response.json();
      setReview(data);
      setStatusSelection(data.status);
      setCommentText('');
      setMessage({ type: 'success', text: 'Comment added.' });
      onReviewChange?.(documentId, data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    const reviewer = requireReviewer();
    if (!reviewer) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/review/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer, status: statusSelection })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status.');
      }
      const data = await response.json();
      setReview(data);
      setMessage({ type: 'success', text: 'Status updated.' });
      onReviewChange?.(documentId, data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReview = async () => {
    const reviewer = requireReviewer();
    if (!reviewer) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/review/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete review.');
      }
      const data = await response.json();
      setReview(data);
      setStatusSelection('approved');
      setMessage({ type: 'success', text: 'Review completed and committed.' });
      onReviewChange?.(documentId, data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 border border-parchment-dark rounded-sm bg-parchment/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-ink">Review</h2>
          <p className="text-xs text-ink/60">Verlauf und Freigabe</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass}`}>
          {STATUS_LABELS[review.status] ?? review.status}
        </span>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {message.text}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-ink/60">Reviewer</dt>
          <dd className="font-medium text-ink">{review.reviewer || '—'}</dd>
        </div>
        <div>
          <dt className="text-ink/60">Review-Date</dt>
          <dd className="font-medium text-ink">
            {review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : '—'}
          </dd>
        </div>
      </dl>

      <label className="block text-sm font-medium text-ink/80">
        Reviewer Name*
        <input
          value={reviewerName}
          onChange={(event) => setReviewerName(event.target.value)}
          className="mt-1 w-full border border-parchment-dark rounded-sm px-3 py-2"
          placeholder="Name eingeben"
          disabled={isLoading || isSubmitting}
        />
      </label>

      <form onSubmit={handleCommentSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-ink/80">
          Kommentar
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            rows={3}
            className="mt-1 w-full border border-parchment-dark rounded-sm px-3 py-2"
            placeholder="Kommentar hinzufügen"
            disabled={isLoading || isSubmitting}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="px-4 py-2 bg-ink text-white rounded-sm text-sm font-semibold disabled:opacity-50"
        >
          Kommentar speichern
        </button>
      </form>

      <form onSubmit={handleStatusSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-ink/80">
          Review-Status
          <select
            value={statusSelection}
            onChange={(event) => setStatusSelection(event.target.value)}
            className="mt-1 w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
            disabled={isLoading || isSubmitting}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="px-4 py-2 bg-accent text-white rounded-sm text-sm font-semibold disabled:opacity-50"
        >
          Status aktualisieren
        </button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/60">Review abschließen, Status wird auf Approved gesetzt.</p>
        <button
          type="button"
          onClick={handleCompleteReview}
          disabled={isLoading || isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded-sm text-sm font-semibold disabled:opacity-50"
        >
          Review abschließen (Git Commit)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Kommentarverlauf</h3>
        {isLoading ? (
          <p className="text-xs text-ink/60">Lade…</p>
        ) : review.comments.length === 0 ? (
          <p className="text-xs text-ink/60">Noch keine Kommentare vorhanden.</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {review.comments
              .slice()
              .reverse()
              .map((entry, index) => (
                <li key={`${entry.date}-${index}`} className="border border-parchment-dark/60 rounded-sm p-2 bg-white">
                  <p className="text-xs text-ink/60">
                    {entry.reviewer} · {new Date(entry.date).toLocaleString()}
                  </p>
                  <p className="text-sm text-ink mt-1 whitespace-pre-line">{entry.comment}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ReviewPanel;
