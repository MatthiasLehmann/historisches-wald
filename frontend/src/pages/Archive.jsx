import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import CategoryFilter from '../components/CategoryFilter';
import categoriesData from '../data/categories.json';
import { fetchDocuments } from '../services/api';

const flattenCategories = (categories) => {
    const map = {};

    const traverse = (nodes = [], parentId = null) => {
        nodes.forEach((node) => {
            if (!node?.id) return;
            map[node.id] = { label: node.label, parentId };
            if (Array.isArray(node.subcategories) && node.subcategories.length > 0) {
                traverse(node.subcategories, node.id);
            }
        });
    };

    traverse(categories);
    return map;
};

const CATEGORY_INDEX = flattenCategories(categoriesData);

const normalizeValue = (value) => value?.toString().trim().toLowerCase() || '';

const getCategoryPath = (categoryId) => {
    const path = [];
    let currentId = categoryId;

    while (currentId) {
        const node = CATEGORY_INDEX[currentId];
        if (!node) {
            break;
        }
        path.unshift({
            id: currentId,
            label: node.label,
            parentId: node.parentId
        });
        currentId = node.parentId;
    }

    return path.filter((node) => node.parentId !== null);
};

const matchesCategoryNode = (doc, node) => {
    const normalizedId = normalizeValue(node.id);
    const normalizedLabel = normalizeValue(node.label);

    const category = normalizeValue(doc.category);
    const location = normalizeValue(doc.location);
    const subcategories = (Array.isArray(doc.subcategories) ? doc.subcategories : (doc.subcategory ? [doc.subcategory] : []))
        .map(normalizeValue)
        .filter(Boolean);
    const categoryIds = (doc.categoryIds || [])
        .map(normalizeValue)
        .filter(Boolean);

    if (category === normalizedId || category === normalizedLabel) {
        return true;
    }

    if (location === normalizedId || location === normalizedLabel) {
        return true;
    }

    if (subcategories.some((value) => value === normalizedId || value === normalizedLabel)) {
        return true;
    }

    if (subcategories.some((value) => value.startsWith(`${normalizedId}-`))) {
        return true;
    }

    if (categoryIds.includes(normalizedId) || categoryIds.includes(normalizedLabel)) {
        return true;
    }

    return false;
};

const Archive = () => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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

    const toggleCategory = (categoryId) => {
        if (categoryId === 'RESET') {
            setSelectedCategories([]);
            return;
        }
        setSelectedCategories((prev) => (
            prev[0] === categoryId ? [] : [categoryId]
        ));
    };

    const matchesCategorySelection = useCallback((doc) => {
        if (selectedCategories.length === 0) return true;

        const requiredNodes = selectedCategories.flatMap(getCategoryPath);
        const uniqueRequiredNodes = Array.from(
            new Map(requiredNodes.map((node) => [node.id, node])).values()
        );

        return uniqueRequiredNodes.every((node) => matchesCategoryNode(doc, node));
    }, [selectedCategories]);

    const filteredDocuments = useMemo(() => documents.filter(doc => {
        const isApproved = doc?.review?.status === 'approved';
        if (!isApproved) {
            return false;
        }
        const matchesCategory = matchesCategorySelection(doc);

        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.year.toString().includes(searchTerm);
        return matchesCategory && matchesSearch;
    }), [documents, searchTerm, matchesCategorySelection]);

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-serif font-bold text-ink mb-4">Das Archiv</h1>
                <p className="text-ink/60 max-w-2xl mx-auto">
                    Stöbern Sie durch Jahrhunderte lokaler Geschichte. Nutzen Sie die Filter oder die Suche, um spezifische Dokumente zu finden.
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/3">
                    <div className="bg-parchment-dark/30 border border-parchment-dark rounded-sm p-4 lg:sticky lg:top-28">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink/50 mb-3">Kategorien</h2>
                        <CategoryFilter
                            categories={categoriesData}
                            selectedCategories={selectedCategories}
                            onToggleCategory={toggleCategory}
                        />
                    </div>
                </aside>

                <section className="flex-1 space-y-8">
                    <div className="relative">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {isLoading ? (
                            <p className="col-span-full text-center text-ink/60">Dokumente werden geladen...</p>
                        ) : error ? (
                            <p className="col-span-full text-center text-red-600">{error}</p>
                        ) : filteredDocuments.length > 0 ? (
                            filteredDocuments.map(doc => (
                                <DocumentCard key={doc.id} document={doc} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-ink/40 bg-parchment/60 border border-dashed border-parchment-dark rounded-sm">
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
                </section>
            </div>
        </div>
    );
};

export default Archive;
