import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { fetchPdf } from '../services/api.js';

const formatLicenseLabel = (license) => (!license || license === 'rights-reserved' ? 'Rechte vorbehalten' : license);

const resolvePdfUrl = (pdf) => {
  if (!pdf) {
    return '';
  }
  if (pdf.file?.type === 'remote') {
    return pdf.file?.originalUrl || pdf.file?.path || '';
  }
  return pdf.file?.path || pdf.file?.originalUrl || '';
};

const PdfViewPage = () => {
  const { id } = useParams();
  const [pdf, setPdf] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let ignore = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchPdf(id);
        if (!ignore) {
          setPdf(result);
        }
      } catch (loadError) {
        console.error('PDF konnte nicht geladen werden:', loadError);
        if (!ignore) {
          setError(loadError.message || 'PDF konnte nicht geladen werden.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      ignore = true;
    };
  }, [id]);

  const pdfUrl = resolvePdfUrl(pdf);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-ink/60">PDF wird geladen...</p>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-ink">{error || 'PDF nicht gefunden.'}</h1>
        <Link to="/archive" className="inline-flex items-center gap-2 text-accent hover:underline">
          <ArrowLeft size={18} />
          Zurück zum Archiv
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-parchment">
      <section className="border-b border-parchment-dark bg-white">
        <div className="container mx-auto px-4 py-5 space-y-4">
          <Link to="/archive" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-accent">
            <ArrowLeft size={18} />
            Zurück zum Archiv
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-accent">
                <FileText size={16} />
                PDF-Ansicht
              </p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink leading-tight">{pdf.title}</h1>
              <p className="text-sm text-ink/70">
                {pdf.year || 'Ohne Jahr'} · {pdf.location || 'Ohne Ort'} · Quelle: {pdf.source || 'Unbekannt'}
              </p>
              <p className="text-xs text-ink/60">Lizenz: {formatLicenseLabel(pdf.license)}</p>
            </div>

            {pdfUrl && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition"
                >
                  <ExternalLink size={16} />
                  Original öffnen
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-sm border border-parchment-dark px-4 py-2 text-sm font-semibold text-ink hover:bg-parchment/50 transition"
                >
                  <Download size={16} />
                  Herunterladen
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4">
        {pdfUrl ? (
          <div className="overflow-hidden border border-parchment-dark bg-white shadow-sm">
            <iframe
              src={pdfUrl}
              title={pdf.title}
              className="block h-[72vh] min-h-[520px] w-full"
            />
          </div>
        ) : (
          <div className="border border-parchment-dark bg-white px-4 py-16 text-center text-sm text-ink/60">
            Für dieses PDF ist keine Vorschau verfügbar.
          </div>
        )}
      </section>
    </div>
  );
};

export default PdfViewPage;
