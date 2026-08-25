import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Map, Users, WholeWord } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import DocumentCard from '../components/DocumentCard';
import { fetchDocuments } from '../services/api';
import logo from '../assets/logo-historisches-wald.png';

const discoveryLinks = [
    {
        title: 'Archiv',
        description: 'Dokumente, Urkunden und Fotografien nach Themen und Orten durchsuchen.',
        path: '/archive',
        icon: FileText,
    },
    {
        title: 'Ortsteile',
        description: 'Die Teilorte von Wald über Wappen, Ortsprofile und passende Dokumente erkunden.',
        path: '/ortsteile',
        icon: Map,
    },
    {
        title: 'Zeitleiste',
        description: 'Historische Ereignisse und Dokumente chronologisch entdecken.',
        path: '/timeline',
        icon: Clock,
    },
    {
        title: 'Wortwolke',
        description: 'Häufige Begriffe aus dem Archiv als visuellen Einstieg nutzen.',
        path: '/wortwolke',
        icon: WholeWord,
    },
    {
        title: 'Team',
        description: 'Menschen und Arbeit hinter dem digitalen Archiv kennenlernen.',
        path: '/team',
        icon: Users,
    },
];

const districtHighlights = [
    {
        name: 'Wald',
        image: '/files/images/thumbnails/photo-54854142452-thumb.jpg',
        description: 'Kloster, Dorfgeschichte und zentrale Dokumente zur Gemeinde Wald.'
    },
    {
        name: 'Glashütte',
        image: '/files/images/thumbnails/photo-54855252744-thumb.jpg',
        description: 'Ortsprofil mit Wappen, Glasgeschichte und verknüpften Quellen.'
    },
    {
        name: 'Walbertsweiler',
        image: '/files/images/thumbnails/photo-54854142442-thumb.jpg',
        description: 'Einer der ältesten Teilorte mit passenden Archivbeiträgen.'
    }
];

const Home = () => {
    const [documents, setDocuments] = React.useState([]);
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
        () => documents.filter((doc) => doc?.review?.status === 'approved' && doc?.showInArchive !== false),
        [documents]
    );

    const recentDocuments = React.useMemo(() => approvedDocuments.slice(0, 3), [approvedDocuments]);

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
                            Willkommen auf unserer Homepage, auf der die Geschichte der zehn Ortsteile der Gemeinde Wald / Hohenzollern zum Leben erwacht.
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

            <section className="py-16 bg-parchment border-b border-parchment-dark/60">
                <div className="container mx-auto px-4">
                    <div className="mb-14">
                        <h2 className="mb-5 font-serif text-3xl font-bold text-ink md:text-4xl">
                            Historisches Wald - Gemeinsam für die Geschichte unserer Heimat
                        </h2>
                        <div className="space-y-4 text-lg leading-relaxed text-ink/75">
                            <p>
                                Hier findest du erste Beiträge, Geschichten, Bilder, Erzählungen und Auszüge oder Hinweise auf Literatur und kannst gerne selbst etwas beitragen.
                                Vieles wurde uns freundlicherweise zur Verfügung gestellt, einiges stammt aus Veröffentlichungen, manches wurde ergänzt.
                                Weiteres Material und Beiträge sind herzlich willkommen!
                            </p>
                            <p>
                                Unser Ziel ist es, durch die Veröffentlichung des gesammelten Materials das historische Erbe unserer Gemeinde zu bewahren und die gesammelten Bilder und das erhaltene Wissen allen zugänglich zu machen.
                                Auf diese Weise soll diese Sammlung stetig wachsen und für uns alle immer interessanter werden.
                            </p>
                        </div>
                    </div>
                    <div className="mb-14 flex items-center gap-4" aria-hidden="true">
                        <div className="h-px flex-1 bg-parchment-dark"></div>
                        <div className="h-1.5 w-20 rounded-full bg-accent"></div>
                        <div className="h-px flex-1 bg-parchment-dark"></div>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
                        <div className="space-y-5">
                            <p className="text-xs uppercase tracking-[0.45em] text-accent">Ortsteile</p>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink">Die Teilorte von Wald erkunden</h2>
                            <p className="text-ink/70 leading-relaxed">
                                Die Ortsteilübersicht verbindet Wappen, Ortsprofile und passende Dokumente. So finden Sie Beiträge direkt über Wald, Glashütte, Walbertsweiler und die weiteren Teilorte.
                            </p>
                            <Link
                                to="/ortsteile"
                                className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
                            >
                                Ortsteile öffnen <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {districtHighlights.map((district) => (
                                <Link
                                    key={district.name}
                                    to="/ortsteile"
                                    className="group overflow-hidden rounded-sm border border-parchment-dark bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                                >
                                    <div className="aspect-[4/3] bg-parchment">
                                        <img
                                            src={district.image}
                                            alt={`${district.name} Wappen`}
                                            className="h-full w-full object-contain p-5 transition group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="space-y-2 border-t border-parchment-dark/60 p-4">
                                        <h3 className="font-serif text-lg font-bold text-ink">{district.name}</h3>
                                        <p className="text-sm leading-relaxed text-ink/70">{district.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-parchment-light border-b border-parchment-dark/60">
                <div className="container mx-auto px-4">
                    <div className="mb-10 max-w-3xl">
                        <p className="text-xs uppercase tracking-[0.45em] text-accent mb-3">Entdecken</p>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-3">Alle Bereiche auf einen Blick</h2>
                        <p className="text-ink/70">
                            Wählen Sie den passenden Einstieg in das Archiv: nach Dokumenten, Zeit, Ortsteilen oder über die Menschen hinter dem Projekt.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                        {discoveryLinks.map(({ title, description, path, icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className="group flex h-full flex-col justify-between rounded-sm border border-parchment-dark bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                            >
                                <div className="space-y-4">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-parchment-dark bg-parchment text-accent transition group-hover:bg-accent group-hover:text-white">
                                        {React.createElement(icon, { size: 21 })}
                                    </span>
                                    <div className="space-y-2">
                                        <h3 className="font-serif text-xl font-bold text-ink">{title}</h3>
                                        <p className="text-sm leading-relaxed text-ink/70">{description}</p>
                                    </div>
                                </div>
                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                                    Öffnen <ArrowRight size={15} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="py-20 bg-parchment">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink mb-4">Neue Beiträge</h2>
                        <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
                        <p className="mt-4 text-ink/60">Entdecken Sie aktuelle Fundstücke aus unserer Sammlung.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {error ? (
                            <p className="col-span-full text-center text-red-600">{error}</p>
                        ) : isLoading ? (
                            <p className="col-span-full text-center text-ink/60">Dokumente werden geladen...</p>
                        ) : recentDocuments.length > 0 ? (
                            recentDocuments.map((doc) => (
                                <DocumentCard key={doc.id} document={doc} />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-ink/50">Noch keine Dokumente vorhanden.</p>
                        )}
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

        </>
    );
};

export default Home;
