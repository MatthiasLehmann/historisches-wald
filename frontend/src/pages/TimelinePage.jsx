import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import MediaTimelineSection from '../components/MediaTimelineSection.jsx';
import RichTextContent from '../components/RichTextContent';
import { fetchDocuments } from '../services/api';

const PAGE_SIZE = 6;

const TimelinePage = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = React.useState([]);
    const [selectedDocumentId, setSelectedDocumentId] = React.useState(null);
    const [activeDecade, setActiveDecade] = React.useState(null);
    const [page, setPage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [yearRange, setYearRange] = React.useState(null);
    const [manualYearRange, setManualYearRange] = React.useState(null);
    const [autoZoom, setAutoZoom] = React.useState(false);

    React.useEffect(() => {
        let ignore = false;
        const loadDocuments = async () => {
            try {
                const data = await fetchDocuments();
                if (!ignore) {
                    setDocuments(data);
                }
            } catch (err) {
                console.error('Failed to load documents:', err);
                if (!ignore) {
                    setError('Dokumente konnten nicht geladen werden.');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        loadDocuments();
        return () => {
            ignore = true;
        };
    }, []);

    const approvedDocuments = React.useMemo(
        () => documents.filter((doc) => doc?.review?.status === 'approved'),
        [documents]
    );

    const numericYears = React.useMemo(() => (
        approvedDocuments
            .map((doc) => Number.parseInt(doc.year, 10))
            .filter((value) => Number.isFinite(value))
    ), [approvedDocuments]);

    const minYear = numericYears.length > 0 ? Math.min(...numericYears) : null;
    const maxYear = numericYears.length > 0 ? Math.max(...numericYears) : null;
    const hasYearBounds = Number.isFinite(minYear) && Number.isFinite(maxYear) && minYear !== maxYear;

    React.useEffect(() => {
        if (!hasYearBounds) {
            setYearRange(null);
            setManualYearRange(null);
            setAutoZoom(false);
            return;
        }
        setYearRange((prev) => {
            if (!prev) {
                const initial = [minYear, maxYear];
                setManualYearRange(initial);
                return initial;
            }
            const clampedStart = Math.max(minYear, Math.min(prev[0], maxYear));
            const clampedEnd = Math.max(minYear, Math.min(prev[1], maxYear));
            const next = [
                Math.min(clampedStart, clampedEnd),
                Math.max(clampedStart, clampedEnd)
            ];
            if (next[0] === prev[0] && next[1] === prev[1]) {
                return prev;
            }
            return next;
        });
    }, [hasYearBounds, minYear, maxYear]);

    const filteredDocuments = React.useMemo(() => {
        if (!yearRange || !hasYearBounds) {
            return approvedDocuments;
        }
        const [start, end] = yearRange;
        return approvedDocuments.filter((doc) => {
            const numericYear = Number.parseInt(doc.year, 10);
            if (!Number.isFinite(numericYear)) {
                return true;
            }
            return numericYear >= start && numericYear <= end;
        });
    }, [approvedDocuments, yearRange, hasYearBounds]);

    const decadeGroups = React.useMemo(() => {
        const groups = {};
        filteredDocuments.forEach((doc) => {
            const numericYear = Number.parseInt(doc.year, 10);
            const key = Number.isFinite(numericYear)
                ? String(Math.floor(numericYear / 10) * 10)
                : 'unknown';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(doc);
        });
        Object.values(groups).forEach((list) => {
            list.sort((a, b) => {
                const yearA = Number.parseInt(a.year, 10) || 0;
                const yearB = Number.parseInt(b.year, 10) || 0;
                return yearA - yearB;
            });
        });
        return groups;
    }, [filteredDocuments]);

    const sortedDecades = React.useMemo(() => {
        const known = Object.keys(decadeGroups)
            .filter((key) => key !== 'unknown')
            .sort((a, b) => Number(a) - Number(b));
        if (decadeGroups.unknown) {
            return [...known, 'unknown'];
        }
        return known;
    }, [decadeGroups]);

    React.useEffect(() => {
        if (sortedDecades.length === 0) {
            if (activeDecade !== null) {
                setActiveDecade(null);
            }
            return;
        }
        if (!activeDecade || !decadeGroups[activeDecade]) {
            setActiveDecade(sortedDecades[0]);
            setPage(0);
        }
    }, [sortedDecades, activeDecade, decadeGroups]);

    React.useEffect(() => {
        setPage(0);
    }, [activeDecade]);

    const currentDecadeDocs = React.useMemo(() => {
        if (!activeDecade) {
            return [];
        }
        return decadeGroups[activeDecade] ?? [];
    }, [activeDecade, decadeGroups]);

    React.useEffect(() => {
        const totalPagesForDocs = Math.max(1, Math.ceil(currentDecadeDocs.length / PAGE_SIZE));
        if (page > totalPagesForDocs - 1) {
            setPage(0);
        }
    }, [currentDecadeDocs.length, page]);

    React.useEffect(() => {
        if (currentDecadeDocs.length === 0) {
            if (selectedDocumentId !== null) {
                setSelectedDocumentId(null);
            }
            return;
        }
        const hasSelected = currentDecadeDocs.some((doc) => doc.id === selectedDocumentId);
        if (!hasSelected) {
            setSelectedDocumentId(currentDecadeDocs[0].id);
        }
    }, [currentDecadeDocs, selectedDocumentId]);

    React.useEffect(() => {
        if (!autoZoom || !activeDecade || !hasYearBounds || !yearRange) {
            return;
        }
        if (activeDecade === 'unknown') {
            const nextRange = [minYear, maxYear];
            if (nextRange[0] !== yearRange[0] || nextRange[1] !== yearRange[1]) {
                setYearRange(nextRange);
            }
            return;
        }
        const decadeStart = Number.parseInt(activeDecade, 10);
        if (!Number.isFinite(decadeStart)) {
            return;
        }
        const nextStart = Math.max(minYear, Math.min(decadeStart, maxYear));
        const nextEnd = Math.min(maxYear, Math.max(decadeStart + 9, minYear));
        if (nextStart !== yearRange[0] || nextEnd !== yearRange[1]) {
            setYearRange([nextStart, nextEnd]);
        }
    }, [autoZoom, activeDecade, hasYearBounds, minYear, maxYear, yearRange]);

    const paginatedDocs = React.useMemo(() => {
        const start = page * PAGE_SIZE;
        return currentDecadeDocs.slice(start, start + PAGE_SIZE);
    }, [currentDecadeDocs, page]);

    const totalPages = Math.max(1, Math.ceil(currentDecadeDocs.length / PAGE_SIZE));

    const selectedDocument = React.useMemo(() => (
        filteredDocuments.find((doc) => doc.id === selectedDocumentId) ?? null
    ), [filteredDocuments, selectedDocumentId]);

    const sliderRange = React.useMemo(() => {
        if (!hasYearBounds) {
            return null;
        }
        if (yearRange) {
            return yearRange;
        }
        if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
            return null;
        }
        return [minYear, maxYear];
    }, [hasYearBounds, yearRange, minYear, maxYear]);

    const sliderHighlightStyle = React.useMemo(() => {
        if (!hasYearBounds || !sliderRange) {
            return {};
        }
        const total = maxYear - minYear;
        if (total <= 0) {
            return {};
        }
        const startPercent = ((sliderRange[0] - minYear) / total) * 100;
        const endPercent = ((sliderRange[1] - minYear) / total) * 100;
        return {
            left: `${startPercent}%`,
            right: `${100 - endPercent}%`
        };
    }, [hasYearBounds, sliderRange, minYear, maxYear]);

    const formatDecadeLabel = React.useCallback((key) => {
        if (key === 'unknown') {
            return 'Ohne Jahr';
        }
        const startYear = Number(key);
        if (!Number.isFinite(startYear)) {
            return 'Ohne Jahr';
        }
        const endYear = startYear + 9;
        return `${startYear}–${endYear}`;
    }, []);

    const handleDecadeChange = React.useCallback((decade) => {
        if (decade !== activeDecade) {
            setActiveDecade(decade);
        }
    }, [activeDecade]);

    const handleCardSelect = React.useCallback((docId) => {
        setSelectedDocumentId(docId);
    }, []);

    const handlePreviousPage = React.useCallback(() => {
        setPage((prev) => Math.max(prev - 1, 0));
    }, []);

    const handleNextPage = React.useCallback(() => {
        setPage((prev) => Math.min(prev + 1, totalPages - 1));
    }, [totalPages]);

    const handleRangeInputChange = React.useCallback((index, value) => {
        if (!hasYearBounds || autoZoom || !yearRange) {
            return;
        }
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return;
        }
        const nextRange = [...yearRange];
        nextRange[index] = numericValue;
        if (nextRange[0] > nextRange[1]) {
            if (index === 0) {
                nextRange[1] = numericValue;
            } else {
                nextRange[0] = numericValue;
            }
        }
        setYearRange(nextRange);
        setManualYearRange(nextRange);
    }, [hasYearBounds, autoZoom, yearRange]);

    const handleToggleAutoZoom = React.useCallback(() => {
        setAutoZoom((prev) => {
            if (prev) {
                if (manualYearRange) {
                    setYearRange(manualYearRange);
                }
                return false;
            }
            if (yearRange) {
                setManualYearRange(yearRange);
            }
            return true;
        });
    }, [manualYearRange, yearRange]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-ink/60">Zeitleiste wird geladen...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Zeitleiste</h1>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (filteredDocuments.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Zeitleiste</h1>
                <p className="text-ink/60">Keine Dokumente im gewählten Zeitraum verfügbar.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 space-y-12">
            <header className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.5em] text-accent">Zeitleiste</p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Geschichte im Überblick</h1>
                <p className="text-ink/70">
                    Blättern Sie chronologisch durch Urkunden, Chroniken und Zeitzeugenberichte. Filtern Sie den Zeitraum oder nutzen Sie Auto-Zoom, um gezielt Epochen hervorzuheben.
                </p>
            </header>

            {hasYearBounds && sliderRange && (
                <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-accent">Zeitbereich</p>
                            <p className="text-lg font-serif font-bold text-ink">
                                {sliderRange[0]} – {sliderRange[1]}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-[0.3em] text-ink/60">Auto-Zoom</span>
                            <button
                                type="button"
                                onClick={handleToggleAutoZoom}
                                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                                    autoZoom ? 'bg-accent text-white border-accent' : 'bg-parchment/40 text-ink/70 border-parchment-dark/50'
                                }`}
                            >
                                {autoZoom ? 'Aktiv' : 'Inaktiv'}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="relative h-2 bg-parchment/50 rounded-full overflow-hidden">
                            <div
                                className="absolute h-full bg-accent/40"
                                style={sliderHighlightStyle}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.3em] text-ink/60">Startjahr</label>
                                <input
                                    type="range"
                                    min={minYear}
                                    max={maxYear}
                                    value={sliderRange[0]}
                                    onChange={(event) => handleRangeInputChange(0, event.target.value)}
                                    disabled={autoZoom}
                                    className="w-full accent-accent"
                                />
                                <p className="text-sm text-ink/70">{sliderRange[0]}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.3em] text-ink/60">Endjahr</label>
                                <input
                                    type="range"
                                    min={minYear}
                                    max={maxYear}
                                    value={sliderRange[1]}
                                    onChange={(event) => handleRangeInputChange(1, event.target.value)}
                                    disabled={autoZoom}
                                    className="w-full accent-accent"
                                />
                                <p className="text-sm text-ink/70">{sliderRange[1]}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-accent">Dekadenfilter</p>
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                        {sortedDecades.map((decade) => {
                            const count = decadeGroups[decade]?.length ?? 0;
                            const isActive = decade === activeDecade;
                            return (
                                <button
                                    key={decade}
                                    type="button"
                                    onClick={() => handleDecadeChange(decade)}
                                    className={`min-w-[150px] px-4 py-2 rounded-full border text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                                        isActive
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-parchment/40 text-ink/70 border-parchment-dark/50 hover:text-accent'
                                    }`}
                                >
                                    <span className="block">{formatDecadeLabel(decade)}</span>
                                    <span className={`text-xs font-normal mt-1 block ${isActive ? 'text-white/80' : 'text-ink/50'}`}>
                                        {count} {count === 1 ? 'Dokument' : 'Dokumente'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {paginatedDocs.length === 0 ? (
                    <div className="text-center py-10 text-ink/60">
                        Keine Dokumente in dieser Dekade.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedDocs.map((doc) => {
                            const preview = doc.images?.[0];
                            const previewSrc = typeof preview === 'string' ? preview : preview?.src || '';
                            const isSelected = doc.id === selectedDocumentId;
                            return (
                                <button
                                    key={doc.id}
                                    type="button"
                                    onClick={() => handleCardSelect(doc.id)}
                                    className={`text-left p-4 border rounded-sm bg-parchment/20 shadow-sm flex gap-4 hover:border-accent transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                                        isSelected ? 'border-accent ring-offset-2 bg-white' : 'border-parchment-dark/50'
                                    }`}
                                >
                                    <div className="w-20 h-20 rounded-sm bg-parchment/60 flex items-center justify-center overflow-hidden">
                                        {previewSrc ? (
                                            <img
                                                src={previewSrc}
                                                alt={doc.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-ink/30">
                                                Ohne Bild
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50">
                                            {doc.category}
                                        </p>
                                        <h3 className="text-lg font-serif font-bold text-ink line-clamp-2">
                                            {(doc.year && doc.year !== '') ? `${doc.year} · ` : ''}
                                            {doc.title}
                                        </h3>
                                        <p className="text-sm text-ink/70 line-clamp-2">
                                            {doc.location || 'Ohne Ort'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentDecadeDocs.length > PAGE_SIZE && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            className="px-4 py-2 text-sm border border-parchment-dark/50 rounded-sm hover:border-accent disabled:opacity-40"
                            disabled={page === 0}
                        >
                            Zurück
                        </button>
                        <p className="text-sm text-ink/60">
                            Seite {page + 1} von {totalPages}
                        </p>
                        <button
                            type="button"
                            onClick={handleNextPage}
                            className="px-4 py-2 text-sm border border-parchment-dark/50 rounded-sm hover:border-accent disabled:opacity-40"
                            disabled={page >= totalPages - 1}
                        >
                            Weiter
                        </button>
                    </div>
                )}
            </section>

            {selectedDocument && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.4em] text-accent">Ausgewähltes Ereignis</p>
                            <h2 className="text-3xl font-serif font-bold text-ink">{selectedDocument.title}</h2>
                        </div>
                        <RichTextContent
                            content={selectedDocument.description}
                            className="text-ink/70 leading-relaxed"
                            emptyFallback="Keine Beschreibung vorhanden."
                        />
                        <div className="flex flex-wrap gap-3 text-sm text-ink/60">
                            <span className="inline-flex items-center gap-2">
                                <Calendar size={16} className="text-accent" />
                                {selectedDocument.year}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <MapPin size={16} className="text-accent" />
                                {selectedDocument.location}
                            </span>
                            <span className="inline-flex px-3 py-1 rounded-full bg-parchment-dark text-ink text-xs uppercase tracking-wide">
                                {selectedDocument.category}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/document/${selectedDocument.id}`)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-sm shadow hover:bg-accent-dark transition-colors"
                            >
                                Dokument ansehen
                                <ArrowRight size={16} />
                            </button>
                            <Link
                                to="/archive"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-ink/20 text-ink/70 hover:text-accent hover:border-accent rounded-sm"
                            >
                                Weitere Dokumente
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <article className="bg-parchment/40 border border-parchment-dark rounded-sm p-6 space-y-4">
                        <h3 className="font-serif text-lg font-bold text-ink">Kurzinfo</h3>
                        <p className="text-sm text-ink/70 leading-relaxed">
                            {selectedDocument.transcription
                                ? 'Enthält Transkription und Bildmaterial.'
                                : 'Zusätzliche Materialien folgen.'}
                        </p>
                        {(() => {
                            const preview = selectedDocument.images?.[0];
                            const previewSrc = typeof preview === 'string' ? preview : preview?.src || '';
                            if (!previewSrc) {
                                return null;
                            }
                            return (
                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Vorschau</p>
                                    <img
                                        src={previewSrc}
                                        alt={`${selectedDocument.title} Vorschau`}
                                        className="w-full h-48 object-cover rounded-sm border border-parchment-dark"
                                    />
                                </div>
                            );
                        })()}
                    </article>
                </section>
            )}

            <div className="py-10 border-t border-parchment-dark/70">
                <MediaTimelineSection />
            </div>
        </div>
    );
};

export default TimelinePage;
