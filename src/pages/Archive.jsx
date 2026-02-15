import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import CategoryFilter from '../components/CategoryFilter';
import documentsData from '../data/documents.json';
import categoriesData from '../data/categories.json';

const Archive = () => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleCategory = (category) => {
        if (category === 'RESET') {
            setSelectedCategories([]);
            return;
        }
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const filteredDocuments = useMemo(() => {
        return documentsData.filter(doc => {
            // Category Match: True if no categories selected, OR if doc matches ANY selected category (Main or Sub)
            const matchesCategory = selectedCategories.length === 0 ||
                selectedCategories.includes(doc.category) ||
                (doc.subcategory && selectedCategories.includes(doc.subcategory));

            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.year.toString().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategories, searchTerm]);

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-serif font-bold text-ink mb-4">Das Archiv</h1>
                <p className="text-ink/60 max-w-2xl mx-auto">
                    Stöbern Sie durch Jahrhunderte lokaler Geschichte. Nutzen Sie die Filter oder die Suche, um spezifische Dokumente zu finden.
                </p>
            </header>

            <div className="max-w-xl mx-auto mb-8 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink/40">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Suchen nach Titel, Jahr oder Stichwort..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-parchment-light border border-parchment-dark rounded-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-inner"
                />
            </div>

            <CategoryFilter
                categories={categoriesData}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDocuments.length > 0 ? (
                    filteredDocuments.map(doc => (
                        <DocumentCard key={doc.id} document={doc} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-ink/40">
                        <p className="text-xl font-serif">Keine Dokumente gefunden.</p>
                        <button
                            onClick={() => { setSelectedCategories([]); setSearchTerm(''); }}
                            className="mt-4 text-accent hover:underline"
                        >
                            Filter zurücksetzen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Archive;
