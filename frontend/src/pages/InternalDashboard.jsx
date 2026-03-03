import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { fetchDashboardSummary } from '../services/api.js';

const STATUS_ORDER = ['pending', 'in_review', 'approved', 'rejected'];

const STATUS_META = {
  pending: { label: 'Pending', accent: 'text-amber-900', pill: 'bg-amber-100 text-amber-900' },
  in_review: { label: 'In Review', accent: 'text-sky-900', pill: 'bg-sky-100 text-sky-900' },
  approved: { label: 'Approved', accent: 'text-emerald-900', pill: 'bg-emerald-100 text-emerald-900' },
  rejected: { label: 'Rejected', accent: 'text-rose-900', pill: 'bg-rose-100 text-rose-900' }
};

const formatDateTime = (iso) => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const StatusGrid = ({ statuses }) => {
  const total = STATUS_ORDER.reduce((sum, key) => sum + (statuses?.[key] ?? 0), 0);
  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {STATUS_ORDER.map((status) => {
        const count = statuses?.[status] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={status}
            className="border border-parchment-dark/70 rounded-sm p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-ink/60">
                {STATUS_META[status].label}
              </p>
              <p className="text-lg font-semibold text-ink">{count}</p>
            </div>
            <span className={`text-sm font-medium ${STATUS_META[status].accent}`}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
};

const SummaryCard = ({ title, description, total, statuses, extra }) => (
  <article className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 flex flex-col">
    <header>
      <p className="text-xs uppercase tracking-[0.4em] text-accent">{title}</p>
      <div className="flex items-baseline gap-3 mt-2">
        <p className="text-4xl font-serif font-bold text-ink">{total}</p>
        <p className="text-sm text-ink/60">{description}</p>
      </div>
    </header>
    <StatusGrid statuses={statuses} />
    {extra ? <div className="mt-6">{extra}</div> : null}
  </article>
);

const FocusCard = ({ title, description, count, items, emptyLabel }) => (
  <article className="border border-parchment-dark rounded-sm bg-white shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-accent">{title}</p>
        <h3 className="text-2xl font-serif font-semibold text-ink mt-1">{description}</h3>
      </div>
      <span className="text-4xl font-serif font-bold text-ink">{count}</span>
    </div>
    {count === 0 ? (
      <p className="text-sm text-ink/60 mt-4">{emptyLabel}</p>
    ) : (
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between border border-parchment-dark/60 rounded-sm px-3 py-2"
          >
            <div>
              <p className="font-semibold text-sm text-ink">{item.title}</p>
              <p className="text-xs text-ink/60">
                {item.category} {item.year ? `· ${item.year}` : ''}
              </p>
            </div>
            <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', STATUS_META[item.status]?.pill ?? 'bg-parchment text-ink')}>
              {STATUS_META[item.status]?.label ?? item.status}
            </span>
          </li>
        ))}
      </ul>
    )}
  </article>
);

const SuggestionCard = ({ suggestion }) => {
  const ICONS = {
    warning: AlertTriangle,
    tip: Info,
    info: Info,
    success: CheckCircle
  };
  const Icon = ICONS[suggestion.type] ?? Info;
  const tone =
    suggestion.type === 'warning'
      ? 'border-amber-400 bg-amber-50 text-amber-900'
      : suggestion.type === 'tip'
        ? 'border-sky-300 bg-sky-50 text-sky-900'
        : suggestion.type === 'success'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : 'border-parchment-dark bg-parchment text-ink';

  return (
    <article className={`flex items-center gap-4 border rounded-sm p-4 ${tone}`}>
      <Icon size={20} />
      <p className="text-sm font-medium">{suggestion.text}</p>
    </article>
  );
};

const InternalDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const queueStats = useMemo(() => {
    if (!summary?.queue?.totalsByStatus) {
      return [];
    }
    const source = summary.queue.totalsByStatus;
    const total = STATUS_ORDER.reduce((sum, status) => sum + (source[status] ?? 0), 0);
    return STATUS_ORDER.map((status) => ({
      status,
      count: source[status] ?? 0,
      percent: total > 0 ? Math.round(((source[status] ?? 0) / total) * 100) : 0
    }));
  }, [summary]);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Intern</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Operations Dashboard</h1>
          <p className="text-sm text-ink/70 mt-2">
            Überblick über Dokumente, Bilder und PDFs inklusive Review-Status und Engpässen.
          </p>
          {summary?.lastUpdated && (
            <p className="text-xs text-ink/50 mt-1">Aktualisiert: {formatDateTime(summary.lastUpdated)}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadSummary}
            className="inline-flex items-center gap-2 border border-parchment-dark rounded-sm px-4 py-2 text-sm font-semibold hover:bg-parchment-dark/10"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 border border-red-300 bg-red-50 text-red-800 px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <p className="text-sm text-ink/60">Dashboard wird geladen…</p>
      ) : null}

      {summary && (
        <div className="space-y-10">
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              title="Dokumente"
              description="Gesamt im System"
              total={summary.documents.total}
              statuses={summary.documents.reviewStatuses}
              extra={
                <div className="text-sm text-ink/70 space-y-1">
                  <p>{summary.documents.withImages} mit Bildern · {summary.documents.withPdfs} mit PDFs</p>
                  <p>{summary.documents.missingMedia.count} ohne Medienzuordnung</p>
                </div>
              }
            />
            <SummaryCard
              title="Bilder"
              description="Assets in der Bibliothek"
              total={summary.images.total}
              statuses={summary.images.reviewStatuses}
              extra={
                <p className="text-sm text-ink/70">
                  {summary.images.linkedDocuments} verknüpft · {summary.images.unlinked} offen
                </p>
              }
            />
            <SummaryCard
              title="PDFs"
              description="Digitalisierte Dokumente"
              total={summary.pdfs.total}
              statuses={summary.pdfs.reviewStatuses}
              extra={
                <p className="text-sm text-ink/70">
                  {summary.pdfs.linkedDocuments} verknüpft · {summary.pdfs.unlinked} offen
                </p>
              }
            />
          </section>

          <section className="border border-parchment-dark rounded-sm bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-accent">Pipeline</p>
                <h2 className="text-2xl font-serif font-semibold text-ink">Review-Status gesamt</h2>
              </div>
            </div>
            <div className="space-y-4">
              {queueStats.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-sm text-ink/70 mb-1">
                    <span>{STATUS_META[item.status].label}</span>
                    <span>{item.count} · {item.percent}%</span>
                  </div>
                  <div className="h-2 bg-parchment-dark/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor:
                          item.status === 'approved'
                            ? '#047857'
                            : item.status === 'pending'
                              ? '#d97706'
                              : item.status === 'in_review'
                                ? '#0369a1'
                                : '#b91c1c'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <FocusCard
              title="Priorität"
              description="Dokumente ohne Medien"
              count={summary.documents.missingMedia.count}
              items={summary.documents.missingMedia.samples}
              emptyLabel="Alle Dokumente verfügen über mindestens ein Medium."
            />
            <FocusCard
              title="Review-Zuweisung"
              description="Offene Fälle ohne Prüfer"
              count={summary.documents.unassignedReviews.count}
              items={summary.documents.unassignedReviews.samples}
              emptyLabel="Alle Reviews sind zugewiesen."
            />
          </section>

          {summary.suggestions?.length > 0 && (
            <section className="border border-parchment-dark rounded-sm bg-white shadow-sm p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-accent">Insights</p>
                <h2 className="text-2xl font-serif font-semibold text-ink">Empfohlene Aktionen</h2>
              </div>
              <div className="space-y-3">
                {summary.suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default InternalDashboard;
