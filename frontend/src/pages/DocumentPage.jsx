import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, ExternalLink, FileText, ListTree, ScrollText } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import RichTextContent from '../components/RichTextContent';
import { fetchDocuments } from '../services/api';

const formatLicenseLabel = (license) => (!license || license === 'rights-reserved' ? 'Rechte vorbehalten' : license);
const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

const toPlainText = (value) => {
    if (value == null) {
        return '';
    }
    const normalized = typeof value === 'string'
        ? value
        : Array.isArray(value)
            ? value.join('\n')
            : String(value);
    const withoutTags = HTML_PATTERN.test(normalized)
        ? normalized.replace(/<[^>]+>/g, ' ')
        : normalized;
    return withoutTags
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const isArchiveVisible = (doc) => doc?.review?.status === 'approved' && doc?.showInArchive !== false;

const sortDocuments = (documents = []) =>
    [...documents].sort((left, right) => {
        const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : 0;
        const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : 0;
        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }
        return String(left.title || '').localeCompare(String(right.title || ''), 'de', { sensitivity: 'base' });
    });

const buildChapterTree = (documents = [], parentId = '', prefix = '') => {
    const children = sortDocuments(
        documents.filter((doc) => String(doc.parent_id || '') === String(parentId) && isArchiveVisible(doc))
    );

    return children.map((child, index) => {
        const chapterNumber = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        return {
            ...child,
            chapterNumber,
            children: buildChapterTree(documents, child.id, chapterNumber)
        };
    });
};

const flattenChapters = (chapters = []) =>
    chapters.flatMap((chapter) => [chapter, ...flattenChapters(chapter.children)]);

const ChapterToc = ({ chapters }) => (
    <ol className="space-y-2">
        {chapters.map((chapter) => (
            <li key={chapter.id}>
                <Link
                    to={`/document/${chapter.id}`}
                    className="flex gap-3 rounded-sm border border-parchment-dark/70 bg-white px-3 py-2 text-sm hover:border-accent hover:text-accent"
                >
                    <span className="shrink-0 font-semibold text-accent">{chapter.chapterNumber}</span>
                    <span className="min-w-0 truncate">{chapter.title}</span>
                </Link>
                {chapter.children.length > 0 && (
                    <div className="mt-2 border-l border-parchment-dark/70 pl-4">
                        <ChapterToc chapters={chapter.children} />
                    </div>
                )}
            </li>
        ))}
    </ol>
);

const ChapterList = ({ chapters }) => (
    <div className="space-y-4">
        {chapters.map((chapter) => {
            const preview = toPlainText(chapter.description) || 'Keine Kurzfassung vorhanden.';
            return (
                <article key={chapter.id} className="rounded-sm border border-parchment-dark bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                                Kapitel {chapter.chapterNumber}
                            </p>
                            <h4 className="mt-1 font-serif text-xl font-bold text-ink">
                                <Link to={`/document/${chapter.id}`} className="hover:text-accent">
                                    {chapter.title}
                                </Link>
                            </h4>
                            <p className="mt-2 text-sm text-ink/70 line-clamp-2">{preview}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 text-xs text-ink/60">
                            <span className="rounded-sm border border-parchment-dark bg-parchment/40 px-2 py-1">
                                {chapter.year || 'Ohne Jahr'}
                            </span>
                            <span className="rounded-sm border border-parchment-dark bg-parchment/40 px-2 py-1">
                                {chapter.category || 'Ohne Kategorie'}
                            </span>
                        </div>
                    </div>
                    {chapter.children.length > 0 && (
                        <div className="mt-4 border-l border-parchment-dark/70 pl-4">
                            <ChapterList chapters={chapter.children} />
                        </div>
                    )}
                </article>
            );
        })}
    </div>
);

const DocumentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = React.useState(null);
    const [documents, setDocuments] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let ignore = false;
        const loadDocument = async () => {
            try {
                const docs = await fetchDocuments();
                if (!ignore) {
                    const found = docs.find((d) => d.id === id) ?? null;
                    setDocuments(docs);
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

    const childChapters = React.useMemo(() => {
        if (!document) return [];
        return buildChapterTree(documents, document.id);
    }, [documents, document]);

    const chapterCount = React.useMemo(() => flattenChapters(childChapters).length, [childChapters]);

    const parentDocument = React.useMemo(() => {
        if (!document?.parent_id) return null;
        const parent = documents.find((doc) => doc.id === document.parent_id);
        return isArchiveVisible(parent) ? parent : null;
    }, [documents, document]);

    const hasDescription = React.useMemo(
        () => Boolean(toPlainText(document?.description)),
        [document]
    );

    const hasTranscription = React.useMemo(
        () => Boolean(toPlainText(document?.transcription)),
        [document]
    );

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

    const metadataSource = document.metadata?.source?.trim() || 'Unbekannt';
    const metadataYear = document.year || 'Ohne Jahr';
    const coverImage = document.coverImage;
    const coverSrc = typeof coverImage === 'string' ? coverImage : coverImage?.src || '';
    return (
        <article className="container mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-ink/60 hover:text-accent mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Zurück</span>
            </button>

            <header className="mb-8 border-b border-parchment-dark pb-8">
                <div className={`grid gap-6 ${coverSrc ? 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-start' : ''}`}>
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 items-center">
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
                        {parentDocument && (
                            <Link
                                to={`/document/${parentDocument.id}`}
                                className="inline-flex items-center gap-2 rounded-sm border border-parchment-dark bg-white px-3 py-2 text-sm font-semibold text-ink/70 hover:border-accent hover:text-accent"
                            >
                                <BookOpen size={16} />
                                Teil von: {parentDocument.title}
                            </Link>
                        )}
                        <div>
                            <p className="text-4xl font-serif font-bold text-ink/50">
                                {metadataYear}
                            </p>
                            <p className="text-sm text-ink/60 mt-2">
                                Quelle: <span className="font-semibold text-ink">{metadataSource}</span>
                            </p>
                        </div>
                    </div>

                    {coverSrc && (
                        <figure className="overflow-hidden rounded-sm border border-parchment-dark bg-white shadow-sm">
                            <div className="flex h-72 items-center justify-center bg-parchment/40 p-3 sm:h-80 lg:h-[340px]">
                                <img
                                    src={coverSrc}
                                    alt={coverImage?.title || `${document.title} Beitragsbild`}
                                    className="max-h-full max-w-full object-contain sepia-[.1]"
                                />
                            </div>
                            {coverImage?.title && (
                                <figcaption className="border-t border-parchment-dark/60 bg-parchment/30 px-4 py-2 text-sm text-ink/70">
                                    {coverImage.title}
                                </figcaption>
                            )}
                        </figure>
                    )}
                </div>
            </header>
            <div className="space-y-10">
                {hasDescription && (
                    <section className="bg-white p-6 rounded-sm shadow-sm border border-parchment-dark">
                        <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-accent" />
                            Kurzfassung
                        </h3>
                        <RichTextContent
                            content={document.description}
                            className="prose-lg text-ink/80 prose-headings:font-serif"
                        />
                    </section>
                )}

                {hasTranscription && (
                    <section className="bg-white p-6 rounded-sm shadow-sm border border-parchment-dark">
                        <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                            <ScrollText size={20} className="text-accent" />
                            Abschrift
                        </h3>
                        <div className="border-l-4 border-accent/20 pl-4 py-2 bg-parchment/20 rounded-sm">
                            <RichTextContent
                                content={document.transcription}
                                className="prose prose-sm text-ink/80"
                            />
                        </div>
                    </section>
                )}

                {childChapters.length > 0 && (
                    <section className="rounded-sm border border-parchment-dark bg-parchment/30 p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h3 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
                                    <ListTree size={22} className="text-accent" />
                                    Dossier und Kapitel
                                </h3>
                                <p className="mt-2 text-sm text-ink/70">
                                    Dieses Dokument bündelt {chapterCount} untergeordnete {chapterCount === 1 ? 'Dokument' : 'Dokumente'} als Kapitelstruktur.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                            <aside className="rounded-sm border border-parchment-dark bg-parchment/40 p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink/50">
                                    Inhaltsverzeichnis
                                </p>
                                <ChapterToc chapters={childChapters} />
                            </aside>
                            <div>
                                <ChapterList chapters={childChapters} />
                            </div>
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
                                                Quelle: {pdf.source || 'Unbekannt'} · Lizenz: {formatLicenseLabel(pdf.license)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                to={`/pdfs/${pdf.id}/view`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-accent text-accent rounded-sm hover:bg-accent hover:text-white transition"
                                            >
                                                <ExternalLink size={16} />
                                                PDF anzeigen
                                            </Link>
                                            <a
                                                href={pdf.url}
                                                download
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-parchment-dark text-ink rounded-sm hover:bg-white transition"
                                            >
                                                <Download size={16} />
                                                Herunterladen
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </article>
    );
};

export default DocumentPage;
