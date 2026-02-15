import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryFilter = ({ categories, selectedCategories, onToggleCategory }) => {
    // derived state: find which main categories are selected to show their subcategories
    const selectedMainCategories = categories.filter(cat =>
        selectedCategories.includes(cat.label) ||
        cat.subcategories.some(sub => selectedCategories.includes(sub.label))
    );

    return (
        <div className="mb-12 space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    onClick={() => onToggleCategory('RESET')}
                    className={`
              px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border
              ${selectedCategories.length === 0
                            ? 'bg-ink text-parchment border-ink shadow-md scale-105'
                            : 'bg-parchment text-ink/70 border-parchment-dark hover:border-accent hover:text-accent'}
            `}
                >
                    Alle
                </button>

                {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.label);
                    return (
                        <button
                            key={category.id}
                            onClick={() => onToggleCategory(category.label)}
                            className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border
                ${isSelected
                                    ? 'bg-accent text-white border-accent shadow-md'
                                    : 'bg-parchment text-ink/70 border-parchment-dark hover:border-accent hover:text-accent'}
              `}
                        >
                            {category.label}
                        </button>
                    );
                })}
            </div>

            {/* Subcategories Row - conditionally rendered based on selected main categories */}
            <div className="flex flex-wrap gap-2 justify-center min-h-[2rem]">
                <AnimatePresence>
                    {categories.map(cat => {
                        // Show subcategories if the main category is selected OR any of its subcategories are selected
                        const showSubs = selectedCategories.includes(cat.label) || cat.subcategories.some(s => selectedCategories.includes(s.label));

                        if (!showSubs || cat.subcategories.length === 0) return null;

                        return (
                            <motion.div
                                key={cat.id + '-subs'}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-2 p-2 bg-parchment-dark/10 rounded-lg"
                            >
                                {cat.subcategories.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => onToggleCategory(sub.label)}
                                        className={`
                                            px-3 py-1 rounded-md text-xs font-medium transition-all border
                                            ${selectedCategories.includes(sub.label)
                                                ? 'bg-accent/80 text-white border-accent'
                                                : 'bg-white/50 text-ink/70 border-transparent hover:border-accent/30'}
                                        `}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CategoryFilter;
