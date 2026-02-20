import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Timeline from '../components/Timeline';
import documentsData from '../data/documents.json';

const TimelinePage = () => {
    const navigate = useNavigate();
    const events = React.useMemo(() => (
        documentsData.map(({ id, title, year, category }) => ({ id, title, year, category }))
            .sort((a, b) => a.year - b.year)
    ), []);

    const [selectedEventId, setSelectedEventId] = React.useState(() => events[0]?.id ?? null);

    const selectedDocument = React.useMemo(() => (
        documentsData.find((doc) => doc.id === selectedEventId) ?? null
    ), [selectedEventId]);

    if (events.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl font-serif font-bold mb-4">Zeitleiste</h1>
                <p className="text-ink/60">Momentan sind noch keine Ereignisse verfügbar.</p>
            </div>
        );
    }

    const handleSelectEvent = (event) => {
        setSelectedEventId(event.id);
    };

    return (
        <div className="container mx-auto px-4 py-10 space-y-12">
            <header className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.5em] text-accent">Zeitleiste</p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Geschichte im Überblick</h1>
                <p className="text-ink/70">
                    Blättern Sie chronologisch durch Urkunden, Chroniken und Zeitzeugenberichte. Ein Klick auf ein Ereignis zeigt Details und führt zur vollständigen Dokumentansicht.
                </p>
            </header>

            <section className="bg-white border border-parchment-dark rounded-sm shadow-sm">
                <Timeline events={events} onSelectEvent={handleSelectEvent} />
            </section>

            {selectedDocument && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.4em] text-accent">Ausgewähltes Ereignis</p>
                            <h2 className="text-3xl font-serif font-bold text-ink">{selectedDocument.title}</h2>
                        </div>
                        <p className="text-ink/70 leading-relaxed">
                            {selectedDocument.description}
                        </p>
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
                        {selectedDocument.images?.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Vorschau</p>
                                <img
                                    src={selectedDocument.images[0]}
                                    alt={`${selectedDocument.title} Vorschau`}
                                    className="w-full h-48 object-cover rounded-sm border border-parchment-dark"
                                />
                            </div>
                        )}
                    </article>
                </section>
            )}
        </div>
    );
};

export default TimelinePage;
