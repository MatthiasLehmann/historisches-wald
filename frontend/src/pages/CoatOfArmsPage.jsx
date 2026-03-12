import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import { fetchDocuments } from '../services/api';

const COAT_OF_ARMS = [
    {
        slug: 'wald',
        name: 'Wald',
        image: '/files/images/thumbnails/photo-54854142452-thumb.jpg',
        heroImage: '/files/images/wald_54854142452_o.jpg',
        keywords: ['wald'],
        description: 'Die erste Erwähnung erfuhr das Dorf, als der Stauferkönig Philipp von Schwaben die Vogtei Wald an die Brüder von Fronhofen verkaufte. Dieser undatierte Verkauf muss spätestens im Jahr 1208 stattgefunden haben, dem Todesjahr des Stauferkönigs. Bald darauf haben die Brüder dann Wald an die Herren von Balbe verkauft, die es wiederum an den kaiserlichen Ministerialen Burkhard von Weckenstein verkauften. Dieser gründete hier im Jahre 1212 für seine beiden Schwestern Judinta und Ita das Kloster Wald. Die Geschichte des Dorfes lief parallel zu der des Klosters. 1783 wurde Wald vorderösterreichische Provinz. 1806 wurde das Kloster aufgelöst und sein Territorium fiel an das Fürstentum Hohenzollern-Sigmaringen. Die klösterliche Gemeinschaft bestand noch bis Anfang der 1850er Jahre, sie lebte von Pensionen des Fürsten.  Unmittelbar nach der Inbesitznahme der Klosterherrschaft Wald durch das Fürstentum Hohenzollern-Sigmaringen, wurde in Wald ein fürstliches Oberamt, mit Sitz in den Klostergebäuden errichtet. Als das Fürstentum als Hohenzollernsche Lande 1850 an Preußen fiel, wurde das hohenzollerische Oberamt Wald bis zu seiner Aufhebung 1861 preußisch. Auch wurde das Dorf Sitz eines eigenen Amtsgerichts, das auch im Klostergebäude untergebracht war. 1862 wurde das Oberamt Wald dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde. Im Zuge der Gemeinde-gebietsreform in Baden-Württemberg wurden neun umliegende Gemeinden nach Wald eingemeindet. So kamen zum 1. Januar 1971 Hippetsweiler, Riedetsweiler und Rothenlachen zur Gemeinde. Zum 1. Juni 1972 folgte Reischach und zum 1. Januar 1973 das früher badische Sentenhart. Die Reihe der Eingemeindungen wurde am 1. Januar 1975 mit der Eingliederung von Glashütte, Kappel, Ruhestetten und Walbertsweiler abgeschlossen.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Vorne in schwarz ist ein doppelreihig, rot-silbern geschachter Schrägbalken zu sehen. Hinten in silber zeigt das Wappen auf grünem Dreiberg eine rote Raute (Weck). Das ist das Wappen des ehemaligen, 1212 von Burkart von Weckenstein gestifteten Zisterzienserinnenklosters Wald. Es enthält in der vorderen Schildhälfte das Wappen des Zisterzienserordens, in der hinteren das redende Stifterwappen. Um nicht gegen die heraldischen Farbregeln zu verstoßen, wurden die Farben des Stifterwappens umgekehrt.'
    },
    {
        slug: 'glashuette',
        name: 'Glashütte',
        image: '/files/images/thumbnails/photo-54855252744-thumb.jpg',
        heroImage: '/files/images/glashtte_54855252744_o.jpg',
        keywords: ['glashütte', 'glashuette'],
        description: 'Funde von Steinbeilen und Gefäßen bei Glashütte lassen vermuten, dass bereits gegen Ende des dritten Jahrtausends v. Chr. und in der Spätjungsteinzeit in dieser Gegend Menschen gelebt haben. Glashütte wurde 1701 auf Besitz des Klosters Wald gegründet. Besitzer und Förderer der Glashütte waren die Herren von Schmidsfeld. In jenem Jahr erlaubte die Äbtissin Maria Jacobina Freifrau von Bodmann dem Glasmeister Abraham Schmid aus Liptingen den Aufbau einer Glashütte bei den günstigen Quarzsandvorkommen in der Moränenlandschaft auf Otterswanger Gemarkung. Mit Zustimmung des Jagdherren Meinrad II. Fürst von Hohenzollern-Sigmaringen durfte Schmid das Holz der Waldgebiete nutzen. Die Hütte war der einzige vorindustrielle Betrieb im gesamten Oberamt Wald. Der Betrieb dauerte, mit Unterbrechungen, bis 1881. Im Umfeld der Glashütte entwickelte sich die gleichnamige Siedlung. Im Jahr 1785 zählte das Dorf zwölf Häuser. Zur Gemeinde im rechtlichen Sinne wurde das Dorf erst 1830 erhoben. 1806 fiel Glashütte durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Glashütte gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde. Am 1. Januar 1975 wurde der selbständige Ort Glashütte in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Im schwarzen Teil befindet sich ein doppelreihiger rot-silbern geschachter Schrägbalken. Hinten in gold ist ein kelchförmiges rotes Glas zu sehen. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Das Glas weist darauf hin, dass der Ort seine Entstehung der hier vom Kloster Wald im Jahre 1701 ins Leben gerufenen Glashütte verdankt.Die klaren, geometrischen Formen erinnern an Glasbläserkunst und an das Feuer, das einst den Ort prägte.'
    },
    {
        slug: 'walbertsweiler',
        name: 'Walbertsweiler',
        image: '/files/images/thumbnails/photo-54854142442-thumb.jpg',
        heroImage: '/files/images/walbertsweiler_54854142442_o.jpg',
        keywords: ['walbertsweiler'],
        description: 'Erstmals genannt wurde das Dorf im Jahr 854 in den Urkunden des Klosters Sankt Gallen. Somit ist Walbertsweiler, der Erwähnung nach, der älteste Teilort der Zehn-Dörfer-Gemeinde. In der zweiten Hälfte des 13. Jahrhunderts ging der größte Teil des Ortes aus dem Besitz eines Herren von Kallenberg an das Kloster Wald über. Ein weiterer Teil wurde von Kloster Wald von den Herren von Reischach erworben. 1806 fiel Walbertsweiler durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Walbertsweiler gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde. Am 1. Januar 1975 wurde die selbständige Gemeinde Walbertsweiler in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem zweimal gespaltenen Schild in schwarz, gold und blau. Im schwarzen Teil befindet sich ein doppelreihiger rot-silbern geschachter Schrägbalken. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Einen von gold und blau gespaltenen Schild führten die Herren von Kallenberg als Wappen'
    },
    {
        slug: 'reischach',
        name: 'Reischach',
        image: '/files/images/thumbnails/photo-54855252694-thumb.jpg',
        heroImage: '/files/images/reischach_54855252694_o.jpg',
        keywords: ['reischach'],
        description: 'Erstmals genannt wurde das Dorf im Jahr 1191 mit dem Auftreten eines Ulrich von Reischach. Besitze oder Rechte im Ort hatte zu Beginn des 13. Jahrhunderts das Kloster Salem. Im 13. Jahrhundert war das Dorf im Besitz der gleichnamigen Herren von Reischach und kommt um die Mitte desselben größenteils an das Kloster Wald. 1806 fiel Reischach durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Reischach gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde. Am 1. Januar 1975 wurde der selbständige Ort Reischach in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Im schwarzen Teil befindet sich ein doppelreihiger rot-silbern geschachter Schrägbalken. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Hinten in silber ist ein golden bewehrter rotbezungter schwarzer Eberkopf mit goldenem Kragen zu sehen.'
    },
    {
        slug: 'sentenhart',
        name: 'Sentenhart',
        image: '/files/images/thumbnails/photo-54855313110-thumb.jpg',
        heroImage: '/files/images/sentenhart_54855313110_o.jpg',
        keywords: ['sentenhart'],
        description: 'Erstmals urkundlich erwähnt wurde das Dorf im Jahr 1056 in einer Schenkungsurkunde des Grafen Eberhard von Nellenburg, als dieser das Dorf an das Kloster Reichenau abtritt. Reichenau verkaufte das Dorf wiederum 1463 an die Grafen von Werdenberg, die es 1570 an das Fürstenhaus Fürstenberg vererbten. Seither gehörte das Dorf zur Reichsgrafschaft Heiligenberg. Im Jahre 1806 gelangte Sentenhart an das Großherzogtum Baden. Der Ort gehörte bis 1973 dem Landkreis Stockach an. Am 1. Januar 1973 wurde der bis dahin selbständige Ort Sentenhart in die Gemeinde Wald enigegliedert, die ansonsten nur aus ehemals hohenzollerischen Dörfern besteht.',
        coatOfArmsMeaning: 'Das Wappen in blau bildet eine fliegende, rot bewehrte silberne Taube ab, die einen goldenen Ölkrug im Schnabel hält.'
    },
    {
        slug: 'ruhestetten',
        name: 'Ruhestetten',
        image: '/files/images/thumbnails/photo-54854142447-thumb.jpg',
        heroImage: '/files/images/ruhestetten_54854142447_o.jpg',
        keywords: ['ruhestetten'],
        description: 'In der Gegend um Ruhestetten fand bereits eine frühe Besiedlung statt. Es fanden sich westlich von Ruhestetten, in dem Torfried Egelsee, Reste von Pfahlbauten aus der Jungsteinzeit. Erstmals genannt wurde das Dorf 1277 bei einer Güterschenkung der Herren von Laubeck an das Kloster Wald. Das Kloster Wald erwarb im 14. Jahrhundert den ganzen Ort. Bis 1600 setzte Ruhestetten die Lokalleibherrschaft durch. Im Verlauf des Dreißigjährigen Krieges wurde auch das Dorf niedergebrannt. 1806 fiel Ruhestetten durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Ruhestetten gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde. Am 1. Januar 1975 wurde der bis dahin selbständige Ort Ruhestetten in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Vorne in schwarz ist ein doppelreihig, rot-silbern geschachter Schrägbalken, zu sehen. Hinten in silber befindet sich ein grünes Blatt mit zwei sparrenförmig gestellten Stielen, zwischen denen das Feld rot ist. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Die hintere Schildhälfte enthält das Wappen der Herren Laubeck.'
    },
    {
        slug: 'rothenlachen',
        name: 'Rothenlachen',
        image: '/files/images/thumbnails/photo-54854142482-thumb.jpg',
        heroImage: '/files/images/rothenlachen_54854142482_o.jpg',
        keywords: ['rothenlachen'],
        description: 'Erstmals genannt wurde das Dorf im Jahre 1224 bei einer Güterschenkung an das Kloster Wald. 1474 ging auch das Niedergericht und die Dorfherrschaft an das Kloster Wald über. In der ersten Hälfte des 16. Jahrhunderts bildete Rothenlachen mit den Nachbardörfern Riedetsweiler und Ruhestetten einen Gerichts- und Verwaltungsbezirk. 1806 fiel das Dorf durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Rothenlachen gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde.  Am 1. Januar 1971 wurde der bis dahin selbständige Ort Rothenlachen in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Vorne in schwarz befindet sich ein doppelreihig rot-silbern geschachter Schrägbalken. Hinten in gold sind zwei schwarze Pflugscharen übereinander zu sehen. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Die beiden Pflugscharen zeigen den von der Landwirtschaft bestimmten Charakter des Ortes.'
    },
    {
        slug: 'riedetsweiler',
        name: 'Riedetsweiler',
        image: '/files/images/thumbnails/photo-54855313150-thumb.jpg',
        heroImage: '/files/images/riedetsweiler_54855313150_o.jpg',
        keywords: ['riedetsweiler'],
        description: 'Erstmals genannt wurde das Dorf im Jahre 1264 in Zusammenhang mit Marquart und Heinrich von Riedetsweiler. 1270 gelangen die Güter in den Besitz von Kloster Wald. Bis Ende des Jahrhunderts fällt der ganze Ort an das Kloster, da auch die Herren von Reischach und mehrere andere dem Kloster Höfe im Ort überlassen. 1474 sind beim Kloster das Niedergericht und die Dorfherrschaft, 1501 besitzt es 4 Höfe und 1 Gut und gegen Ende des 16. Jahrhunderts die Lokalleibherrschaft. 1715 erhielt Riedetsweiler eine neue Kapelle in Fachwerkbauweise, die 1910 dem Heiligen Antonius geweiht wurde. Die Antonius-Statue stammt aus dem 15. Jahrhundert. Der Altar wurde im späten 19. Jahrhundert gefertigt. Die 1733 gegossene Glocke der Kapelle lieferten Christian Schmid und Johann Baptist Aporta aus Bregenz. 1806 fiel das Dorf, wie das gesamte Walder Territorium, durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. Seit 1818 gehört es zur Pfarrei Wald. Es sind nur wenige Höfe, die den Ort in seiner lockeren Struktur prägten. Neben den größeren Höfen gab es kleine „Lehensgütlein“. Seit 1925 gehört der Ort zum Landkreis Sigmaringen. Ein Aquarell von 1928 zeigt den Hof von Josef Endres, einen der Haupthöfe, der in unmittelbarer Nähe der Kapelle liegt. Es gibt die typische Anordnung der Bauwerke wieder. Gegenüber dem Einfirsthof liegt die Scheune. Ein Brunnen befindet sich direkt am Hofzugang. Ähnliche Ensembles sind im Walder Gemeindegebiet häufig zu finden. Am 1. Januar 1971 wurde der bis dahin selbständige Ort Riedetsweiler in die Gemeinde Wald eingegliedert. ',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Vorne in schwarz findet sich ein doppelreihig rot-silbern geschachter Schrägbalken, hinten in Gold drei rote Hirschstangen übereinander. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Die drei roten Hirschstangen in goldenem Feld weisen auf die Grafen von Veringen hin, die im 13. Jahrhundert in Riedetsweiler Besitz hatten.'
    },
    {
        slug: 'kappel',
        name: 'Kappel',
        image: '/files/images/thumbnails/photo-54854142572-thumb.jpg',
        heroImage: '/files/images/kappel_54854142572_o.jpg',
        keywords: ['kappel'],
        description: 'Erstmals genannt wurde das Dorf im Jahr 1241. Im 14. Jahrhundert war Kappel teilweise im Besitz der Herren von Korb aus Meßkirch, deren Anteil 1355 an das Kloster Wald überging. Weitere Teile erwarb das Kloster von den Herren von Zimmern. 1474 besaß das Kloster Wald die Niedergerichtsbarkeit und die Dorfherrschaft. 1806 fiel das Dorf durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Kappel gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde.  Am 1. Januar 1975 wurde der bis dahin selbständige Ort Kappel in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen zeigt in grün eine goldene Kapelle auf einem doppelreihig rot-silbern geschachten Balken. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck.'
    },
    {
        slug: 'hippetsweiler',
        name: 'Hippetsweiler',
        image: '/files/images/thumbnails/photo-54855252739-thumb.jpg',
        heroImage: '/files/images/hippetsweiler_54855252739_o.jpg',
        keywords: ['hippetsweiler'],
        description: 'Erstmals genannt wurde das Dorf im Jahre 1209 in einem Güterverzeichnis des Klosters Weißenau. Die erste undatierte Erwähnung erfolgte, als der Stauferkönig Philipp von Schwaben die Vogtei Hippetsweiler an die Brüder von Fronhofen verkaufte. Dieser Verkauf muss spätestens im Jahre 1208, dem Todesjahr des Königs, stattgefunden haben. Im Spätmittelalter verkaufte Graf Eberhard von Nellenburg die über dem Ort liegende Vogtei als Lehen des Klosters Einsiedeln an Berthold Gremlich, Herr zu Zell. Von der Familie Gremlich ging die Vogtei 1419 an die Stadt Pfullendorf und 1453 als Lehen und 1494 als Eigentum an das Kloster Wald über. 1806 fiel das Dorf durch die Säkularisation des Klosters an das Fürstentum Hohenzollern-Sigmaringen und 1850 mit diesem als Hohenzollernsche Lande an Preußen. 1862 wurde das Oberamt Wald, zu dem Hippetsweiler gehörte, dem Oberamt Sigmaringen eingegliedert, das 1925 zum Kreis Sigmaringen wurde.  Am 1. Januar 1971 wurde der bis dahin selbständige Ort Hippetsweiler in die Gemeinde Wald eingegliedert.',
        coatOfArmsMeaning: 'Das Wappen besteht aus einem gespaltenen Schild. Vorne in schwarz befindet sich ein doppelreihig rot-silbern geschachter Schrägbalken, hinten in gold zwei fliegende schwarze Raben übereinander. Der Zisterzienserbalken bringt die einstige Zugehörigkeit zum Kloster Wald zum Ausdruck. Lehnsherr war bis 1470 das Kloster Einsiedeln, das zwei schwarze Raben im Wappen führt. Sie sind Attribute des Heiligen Meinrad, der an der Stelle des späteren Klosters Einsiedeln ein Einsiedlerleben geführt hat. Nach der Legende haben zwei bisher von Meinrad gefütterte Raben die Mörder des Heiligen verfolgt und sie verraten.'
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
                        const sizeClass = isActive ? 'w-32 h-32' : 'w-24 h-24';
                        return (
                            <button
                                key={entry.slug}
                                type="button"
                                onClick={() => handleSelect(entry.slug)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-sm border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                    isActive ? 'border-accent bg-parchment/40' : 'border-parchment-dark/40 hover:border-accent'
                                }`}
                                >
                                    <div className={`${sizeClass} rounded-full overflow-hidden border border-parchment-dark bg-parchment flex items-center justify-center transition-all duration-300`}>
                                        <img
                                            src={entry.image}
                                            alt={`${entry.name} Wappen`}
                                            className={`w-full h-full object-contain ${isActive ? 'p-3' : 'p-4'}`}
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

            {selectedTown && (
                <section className="bg-white border border-parchment-dark rounded-sm shadow-sm p-6 grid gap-6 md:grid-cols-5">
                    <div className="md:col-span-2 flex items-center justify-center">
                        <div className="w-full max-w-sm border border-parchment-dark rounded-sm bg-parchment/40 p-4">
                            <img
                                src={selectedTown.heroImage || selectedTown.image}
                                alt={`${selectedTown.name} Wappen groß`}
                                className="w-full object-contain"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3 space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-accent">Ortsprofil</p>
                            <h3 className="text-2xl font-serif font-bold text-ink">{selectedTown.name}</h3>
                        </div>
                        <p className="text-ink/80 leading-relaxed">
                            {selectedTown.description}
                        </p>
                        <div className="border-l-4 border-accent/30 pl-4">
                            <p className="text-xs uppercase tracking-[0.3em] text-ink/50 mb-2">Bedeutung des Wappens</p>
                            <p className="text-ink/80">{selectedTown.coatOfArmsMeaning}</p>
                        </div>
                    </div>
                </section>
            )}

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

        </div>
    );
};

export default CoatOfArmsPage;
