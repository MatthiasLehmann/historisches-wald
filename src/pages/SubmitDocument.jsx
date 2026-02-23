import React, { useEffect, useMemo, useState } from 'react';
import categoriesData from '../data/categories.json';

const initialForm = {
  title: '',
  year: '',
  location: '',
  description: '',
  transcription: '',
  author: '',
  source: '',
  condition: '',
};

const SubmitDocument = () => {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const areaOptions = useMemo(() => {
    const root = categoriesData[0];
    return Array.isArray(root?.subcategories) ? root.subcategories : [];
  }, []);

  const currentArea = areaOptions.find((area) => area.label === selectedArea);
  const availableSubs = currentArea?.subcategories ?? [];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
    setSelectedSubcategories([]);
  };

  const toggleSubcategory = (label) => {
    setSelectedSubcategories((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Dokumentenliste konnte nicht geladen werden.');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedArea('');
    setSelectedSubcategories([]);
    setEditingId(null);
  };

  const handleSelectDocument = (doc) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title ?? '',
      year: doc.year ? String(doc.year) : '',
      location: doc.location ?? '',
      description: doc.description ?? '',
      transcription: Array.isArray(doc.transcription)
        ? doc.transcription.join('\n\n')
        : doc.transcription ?? '',
      author: doc.metadata?.author ?? '',
      source: doc.metadata?.source ?? '',
      condition: doc.metadata?.condition ?? '',
    });
    setSelectedArea(doc.category ?? '');
    setSelectedSubcategories(
      Array.isArray(doc.subcategories)
        ? doc.subcategories
        : doc.subcategory
          ? [doc.subcategory]
          : [],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : '',
        category: selectedArea,
        subcategories: selectedSubcategories,
        transcription: form.transcription,
      };

      const endpoint = editingId ? `/api/documents/${editingId}` : '/api/documents';
      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Speichern fehlgeschlagen');
      }

      const saved = await response.json();

      setStatus({ type: 'success', message: editingId ? 'Dokument aktualisiert.' : 'Dokument gespeichert.' });
      if (editingId) {
        handleSelectDocument(saved);
      } else {
        setEditingId(saved.id);
        handleSelectDocument(saved);
      }
      loadDocuments();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.5em] text-accent">Neuer Eintrag</p>
        <h1 className="text-4xl font-serif font-bold text-ink">Dokument hinzufügen</h1>
        <p className="text-ink/70">Bitte füllen Sie alle Pflichtfelder aus. Die Daten werden über die lokale API direkt in der JSON-Datei gespeichert.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[20%,minmax(0,80%)]">
        <aside className="bg-white border border-parchment-dark rounded-sm shadow-sm p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <h2 className="text-lg font-serif font-bold text-ink">Gespeicherte Dokumente</h2>
            <p className="text-xs text-ink/60">Klicken zum Bearbeiten</p>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-ink/50">Noch keine Dokumente geladen.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectDocument(doc)}
                    className={`w-full text-left border rounded-sm px-3 py-2 transition-colors ${
                      editingId === doc.id
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-parchment-dark/60 hover:border-accent'
                    }`}
                  >
                    <p className="font-semibold text-sm">{doc.title}</p>
                    <p className="text-xs text-ink/60">{doc.year} · {doc.category}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-parchment-dark rounded-sm shadow-sm p-6">
          {editingId && (
            <div className="flex items-center justify-between bg-parchment/60 border border-parchment-dark/50 rounded-sm px-4 py-2 text-sm text-ink/80">
              <span>Bearbeite: {form.title || editingId}</span>
              <button type="button" onClick={resetForm} className="text-accent hover:underline text-xs">
                Neuen Eintrag anlegen
              </button>
            </div>
          )}

        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Titel*
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Jahr*
            <input
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
              required
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Kategorie*
            <select
              name="category"
              value={selectedArea}
              onChange={handleAreaChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2 bg-white"
              required
            >
              <option value="">Bitte wählen</option>
              {areaOptions.map((area) => (
                <option key={area.id} value={area.label}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1 text-sm font-medium text-ink/80">
            Unterkategorien
            <div className="border border-parchment-dark rounded-sm px-3 py-2 bg-parchment/30 max-h-40 overflow-y-auto">
              {availableSubs.length === 0 && (
                <p className="text-xs text-ink/50">Keine Unterkategorien verfügbar.</p>
              )}
              {availableSubs.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 text-sm font-normal text-ink/70 py-1">
                  <input
                    type="checkbox"
                    value={sub.label}
                    checked={selectedSubcategories.includes(sub.label)}
                    onChange={() => toggleSubcategory(sub.label)}
                  />
                  {sub.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="space-y-1 text-sm font-medium text-ink/80 block">
          Ort*
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-ink/80 block">
          Beschreibung*
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            required
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-ink/80 block">
          Transkription / Notizen
          <textarea
            name="transcription"
            value={form.transcription}
            onChange={handleChange}
            rows={6}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            placeholder="Optionaler Volltext oder Markdown"
          />
        </label>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Autor
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Quelle
            <input
              name="source"
              value={form.source}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-ink/80">
            Zustand
            <input
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          {status && (
            <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto px-6 py-3 bg-accent text-white font-semibold rounded-sm shadow hover:bg-accent-dark disabled:opacity-50"
          >
            {isSubmitting ? 'Speichern…' : editingId ? 'Dokument aktualisieren' : 'Dokument speichern'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitDocument;
