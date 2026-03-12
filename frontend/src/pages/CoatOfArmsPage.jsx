import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import { fetchDocuments } from '../services/api';

const COAT_OF_ARMS = [
    {
        slug: 'wald',
        name: 'Wald',
        image: '/files/images/thumbnails/photo-54854142452-thumb.jpg',
        keywords: ['wald']
    },
    {
        slug: 'glashuette',
        name: 'Glashütte',
        image: '/files/images/thumbnails/photo-54855252744-thumb.jpg',
        keywords: ['glashütte', 'glashuette']
    },
    {
        slug: 'walbertsweiler',
        name: 'Walbertsweiler',
        image: '/files/images/thumbnails/photo-54854142442-thumb.jpg',
        keywords: ['walbertsweiler']
    },
    {
        slug: 'reischach',
        name: 'Reischach',
        image: '/files/images/thumbnails/photo-54855252694-thumb.jpg',
        keywords: ['reischach']
    },
    {
        slug: 'sentenhart',
        name: 'Sentenhart',
        image: '/files/images/thumbnails/photo-54855313110-thumb.jpg',
        keywords: ['sentenhart']
    },
    {
        slug: 'ruhestetten',
        name: 'Ruhestetten',
        image: '/files/images/thumbnails/photo-54854142447-thumb.jpg',
        keywords: ['ruhestetten']
    },
    {
        slug: 'rothenlachen',
        name: 'Rothenlachen',
        image: '/files/images/thumbnails/photo-54854142482-thumb.jpg',
        keywords: ['rothenlachen']
    },
    {
        slug: 'riedetsweiler',
        name: 'Riedetsweiler',
        image: '/files/images/thumbnails/photo-54855313150-thumb.jpg',
        keywords: ['riedetsweiler']
    },
    {
        slug: 'kappel',
        name: 'Kappel',
        image: '/files/images/thumbnails/photo-54854142572-thumb.jpg',
        keywords: ['kappel']
    },
    {
        slug: 'hippetsweiler',
        name: 'Hippetsweiler',
        image: '/files/images/thumbnails/photo-54855252739-thumb.jpg',
        keywords: ['hippetsweiler']
    }
];

const normalize = (value) => (value || '').toString().toLowerCase();

const CoatOfArmsPage = () => {
    const [documents, setDocuments] = React.useState([]);
    const [selectedSlug, setSelectedSlug] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

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

    const selectedTown = React.useMemo(
        () => COAT_OF_ARMS.find((entry) => entry.slug === selectedSlug) ?? null,
        [selectedSlug]
    );

    const matchingDocuments = React.useMemo(() => {
        if (!selectedTown) {
            return [];
        }
        const searchText = approvedDocuments.map((doc) => ({
            doc,
            haystack: normalize(
                [
                    doc.title,
                    doc.location,
                    doc.category,
                    Array.isArray(doc.subcategories) ? doc.subcategories.join(' ') : doc.subcategory,
                    doc.description
                ]
                    .filter(Boolean)
                    .join(' ')
            )
        }));

        return searchText
            .filter(({ haystack }) =>
                selectedTown.keywords.some((keyword) => haystack.includes(keyword))
            )
            .map(({ doc }) => doc);
    }, [approvedDocuments, selectedTown]);

    const handleSelect = (slug) => {
        setSelectedSlug((prev) => (prev === slug ? null : slug));
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-ink/60">Wappenübersicht wird geladen...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Wappen</h1>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 space-y-10">
            <header className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.5em] text-accent">Teilorte</p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Wappen von Wald</h1>
                <p className="text-ink/70">
                    Wählen Sie ein Wappen aus, um Dokumente des jeweiligen Teilorts anzuzeigen. Jedes Wappen führt zu freigegebenen Dokumenten mit passenden Ortsangaben.
                </p>
            </header>

            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {COAT_OF_ARMS.map((entry) => {
                        const isActive = entry.slug === selectedSlug;
                        return (
                            <button
                                key={entry.slug}
                                type="button"
                                onClick={() => handleSelect(entry.slug)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-sm border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                    isActive ? 'border-accent bg-parchment/40' : 'border-parchment-dark/40 hover:border-accent'
                                }`}
                            >
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-parchment-dark bg-parchment flex items-center justify-center">
                                    <img
                                        src={entry.image}
                                        alt={`${entry.name} Wappen`}
                                        className="w-full h-full object-contain p-2"
                                        loading="lazy"
                                    />
                                </div>
                                <p className={`text-sm font-semibold uppercase tracking-wide ${isActive ? 'text-accent' : 'text-ink/80'}`}>
                                    {entry.name}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-accent">Dokumente</p>
                        {selectedTown ? (
                            <h2 className="text-2xl font-serif font-bold text-ink">
                                {matchingDocuments.length} Dokumente aus {selectedTown.name}
                            </h2>
                        ) : (
                            <h2 className="text-2xl font-serif font-bold text-ink">Bitte wählen Sie einen Teilort.</h2>
                        )}
                    </div>
                    {selectedTown && (
                        <button
                            type="button"
                            onClick={() => setSelectedSlug(null)}
                            className="px-4 py-2 text-sm border border-parchment-dark rounded-sm hover:border-accent"
                        >
                            Auswahl zurücksetzen
                        </button>
                    )}
                </div>

                {!selectedTown ? (
                    <p className="text-center text-ink/60">Tippen oder klicken Sie auf ein Wappen, um passende Dokumente zu sehen.</p>
                ) : matchingDocuments.length === 0 ? (
                    <p className="text-center text-ink/60">Keine Dokumente für diesen Teilort gefunden.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matchingDocuments.map((doc) => (
                            <DocumentCard key={doc.id} document={doc} />
                        ))}
                    </div>
                )}
            </section>

            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 space-y-4">
                <h3 className="text-xl font-serif font-bold text-ink">Über die Teilorte</h3>
                <p className="text-sm text-ink/70 leading-relaxed">
                    Wald besteht aus zehn Teilorten: Wald, Glashütte, Walbertsweiler, Reischach, Sentenhart, Ruhestetten, Rothenlachen, Riedetsweiler, Kappel und Hippetsweiler. Jeder Ort besitzt ein eigenes Wappen, das seine Geschichte und Identität widerspiegelt.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-ink/70">
                    {COAT_OF_ARMS.map((entry) => (
                        <div key={entry.slug} className="flex items-center gap-2">
                            <Calendar size={14} className="text-accent" />
                            <span>{entry.name}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-ink/50 flex items-center gap-2">
                    <MapPin size={12} />
                    Quellen: Album „700_Wappen“ und freigegebene Dokumente des Archivs.
                </p>
            </section>
        </div>
    );
};

export default CoatOfArmsPage;
