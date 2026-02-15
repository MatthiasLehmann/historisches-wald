import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, FileText, Bookmark, ScrollText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ImageGallery from '../components/ImageGallery';
import documentsData from '../data/documents.json';

const DocumentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const document = documentsData.find(d => d.id === id);

    if (!document) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-serif text-ink mb-4">Dokument nicht gefunden</h2>
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
                        <span className="inline-block bg-accent/10 text-accent px-3 py-1 text-sm font-semibold rounded-full mb-2">
                            {document.category}
                            {document.subcategory && (
                                <span className="opacity-70"> • {document.subcategory}</span>
                            )}
                        </span>
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
        </article>
    );
};

export default DocumentPage;
