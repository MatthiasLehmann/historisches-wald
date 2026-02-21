import React from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const people = [
    'Matthias Lehmann',
    'Elfriede Kempter',
    'Martin Kuhn',
    'Stefanie Grüner',
];

const Team = () => {
    return (
        <div className="container mx-auto px-4 py-12 space-y-12">
            <section className="text-center space-y-4 max-w-3xl mx-auto">
                <p className="text-xs uppercase tracking-[0.5em] text-accent">Unser Team</p>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink">Gesichter hinter dem Archiv</h1>
                <p className="text-ink/70">
                Die Gruppe „Historisches Wald“ besteht aus Walder Bürgerinnen und Bürgern, die an der Geschichte ihrer Heimat interessiert sind. Wir haben uns zum Ziel gesetzt, in Zusammenarbeit mit der Gemeinde Wald, historische Fotos, Bilder und Gegenstände zu sammeln, zu digitalisieren und für die Nachwelt aufzubewahren. Außerdem möchten wir die Erforschung der Geschichte unserer Zehn-Dörfer-Gemeinde fördern, unser gewonnenes Wissen verbreiten und so die Erinnerung bewahren.
Wir sind kein Verein und stehen allen, an der Geschichte unsere Gemeinde Interessierten, offen. Ihr habt Interesse bei uns mitzumachen? Oder ihr habt historische Fotos, Bilder, Beiträge oder Gegenstände, die ihr uns zur Verfügung stellen könnt? Gerne auch „nur“ zur Digitalisierung. Dann meldet Euch über unser Kontakt oder unter 07578 / 9217267.
                </p>
            </section>

            <section className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="rounded-sm overflow-hidden shadow-md border border-parchment-dark bg-parchment-dark/40">
                    <img
                        src="/images/20250504_090323-1024x982.jpg"
                        alt="Team Historisches Wald"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-serif font-bold text-ink">Lerne unser Kern-Team kennen</h2>
                    <p className="text-ink/70">
                        Das Foto zeigt unser aktuelles Kernteam. Wir kombinieren Archivarbeit, Technik und Öffentlichkeitsarbeit – und freuen uns über Verstärkung aus Vereinen, Schule oder Verwaltung. (v.l.n.r.)
                    </p>
                    <ul className="space-y-2 text-lg font-serif text-ink">
                        {people.map((name) => (
                            <li key={name} className="flex items-center gap-3">
                                <span className="inline-flex h-2 w-2 bg-accent rounded-full" aria-hidden="true"></span>
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="bg-parchment border border-parchment-dark rounded-sm p-8 grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink mb-4">Gemeinsam Geschichte bewahren</h2>
                    <p className="text-ink/70">
                        Sie möchten Bestände erschließen oder eine Veranstaltung mit uns planen? Schreiben Sie uns und wir melden uns mit einem individuellen Vorschlag.
                    </p>
                </div>
                <div className="space-y-3 text-sm text-ink/80">
                    <p className="flex items-center gap-2">
                        <Mail size={18} className="text-accent" /> kontakt@historisches-wald.de
                    </p>
                    <p className="flex items-center gap-2">
                        <Phone size={18} className="text-accent" /> +49 7578-9217267
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin size={18} className="text-accent" /> Brauereistr. 5, 88639 Wald
                    </p>
                    <a
                        href="mailto:kontakt@historisches-wald.de"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white font-semibold rounded-sm shadow hover:bg-accent-dark"
                    >
                        Kontakt aufnehmen
                        <ArrowRight size={16} />
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Team;
