const linkClass = 'underline hover:no-underline break-words';
const headingClass = 'text-2xl font-serif font-bold mb-3';

const Datenschutz = () => (
    <div className="container mx-auto px-4 py-12 max-w-3xl text-ink">
        <h1 className="text-4xl font-serif font-bold mb-4">Datenschutzerklärung</h1>
        <p className="text-sm text-ink/70 mb-6">Stand: 6. Oktober 2026</p>
        <div className="space-y-8 leading-relaxed">
            <section aria-labelledby="verantwortlicher">
                <h2 id="verantwortlicher" className={headingClass}>1. Verantwortlicher</h2>
                <address className="not-italic">
                    Matthias Lehmann<br />
                    Brauereistrasse 5<br />
                    88639 Wald<br />
                    Deutschland
                </address>
                <p className="mt-3">E-Mail: kontakt (at) historisches-wald.de</p>
                <p>Mobil: <a className={linkClass} href="tel:+4915229290038">01522 9290038</a></p>
                <p className="mt-3">Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich an diese Kontaktadresse wenden.</p>
            </section>
            <section aria-labelledby="hosting">
                <h2 id="hosting" className={headingClass}>2. Hosting und Aufruf der Website</h2>
                <p>Die Website wird auf einem virtuellen Server bei der IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, betrieben. IONOS stellt die Serverinfrastruktur bereit und ist insoweit Empfänger der für das Hosting erforderlichen Daten.</p>
                <p className="mt-3">Beim Aufruf der Website wird Ihre IP-Adresse verarbeitet, um die angeforderten Inhalte an Ihren Browser zu übertragen. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse besteht in der Bereitstellung und dem sicheren Betrieb der Website. Ohne die Übertragung der technisch erforderlichen Verbindungsdaten ist ein Aufruf nicht möglich.</p>
                <p className="mt-3">Weitere Angaben zum Anbieter finden Sie in den <a className={linkClass} href="https://www.ionos.de/terms-gtc/datenschutzerklaerung/">Datenschutzhinweisen von IONOS</a>.</p>
            </section>
            <section aria-labelledby="protokolle">
                <h2 id="protokolle" className={headingClass}>3. Serverprotokolle</h2>
                <p>Der Webserver Nginx speichert Zugriffe in Protokolldateien. Diese enthalten die vollständige IP-Adresse, Datum und Uhrzeit des Zugriffs, die angeforderte Adresse einschließlich gegebenenfalls übermittelter URL-Parameter, den HTTP-Status, die übertragene Datenmenge sowie gegebenenfalls die zuvor besuchte Seite und Angaben zum Browser. Die IP-Adresse wird dabei nicht anonymisiert.</p>
                <p className="mt-3">Die Protokolle dienen der Untersuchung technischer Störungen und der Erkennung und Abwehr von Angriffen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse liegt in der Sicherheit und Funktionsfähigkeit des Angebots.</p>
                <p className="mt-3">Zugriffsprotokolle werden bei nicht leerer Datei täglich rotiert. Neben der aktuellen Datei bleiben bis zu 14 Archivdateien erhalten. Bei regelmäßigen Zugriffen entspricht dies ungefähr 14 bis 15 Tagen. Dies ist keine garantierte maximale Speicherdauer: An Tagen ohne Protokolleinträge erfolgt keine Rotation.</p>
                <p className="mt-3">Nginx und die Backend-Anwendung führen außerdem Fehlerprotokolle. Je nach Fehler können darin Verbindungsdaten, angeforderte Adressen oder Angaben aus der betroffenen Verarbeitung enthalten sein. Für diese Dateien ist derzeit keine feste maximale Löschfrist eingerichtet.</p>
            </section>
            <section aria-labelledby="email">
                <h2 id="email" className={headingClass}>4. Kontakt per E-Mail</h2>
                <p>Wenn Sie uns eine E-Mail senden, verarbeiten wir Ihre E-Mail-Adresse, gegebenenfalls Ihren Namen sowie den Inhalt und die Anlagen Ihrer Nachricht zur Bearbeitung Ihres Anliegens. Die Angabe dieser Daten ist freiwillig; ohne eine Kontaktmöglichkeit können wir Ihnen nicht antworten.</p>
                <p className="mt-3">Rechtsgrundlage für allgemeine Anfragen ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse besteht in der Beantwortung von Anfragen. Soweit eine Anfrage auf einen Vertrag gerichtet ist, gilt Art. 6 Abs. 1 lit. b DSGVO. Nachrichten sind zu löschen, sobald das Anliegen abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten oder Gründe zur Wahrung von Rechtsansprüchen entgegenstehen.</p>
                <p className="mt-3">Nachrichten an die Kontaktadresse werden über IONOS an ein Postfach bei WEB.DE weitergeleitet. Anbieter der Weiterleitung ist die IONOS SE; WEB.DE ist ein Dienst der 1&amp;1 Mail &amp; Media GmbH. Bei der Weiterleitung und Zustellung werden insbesondere Absender- und Empfängeradresse, Nachrichteninhalt, Anlagen und technische Zustellinformationen verarbeitet. Weitere Angaben finden Sie in den <a className={linkClass} href="https://www.ionos.de/terms-gtc/datenschutzerklaerung/">Datenschutzhinweisen von IONOS</a> und den <a className={linkClass} href="https://agb-server.web.de/datenschutz">Datenschutzhinweisen von WEB.DE</a>.</p>
                <p className="mt-3">Die Löschung von Nachrichten erfolgt manuell.</p>
            </section>
            <section aria-labelledby="speicher">
                <h2 id="speicher" className={headingClass}>5. Anmeldung und Speicherung im Browser</h2>
                <p>Nach einer erfolgreichen Anmeldung wird unter dem Schlüssel „authToken“ ein Kennzeichen im lokalen Speicher Ihres Browsers (localStorage) abgelegt. Es dient dazu, den Anmeldestatus für die Bearbeitungsoberfläche zu erkennen. Das Kennzeichen enthält im derzeitigen Programmcode weder Ihren Namen noch Ihr Passwort. Die Prüfung der eingegebenen Zugangsdaten erfolgt im Browser.</p>
                <p className="mt-3">Der Eintrag wird beim Abmelden entfernt. Ohne Abmeldung bleibt er auch nach dem Schließen des Browsers bestehen, bis Sie ihn über die Browserfunktionen löschen. Die Website setzt hierfür keine automatische Ablaufzeit.</p>
                <p className="mt-3">Soweit die Speicherung für die ausdrücklich gewünschte Anmeldung unbedingt erforderlich ist, gilt § 25 Abs. 2 Nr. 2 TDDDG. Eine etwaige Verarbeitung personenbezogener Daten zur Bereitstellung der Bearbeitungsfunktionen erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im Betrieb der Bearbeitungsoberfläche.</p>
                <p className="mt-3">Es werden keine Dienste zur Besucherstatistik oder zum werblichen Tracking eingesetzt.</p>
            </section>
            <section aria-labelledby="archiv">
                <h2 id="archiv" className={headingClass}>6. Dokumente, Fotos und Bearbeitungsangaben</h2>
                <p>Im Rahmen des Projekts werden historische Dokumente, Texte und Fotos einschließlich zugehöriger Beschreibungen und Quellenangaben gespeichert. Diese können Namen, Abbildungen oder sonstige Angaben über Personen enthalten. Veröffentlichte Inhalte sind für Besucher der Website zugänglich und können von ihnen heruntergeladen oder kopiert werden.</p>
                <p className="mt-3">Bei der Bearbeitung können außerdem Namen von Bearbeitenden, Prüfkommentare und Zeitpunkte gespeichert werden. Diese Angaben dienen der Organisation und Nachvollziehbarkeit der redaktionellen Arbeit. Hierfür kommt Art. 6 Abs. 1 lit. f DSGVO in Betracht; das berechtigte Interesse besteht in der Pflege und Dokumentation des Projekts.</p>
                <p className="mt-3">Vor der Veröffentlichung personenbezogener Archiv- und Bildinhalte holen wir jeweils die Einwilligung der betroffenen Personen ein. Die Veröffentlichung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und nur im Umfang der erteilten Einwilligung. Die Einwilligung ist freiwillig und bezieht sich auf die konkreten Inhalte und deren Veröffentlichung auf dieser Website. Ohne diese Einwilligung veröffentlichen wir die betreffenden personenbezogenen Inhalte nicht.</p>
                <p className="mt-3">Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft über die in Abschnitt 1 genannten Kontaktmöglichkeiten widerrufen. Die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt. Nach dem Widerruf beenden wir die betreffende Veröffentlichung und entfernen die Inhalte von unserer Website. Bereits von Dritten angefertigte Kopien können wir nicht vollständig zurückholen.</p>
                <p className="mt-3">Betreffen gespeicherte Angaben Sie persönlich, können Sie sich zur Prüfung einer Berichtigung oder Entfernung an den Verantwortlichen wenden.</p>
                <p className="mt-3">Die Anwendung kann Bearbeitungsstände einschließlich Prüfkommentaren und Namen in der Versionshistorie speichern; das Entfernen aus dem aktuellen Datenbestand entfernt solche früheren Stände nicht automatisch.</p>
            </section>
            <section aria-labelledby="fonts">
                <h2 id="fonts" className={headingClass}>7. Lokal bereitgestellte Schriftarten</h2>
                <p>Die Schriftarten „Inter“ und „Playfair Display“ werden vom eigenen Webserver bereitgestellt. Beim Laden dieser Schriftarten stellt Ihr Browser keine Verbindung zu Google her. Es werden hierfür keine Daten an Google übermittelt. Für die technisch erforderliche Übertragung und die Serverprotokolle gelten die Angaben in den Abschnitten 2 und 3.</p>
            </section>
            <section aria-labelledby="rechte">
                <h2 id="rechte" className={headingClass}>8. Ihre Rechte</h2>
                <p>Unter den jeweiligen gesetzlichen Voraussetzungen haben Sie das Recht auf Auskunft über Ihre personenbezogenen Daten (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20).</p>
                <p className="mt-3">Wenn eine Verarbeitung auf Ihrer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt.</p>
                <p className="mt-3 font-semibold">Wenn Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeitet werden, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, Widerspruch einlegen (Art. 21 DSGVO).</p>
                <p className="mt-3">Außerdem können Sie sich bei einer Datenschutzaufsichtsbehörde beschweren. Für Baden-Württemberg ist dies der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg. Informationen und Kontaktmöglichkeiten finden Sie auf der <a className={linkClass} href="https://www.baden-wuerttemberg.datenschutz.de/beschwerde/">Website der Aufsichtsbehörde</a>.</p>
                <p className="mt-3">Die Website verwendet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO.</p>
            </section>
        </div>
    </div>
);

export default Datenschutz;
