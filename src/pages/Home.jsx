import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import DocumentCard from '../components/DocumentCard';
import Timeline from '../components/Timeline';
import documentsData from '../data/documents.json';
import logo from '../assets/logo-historisches-wald.png';

const Home = () => {
    const navigate = useNavigate();
    // Get latest 3 documents
    const recentDocuments = documentsData.slice(0, 3);
    const events = documentsData.map(({ id, title, year, category }) => ({ id, title, year, category }));

    const handleEventClick = (event) => {
        navigate(`/document/${event.id}`);
    };

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-ink text-parchment">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <img
                        src={logo}
                        alt="Historisches Wald Hintergrund"
                        className="w-full h-full object-cover opacity-60 sepia-[.3]"
                    />
                </div>

                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
                    <Motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >

                        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-tight">
                            Tauchen Sie ein in die <br />
                            <span className="text-accent italic">Geschichte von Wald</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-light mb-10 text-parchment/80 leading-relaxed max-w-2xl mx-auto">
                            Ein digitales Archiv für historische Dokumente, Urkunden und Fotografien aus vergangenen Jahrhunderten.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/archive"
                                className="px-8 py-4 bg-accent text-white font-bold rounded-sm shadow-lg hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                            >
                                Archiv durchsuchen <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="/timeline"
                                className="px-8 py-4 bg-transparent border border-parchment text-parchment font-bold rounded-sm hover:bg-parchment/10 transition-colors"
                            >
                                Zeitleiste ansehen
                            </Link>
                        </div>
                    </Motion.div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="py-20 bg-parchment">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-4">Ausgewählte Dokumente</h2>
                        <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
                        <p className="mt-4 text-ink/60">Entdecken Sie besondere Fundstücke aus unserer Sammlung.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {recentDocuments.map((doc) => (
                            <DocumentCard key={doc.id} document={doc} />
                        ))}
                    </div>

                    <div className="text-center">
                        <Link
                            to="/archive"
                            className="inline-flex items-center gap-2 text-ink/70 hover:text-accent font-semibold border-b-2 border-transparent hover:border-accent transition-all pb-1"
                        >
                            Alle Dokumente anzeigen <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Timeline Teaser */}
            <section className="py-20 bg-white border-y border-parchment-dark/50">
                <div className="container mx-auto px-4 mb-8 text-center">
                    <h2 className="text-3xl font-serif font-bold text-ink">Geschichte im Zeitverlauf</h2>
                </div>
                <Timeline events={events} onSelectEvent={handleEventClick} />
            </section>
        </>
    );
};

export default Home;
