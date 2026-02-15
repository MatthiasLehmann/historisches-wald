import React from 'react';
import { Mail, Github } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-ink text-parchment py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-serif font-bold mb-4">Historisches Wald</h3>
                        <p className="text-parchment/60 text-sm leading-relaxed max-w-xs">
                            Ein digitales Projekt zur Bewahrung und Zugänglichmachung historischer Dokumente und Geschichten unserer Region.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-serif font-bold mb-4 text-parchment/90">Kontakt</h4>
                        <div className="flex items-center gap-2 text-parchment/60 text-sm mb-2">
                            <Mail size={16} />
                            <a href="mailto:kontakt@historisches-wald.de" className="hover:text-accent-light transition-colors">
                                kontakt@historisches-wald.de
                            </a>
                        </div>
                        <p className="text-parchment/60 text-sm">
                            Gemeindearchiv Wald<br />
                            Hauptstraße 1<br />
                            12345 Wald
                        </p>
                    </div>

                    <div>
                        <h4 className="font-serif font-bold mb-4 text-parchment/90">Rechtliches</h4>
                        <ul className="space-y-2 text-sm text-parchment/60">
                            <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Nutzungsbedingungen</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-parchment/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-parchment/40">
                    <p>&copy; {new Date().getFullYear()} Historisches Wald. Alle Rechte vorbehalten.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <span>Built with React & Tailwind</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
