import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const CategoryFilter = ({ categories, selectedCategories, onToggleCategory }) => {
    const isSelected = (id) => selectedCategories.includes(id);
    const hasChildren = (category) => Array.isArray(category?.subcategories) && category.subcategories.length > 0;

    const [expandedNodes, setExpandedNodes] = React.useState(() => new Set(categories.map(cat => cat.id)));

    React.useEffect(() => {
        setExpandedNodes(new Set(categories.map(cat => cat.id)));
    }, [categories]);

    const toggleExpand = (id) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleNodeClick = (node) => {
        if (hasChildren(node)) {
            toggleExpand(node.id);
            return;
        }
        onToggleCategory(node.id);
    };

    const renderNodes = (nodes, depth = 0) => (
        nodes.map((node) => {
            const active = isSelected(node.id);
            const expandable = hasChildren(node);
            const expanded = expandedNodes.has(node.id);

            return (
                <div key={`${node.id}-${depth}`} className="space-y-1">
                    <div
                        className="flex items-center gap-2 py-1 rounded-sm"
                        style={{ paddingLeft: `${depth * 1.25}rem` }}
                    >
                        {expandable ? (
                            <button
                                type="button"
                                onClick={() => toggleExpand(node.id)}
                                className="text-ink/50 hover:text-accent transition-colors"
                                aria-label={expanded ? 'Ordner einklappen' : 'Ordner ausklappen'}
                            >
                                <ChevronRight size={16} className={`${expanded ? 'rotate-90' : ''} transition-transform`} />
                            </button>
                        ) : (
                            <span className="w-4" />
                        )}
                        <button
                            type="button"
                            onClick={() => handleNodeClick(node)}
                            className={`flex-1 text-left text-sm font-medium rounded-sm px-2 py-1 transition-colors border
                                ${active
                                    ? 'bg-accent text-white border-accent shadow-sm'
                                    : 'bg-white/70 text-ink/80 border-transparent hover:border-accent/30 hover:text-accent'}`}
                        >
                            {node.label}
                        </button>
                    </div>

                    {expandable && (
                        <AnimatePresence initial={false}>
                            {expanded && (
                                <Motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    {renderNodes(node.subcategories, depth + 1)}
                                </Motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            );
        })
    );

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => onToggleCategory('RESET')}
                className={`w-full px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] rounded-sm border transition-all
                    ${selectedCategories.length === 0
                        ? 'bg-ink text-parchment border-ink shadow'
                        : 'bg-parchment text-ink/70 border-parchment-dark hover:border-accent hover:text-accent'}`}
            >
                Alle Kategorien
            </button>

            <div className="divide-y divide-parchment-dark/60 border border-parchment-dark/70 rounded-sm bg-white/70">
                {categories.map((category) => (
                    <div key={category.id} className="py-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 px-4">
                            {category.label}
                        </p>
                        <div className="mt-2">{renderNodes(category.subcategories || [], 1)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryFilter;
