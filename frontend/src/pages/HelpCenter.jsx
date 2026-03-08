import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  FileText,
  GitCommit,
  Image as ImageIcon,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';

const workflows = [
  {
    id: 'images',
    title: 'Bilder hochladen',
    description: 'Albumstruktur pflegen, Fotos importieren und für Dokumente bereitstellen.',
    icon: ImageIcon,
    steps: [
      {
        title: 'Album auswählen oder erstellen',
        detail:
          'Gehe zu »Intern → Alben«. Nutze den Block »Album erstellen«, um neue Sammlungen oder Unteralben anzulegen und die Baumstruktur aktuell zu halten.'
      },
      {
        title: 'Fotos hochladen',
        detail:
          'Im Formular »Foto zu Album hinzufügen« Album wählen, Metadaten (Titel, Beschreibung, Aufnahmedatum) ergänzen und die Bilddatei auswählen. Optional „Als Cover verwenden“ aktivieren.'
      },
      {
        title: 'Dokumenten-Teams informieren',
        detail:
          'Nach erfolgreichem Upload erscheint das Foto sofort in der Bildauswahl des Dokumentenformulars. Gib dem Redaktionsteam Bescheid, welche Alben neue Bilder enthalten.'
      }
    ]
  },
  {
    id: 'pdfs',
    title: 'PDFs importieren',
    description: 'Zentrale Quellenbibliothek aufbauen und mit Dokumenten verknüpfen.',
    icon: FileText,
    steps: [
      {
        title: 'Mediathek öffnen',
        detail:
          'Navigiere zu »Intern → Mediathek PDFs«. Hier siehst du Suche, Filter und Import-Bereiche.'
      },
      {
        title: 'Import per URL oder Datei',
        detail:
          'Für Webquellen »PDF aus URL importieren« mit Original-Link, optionalen Metadaten und Jahr nutzen. Lokale Scans lädst du über »Datei auswählen« hoch; der Encoder wandelt sie automatisch in Base64.'
      },
      {
        title: 'Metadaten & Review',
        detail:
          'Nach dem Upload kannst du Titel, Beschreibung, Quelle und Status anpassen. Verknüpfe PDFs im Dokumentenformular, damit Reviewer Zugriff auf Primärquellen haben.'
      }
    ]
  },
  {
    id: 'review',
    title: 'Review von Dokumenten & Bildern',
    description: 'Dokumentenstand prüfen, Feedback geben und Freigaben dokumentieren.',
    icon: ShieldCheck,
    steps: [
      {
        title: 'Review Center öffnen',
        detail:
          'Unter »Intern → Review Center« findest du alle Dokumente, sortiert nach Priorität. Suche nach Titel, Jahr oder Kategorie und wähle einen Eintrag aus.'
      },
      {
        title: 'Inhalte prüfen',
        detail:
          'Nutze den rechten Detailbereich, um Beschreibung, Transkription, verknüpfte Bilder (Karussell) und PDFs (Download-Links) zu kontrollieren. Ergänze Kommentare direkt im Review-Panel.'
      },
      {
        title: 'Status setzen & Commit vorbereiten',
        detail:
          'Über das Panel kannst du den Status auf »in_review«, »approved« oder »rejected« setzen. Nach Abschluss wird automatisch die Commit-Notiz vorgeschlagen – halte dich an das dortige Format für Git-Protokolle.'
      }
    ]
  }
];

const quickLinks = [
  { label: 'Alben öffnen', path: '/albums', description: 'Albumstruktur und Foto-Uploads verwalten.' },
  { label: 'Dokumente verwalten', path: '/submit', description: 'Texte, Bilder und PDFs kombinieren.' },
  { label: 'Mediathek PDFs', path: '/media/pdfs', description: 'Quellen importieren & pflegen.' },
  { label: 'Review Center', path: '/review', description: 'Dokument-Prüfung durchführen.' }
];

const reviewStatuses = [
  { status: 'pending', hint: 'Neu eingereichte Inhalte; warten auf Zuweisung.' },
  { status: 'in_review', hint: 'Review läuft; übernehme Dokument nur, wenn du abstimmst.' },
  { status: 'approved', hint: 'Freigegeben. Prüfe, ob Commit bereits gepusht ist, bevor du Änderungen machst.' },
  { status: 'rejected', hint: 'Zur Überarbeitung zurückgegeben. Kommentiere immer, was fehlt.' }
];

const HelpCenter = () => {
  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <header className="text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Hilfe</p>
        <h1 className="text-4xl font-serif font-bold text-ink">Workflow-Handbuch</h1>
        <p className="text-ink/70 max-w-3xl mx-auto">
          Diese Ansicht fasst die drei Kernprozesse für Medien-Uploads und Reviews zusammen. Folge den Schritten chronologisch, um
          Bilder, PDFs und Dokumente konsistent ins Archiv zu bringen.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="group border border-parchment-dark rounded-sm bg-white p-5 shadow-sm flex flex-col gap-2 hover:border-accent"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{link.label}</p>
              <UploadCloud className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
            </div>
            <p className="text-sm text-ink/70">{link.description}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        {workflows.map((workflow) => (
          <article key={workflow.id} className="border border-parchment-dark rounded-md bg-white shadow-sm">
            <div className="border-b border-parchment-dark/60 p-6 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <workflow.icon className="text-accent" size={28} />
                <div>
                  <h2 className="text-2xl font-serif">{workflow.title}</h2>
                  <p className="text-sm text-ink/70">{workflow.description}</p>
                </div>
              </div>
            </div>
            <ol className="p-6 space-y-4">
              {workflow.steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full border border-accent flex items-center justify-center text-sm font-semibold text-accent">
                      {index + 1}
                    </div>
                    {index < workflow.steps.length - 1 && <span className="flex-1 w-px bg-accent/30" />}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="text-sm text-ink/70">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="border border-parchment-dark rounded-md bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BookOpenCheck className="text-accent" />
            <div>
              <h3 className="text-xl font-serif">Review-Checkliste</h3>
              <p className="text-sm text-ink/70">Nutze diese Punkte, bevor du einen Status bestätigst.</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-ink/80">
            <li className="flex gap-3">
              <CheckCircle2 className="text-accent mt-0.5" size={18} />
              <span>Vollständige Metadaten: Titel, Jahr, Ort, Kategorien sowie Quellenangaben gepflegt.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-accent mt-0.5" size={18} />
              <span>Alle verknüpften Fotos/PDFs lassen sich öffnen, haben sprechende Beschreibungen und sind dem richtigen Album zugeordnet.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-accent mt-0.5" size={18} />
              <span>Feedback dokumentiert: Nutze das Kommentarfeld im Review-Panel für Abweichungen oder offene Fragen.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="text-accent mt-0.5" size={18} />
              <span>Git-Protokoll: Bereite den vorgeschlagenen Commit-Text vor und pushe erst nach Freigabe ins Haupt-Repo.</span>
            </li>
          </ul>
        </div>
        <div className="border border-parchment-dark rounded-md bg-parchment p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GitCommit className="text-accent" />
            <div>
              <h3 className="text-xl font-serif">Statusübersicht</h3>
              <p className="text-sm text-ink/70">Einheitliche Bedeutung in Dokument-, PDF- und Foto-Reviews.</p>
            </div>
          </div>
          <ul className="space-y-3">
            {reviewStatuses.map((entry) => (
              <li key={entry.status} className="flex items-start gap-3">
                <StatusBadge status={entry.status} />
                <p className="text-sm text-ink/70">{entry.hint}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
