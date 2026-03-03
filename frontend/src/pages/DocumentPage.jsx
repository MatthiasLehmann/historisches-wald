import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, FileText, Bookmark, ScrollText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ImageGallery from '../components/ImageGallery';
import { fetchDocuments } from '../services/api';

const DocumentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [activePdf, setActivePdf] = React.useState(null);

    React.useEffect(() => {
        let ignore = false;
        const loadDocument = async () => {
            try {
                const docs = await fetchDocuments();
                if (!ignore) {
                    const found = docs.find((d) => d.id === id) ?? null;
                    setDocument(found);
                    if (!found) {
                        setError('Dokument nicht gefunden.');
                    }
                }
            } catch (err) {
                console.error('Failed to load document:', err);
                if (!ignore) {
                    setError('Dokument konnte nicht geladen werden.');
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        loadDocument();
        return () => {
            ignore = true;
        };
    }, [id]);

    const resolvePdfUrl = React.useCallback((pdf) => {
        if (!pdf) {
            return '';
        }
        if (pdf.file?.type === 'remote') {
            return pdf.file?.originalUrl || pdf.file?.path || '';
        }
        return pdf.file?.path || pdf.file?.originalUrl || '';
    }, []);

    const subcategories = React.useMemo(() => {
        if (!document) return [];
        if (Array.isArray(document.subcategories)) return document.subcategories;
        if (document.subcategory) return [document.subcategory];
        return [];
    }, [document]);

    const linkedPdfs = React.useMemo(() => {
        if (!document || !Array.isArray(document.pdfs)) {
            return [];
        }
        return document.pdfs
            .map((pdf) => ({
                ...pdf,
                url: resolvePdfUrl(pdf)
            }))
            .filter((pdf) => Boolean(pdf.url));
    }, [document, resolvePdfUrl]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-ink/60">Dokument wird geladen...</p>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-serif text-ink mb-4">{error || 'Dokument nicht gefunden'}</h2>
                <Link to="/archive" className="text-accent hover:underline">Zurück zum Archiv</Link>
            </div>
        );
    }

    return (
        <article className="container mx-auto px-4 py-8 max-w-5xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-ink/60 hover:text-accent mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Zurück</span>
            </button>

            <header className="mb-8 border-b border-parchment-dark pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                    <div>
                        <div className="flex flex-wrap gap-2 items-center mb-3">
                            <span className="inline-flex bg-accent/10 text-accent px-3 py-1 text-sm font-semibold rounded-full">
                                {document.category}
                            </span>
                            {subcategories.map((sub) => (
                                <span
                                    key={sub}
                                    className="inline-flex px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-parchment-dark text-ink rounded-full border border-parchment-dark/60"
                                >
                                    {sub}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink leading-tight">
                            {document.title}
                        </h1>
                    </div>
                    <div className="text-2xl font-serif font-bold text-ink/40">
                        {document.year}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white p-6 rounded-sm shadow-sm border border-parchment-dark">
                        <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-accent" />
                            Beschreibung
                        </h3>
                        <p className="text-ink/80 leading-relaxed text-lg font-serif">
                            {document.description}
                        </p>
                    </section>

                    {document.transcription && (
                        <section className="bg-white p-6 rounded-sm shadow-sm border border-parchment-dark">
                            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                                <ScrollText size={20} className="text-accent" />
                                Transkription
                            </h3>
                            <div className="prose prose-p:text-ink/80 prose-p:font-serif prose-headings:font-serif prose-headings:text-ink prose-strong:text-accent prose-strong:font-bold border-l-4 border-accent/20 pl-4 py-2 bg-parchment/20">
                                <ReactMarkdown>
                                    {Array.isArray(document.transcription)
                                        ? document.transcription.join('\n')
                                        : document.transcription}
                                </ReactMarkdown>
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="font-serif text-xl font-bold mb-4">Galerie</h3>
                        <ImageGallery images={document.images} title={document.title} />
                    </section>

                    {linkedPdfs.length > 0 && (
                        <section className="bg-white p-6 rounded-sm shadow-sm border border-parchment-dark">
                            <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-accent" />
                                Verknüpfte PDFs
                            </h3>
                            <div className="space-y-4">
                                {linkedPdfs.map((pdf) => (
                                    <article
                                        key={pdf.id || pdf.url}
                                        className="border border-parchment-dark rounded-sm p-4 space-y-3 bg-parchment/20"
                                    >
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-lg font-serif font-semibold text-ink">{pdf.title}</p>
                                                <p className="text-sm text-ink/70">
                                                    {pdf.year || 'Ohne Jahr'} · {pdf.location || 'Ohne Ort'}
                                                </p>
                                                <p className="text-xs text-ink/60 mt-1">
                                                    Quelle: {pdf.source || 'Unbekannt'} · Lizenz: {pdf.license || 'rights-reserved'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActivePdf(pdf)}
                                                className="px-4 py-2 text-sm font-semibold border border-accent text-accent rounded-sm hover:bg-accent hover:text-white transition"
                                            >
                                                PDF anzeigen
                                            </button>
                                        </div>
                                        <div className="border border-dashed border-parchment-dark/70 rounded-sm overflow-hidden bg-white">
                                            <iframe
                                                src={pdf.url}
                                                title={pdf.title}
                                                className="w-full h-64"
                                            />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-6">
                    <div className="bg-parchment-dark/20 p-6 rounded-sm border border-parchment-dark">
                        <h3 className="font-serif text-lg font-bold mb-4 border-b border-parchment-dark pb-2">Metadaten</h3>

                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="block text-ink/50 text-xs uppercase tracking-wider mb-1">Datum</span>
                                <div className="flex items-center gap-2 text-ink font-medium">
                                    <Calendar size={16} className="text-accent" />
                                    {document.year}
                                </div>
                            </div>

                            <div>
                                <span className="block text-ink/50 text-xs uppercase tracking-wider mb-1">Ort</span>
                                <div className="flex items-center gap-2 text-ink font-medium">
                                    <MapPin size={16} className="text-accent" />
                                    {document.location}
                                </div>
                            </div>

                            <div>
                                <span className="block text-ink/50 text-xs uppercase tracking-wider mb-1">Autor / Ersteller</span>
                                <div className="flex items-center gap-2 text-ink font-medium">
                                    <User size={16} className="text-accent" />
                                    {document.metadata.author}
                                </div>
                            </div>

                            <div>
                                <span className="block text-ink/50 text-xs uppercase tracking-wider mb-1">Quelle / Archiv</span>
                                <div className="flex items-center gap-2 text-ink font-medium">
                                    <Bookmark size={16} className="text-accent" />
                                    {document.metadata.source}
                                </div>
                            </div>

                            <div>
                                <span className="block text-ink/50 text-xs uppercase tracking-wider mb-1">Zustand</span>
                                <div className="text-ink/80 italic">
                                    {document.metadata.condition}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
            {activePdf && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border border-parchment-dark relative">
                        <button
                            type="button"
                            className="absolute top-3 right-3 text-ink/70 hover:text-accent"
                            onClick={() => setActivePdf(null)}
                            aria-label="PDF schließen"
                        >
                            <X size={20} />
                        </button>
                        <header className="px-6 py-4 border-b border-parchment-dark">
                            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">PDF Vorschau</p>
                            <h4 className="text-xl font-serif font-bold text-ink">{activePdf.title}</h4>
                        </header>
                        <div className="h-[70vh]">
                            <iframe
                                src={activePdf.url}
                                title={activePdf.title}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-parchment-dark">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm border border-parchment-dark rounded-sm hover:bg-parchment/40"
                                onClick={() => setActivePdf(null)}
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default DocumentPage;
