import React from 'react';
import { Link } from 'react-router-dom';
import { fetchDocuments } from '../services/api';
import DocumentCard from '../components/DocumentCard';

const STOP_WORDS = new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen',
    'und', 'oder', 'mit', 'von', 'im', 'in', 'am', 'an', 'auf', 'aus', 'für', 'ohne',
    'durch', 'zu', 'zum', 'zur', 'bei', 'nach', 'vor', 'hinter', 'über', 'unter',
    'historisches', 'wald', 'ort', 'orts', 'chronik', 'jahr', 'jahre', 'jahres',
    'kapitel', 'teil', 'band', 'aus', 'dem', 'der', 'das', 'eine'
]);

const sanitizeTitle = (title) => {
    if (!title) {
        return '';
    }
    return title
        .toLowerCase()
        .replace(/[^a-zäöüß0-9\s-]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const WordCloudPage = () => {
    const [documents, setDocuments] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [selectedWord, setSelectedWord] = React.useState(null);

    React.useEffect(() => {
        let ignore = false;
        const loadDocuments = async () => {
            try {
                const data = await fetchDocuments();
                if (!ignore) {
                    setDocuments(data);
                }
            } catch (err) {
                console.error('Failed to fetch documents', err);
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

    const wordCloud = React.useMemo(() => {
        const frequencies = new Map();
        approvedDocuments.forEach((doc) => {
            const sanitized = sanitizeTitle(doc.title);
            if (!sanitized) return;
            sanitized.split(' ').forEach((rawWord) => {
                const word = rawWord.trim();
                if (!word || word.length <= 2) return;
                if (STOP_WORDS.has(word)) return;
                const count = frequencies.get(word) || 0;
                frequencies.set(word, count + 1);
            });
        });
        const entries = Array.from(frequencies.entries())
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 120);
        return entries;
    }, [approvedDocuments]);

    const range = React.useMemo(() => {
        if (wordCloud.length === 0) {
            return { min: 0, max: 0 };
        }
        const counts = wordCloud.map((entry) => entry.count);
        return {
            min: Math.min(...counts),
            max: Math.max(...counts)
        };
    }, [wordCloud]);

    const matchingDocuments = React.useMemo(() => {
        if (!selectedWord) {
            return [];
        }
        return approvedDocuments.filter((doc) => sanitizeTitle(doc.title).includes(selectedWord));
    }, [approvedDocuments, selectedWord]);

    const getFontSize = (count) => {
        if (range.max === range.min) {
            return 24;
        }
        const minFont = 16;
        const maxFont = 52;
        const normalized = (count - range.min) / (range.max - range.min);
        return Math.round(minFont + normalized * (maxFont - minFont));
    };

    const handleWordToggle = (word) => {
        setSelectedWord((prev) => (prev === word ? null : word));
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-ink/60">Wortwolke wird geladen...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Wortwolke</h1>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (approvedDocuments.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Wortwolke</h1>
                <p className="text-ink/60">Noch keine freigegebenen Dokumente vorhanden.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 space-y-10">
            <header className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.5em] text-accent">Wortwolke</p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Titel auf einen Blick</h1>
                <p className="text-ink/70">
                    Die Größe der Wörter entspricht ihrer Häufigkeit in den Dokumenttiteln. Klicken Sie auf einen Begriff, um passende Dokumente zu sehen.
                </p>
            </header>

            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6">
                {wordCloud.length === 0 ? (
                    <p className="text-center text-ink/60">Keine geeigneten Schlagwörter gefunden.</p>
                ) : (
                    <div className="flex flex-wrap gap-3 justify-center">
                        {wordCloud.map(({ word, count }) => {
                            const fontSize = getFontSize(count);
                            const isSelected = selectedWord === word;
                            return (
                                <button
                                    key={word}
                                    type="button"
                                    onClick={() => handleWordToggle(word)}
                                    className={`font-serif tracking-wide transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${isSelected ? 'text-accent scale-110' : 'text-ink/70 hover:text-accent'}`}
                                    style={{ fontSize: `${fontSize}px` }}
                                    aria-pressed={isSelected}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-accent">Ergebnisse</p>
                        {selectedWord ? (
                            <h2 className="text-2xl font-serif font-bold text-ink">
                                {matchingDocuments.length} Dokumente enthalten „{selectedWord}“
                            </h2>
                        ) : (
                            <h2 className="text-2xl font-serif font-bold text-ink">Wählen Sie einen Begriff aus der Wortwolke.</h2>
                        )}
                    </div>
                    {selectedWord && (
                        <button
                            type="button"
                            onClick={() => setSelectedWord(null)}
                            className="text-sm px-4 py-2 border border-parchment-dark rounded-sm hover:border-accent"
                        >
                            Auswahl zurücksetzen
                        </button>
                    )}
                </div>

                {selectedWord ? (
                    matchingDocuments.length === 0 ? (
                        <p className="text-ink/60">Keine Dokumente gefunden.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchingDocuments.map((doc) => (
                                <DocumentCard key={doc.id} document={doc} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center text-ink/60">
                        <p>Tippen oder klicken Sie auf ein Wort, um passende Dokumente zu sehen.</p>
                        <p className="mt-2 text-sm">
                            Oder stöbern Sie direkt im <Link to="/archive" className="text-accent underline">Archiv</Link>.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default WordCloudPage;
