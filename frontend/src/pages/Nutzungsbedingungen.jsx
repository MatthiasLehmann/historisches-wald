import { Link } from 'react-router-dom';

const headingClass = 'text-2xl font-serif font-bold mb-3';
const linkClass = 'underline hover:no-underline';

const Nutzungsbedingungen = () => (
    <div className="container mx-auto px-4 py-12 max-w-3xl text-ink">
        <h1 className="text-4xl font-serif font-bold mb-4">Nutzungsbedingungen</h1>
        <p className="text-sm text-ink/70 mb-8">Stand: 6. Oktober 2026</p>
        <div className="space-y-8 leading-relaxed">
            <section aria-labelledby="zweck">
                <h2 id="zweck" className={headingClass}>1. Zweck des Angebots</h2>
                <p>„Historisches Wald“ ist ein privat betriebenes Projekt zur Bewahrung und Vermittlung der Geschichte von Wald und seiner Ortsteile. Die Website stellt historische Texte, Bilder, Dokumente und Quellen zur Information bereit.</p>
                <p className="mt-3">Diese Hinweise erläutern die Verwendung der bereitgestellten Inhalte und die Einreichung eigener Materialien. Angaben zum Betreiber finden Sie im <Link className={linkClass} to="/impressum">Impressum</Link>.</p>
            </section>
            <section aria-labelledby="rechte">
                <h2 id="rechte" className={headingClass}>2. Urheberrechte und Lizenzen</h2>
                <p>Rechte an Texten, Bildern und Dokumenten verbleiben bei den jeweiligen Urhebern oder Rechteinhabern. Die Veröffentlichung auf dieser Website räumt Besuchern keine pauschalen Nutzungsrechte ein. Bitte beachten Sie die Quellen-, Rechte- und Lizenzhinweise beim jeweiligen Inhalt.</p>
                <p className="mt-3">Für Inhalte unter einer ausdrücklich angegebenen Lizenz gelten deren Bedingungen. Gesetzlich erlaubte Nutzungen, etwa zulässige Zitate, und die Nutzung gemeinfreier Inhalte bleiben unberührt. Das Alter eines Dokuments oder Fotos allein bedeutet nicht, dass es frei verwendet werden darf.</p>
            </section>
            <section aria-labelledby="weiterverwendung">
                <h2 id="weiterverwendung" className={headingClass}>3. Weiterverwendung von Inhalten</h2>
                <p>Soweit eine Nutzung nicht bereits gesetzlich oder durch eine angegebene Lizenz erlaubt ist, benötigen Sie die Zustimmung des jeweiligen Rechteinhabers. Dies betrifft beispielsweise die Veröffentlichung auf anderen Websites, in sozialen Medien oder in Druckerzeugnissen sowie Bearbeitungen und kommerzielle Verwendungen.</p>
                <p className="mt-3">Eine angebotene Downloadfunktion ist für sich genommen keine Erlaubnis zur Veröffentlichung oder Weitergabe. Die bloße Nennung unserer Website als Quelle ersetzt eine erforderliche Zustimmung nicht.</p>
                <p className="mt-3">Bei erlaubter Weiterverwendung beachten Sie bitte die jeweils vorgeschriebenen Urheber-, Quellen- und Lizenzangaben. Soweit möglich, bitten wir zusätzlich um einen Verweis auf „Historisches Wald“ und die betreffende Inhaltsseite. Persönlichkeitsrechte abgebildeter oder genannter Personen sind unabhängig vom Urheberrecht zu beachten.</p>
                <p className="mt-3">Bei Fragen zur Weiterverwendung können Sie sich an kontakt (at) historisches-wald.de wenden. Wir können eine Erlaubnis nur erteilen, soweit wir selbst über die dafür erforderlichen Rechte verfügen.</p>
            </section>
            <section aria-labelledby="einreichung">
                <h2 id="einreichung" className={headingClass}>4. Einreichen von Materialien</h2>
                <p>Wenn Sie uns Texte, Fotos oder Dokumente zur Verfügung stellen möchten, teilen Sie uns bitte deren Herkunft, bekannte Urheber und bestehende Nutzungseinschränkungen mit. Reichen Sie nur Materialien ein, die Sie rechtmäßig bereitstellen dürfen. Der Besitz eines Fotos oder Dokuments allein berechtigt nicht automatisch zu dessen Veröffentlichung.</p>
                <p className="mt-3">Vor der Veröffentlichung vereinbaren wir mit Ihnen beziehungsweise den Rechteinhabern, welche Inhalte wir auf der Website verwenden dürfen und in welchem Umfang. Durch die bloße Einreichung werden keine weitergehenden Nutzungsrechte eingeräumt. Ein Anspruch auf Veröffentlichung besteht nicht.</p>
                <p className="mt-3">Für die Veröffentlichung personenbezogener Archiv- und Bildinhalte holen wir vorab die Einwilligung der betroffenen Personen ein. Die Zustimmung eines Fotografen oder sonstigen Rechteinhabers und die Einwilligung einer abgebildeten Person sind getrennt zu berücksichtigen. Informationen zu personenbezogenen Daten und zum Widerruf einer Einwilligung finden Sie in unserer <Link className={linkClass} to="/datenschutz">Datenschutzerklärung</Link>.</p>
            </section>
            <section aria-labelledby="richtigkeit">
                <h2 id="richtigkeit" className={headingClass}>5. Historische Angaben und Korrekturen</h2>
                <p>Wir stellen die Inhalte sorgfältig anhand der verfügbaren Quellen zusammen. Historische Überlieferungen können jedoch unvollständig, widersprüchlich oder fehlerhaft sein. Quellen können zeitgenössische Sichtweisen wiedergeben, die nicht die Auffassung der Projektbetreiber darstellen.</p>
                <p className="mt-3">Hinweise auf Fehler, ergänzende Quellen oder abweichende Zuordnungen sind willkommen. Bitte nennen Sie nach Möglichkeit die betroffene Seite und die Grundlage Ihres Hinweises. Inhalte können nach Prüfung ergänzt oder berichtigt werden. Die gesetzliche Haftung bleibt unberührt.</p>
            </section>
            <section aria-labelledby="beanstandung">
                <h2 id="beanstandung" className={headingClass}>6. Hinweise auf Rechteverletzungen</h2>
                <p>Wenn Sie durch einen Inhalt Ihre Urheber-, Persönlichkeits- oder sonstigen Rechte verletzt sehen, wenden Sie sich bitte an kontakt (at) historisches-wald.de. Nennen Sie möglichst die betroffene Seite oder Datei und erläutern Sie Ihr Anliegen. Wir prüfen den Hinweis und berichtigen oder entfernen Inhalte, soweit dies erforderlich ist. Ihre gesetzlichen Rechte bleiben unberührt.</p>
            </section>
        </div>
    </div>
);

export default Nutzungsbedingungen;
