import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Tag } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

const toPlainText = (value) => {
    if (value == null) {
        return '';
    }
    const normalized = typeof value === 'string'
        ? value
        : Array.isArray(value)
            ? value.join('\n')
            : String(value);
    if (!HTML_PATTERN.test(normalized)) {
        return normalized;
    }
    return normalized.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const DocumentCard = ({ document }) => {
    const subcategories = document.categoryIds ?? (
        document.subcategory ? [document.subcategory] : []
    );

    const coverImage = document.images?.[0];
    const coverSrc = typeof coverImage === 'string' ? coverImage : coverImage?.src || '';

    const previewText = React.useMemo(() => {
        const plain = toPlainText(document.description);
        return plain || 'Keine Beschreibung vorhanden.';
    }, [document.description]);

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group bg-white rounded-sm shadow-md overflow-hidden border border-parchment-dark hover:shadow-lg transition-all duration-300 flex flex-col h-full"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-parchment-dark">
                {coverSrc ? (
                    <img
                        src={coverSrc}
                        alt={document.title}
                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 sepia-[.2]"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-ink/40 font-serif">
                        Keine Vorschau
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-parchment/90 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-ink border border-parchment-dark rounded-sm z-10">
                    {document.year}
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow bg-parchment/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent uppercase tracking-wider">
                        <Tag size={12} />
                        {document.category}
                        {subcategories.length > 0 && (
                            <span className="text-ink/50 flex flex-wrap gap-1 items-center">
                                <span className="text-ink/30 mx-1">•</span>
                                {subcategories.slice(0, 2).join(' • ')}
                                {subcategories.length > 2 && (
                                    <span className="text-ink/40">+{subcategories.length - 2}</span>
                                )}
                            </span>
                        )}
                    </span>
                </div>

                <h3 className="font-serif text-xl font-bold mb-2 text-ink group-hover:text-accent transition-colors line-clamp-1">
                    <Link to={`/document/${document.id}`}>
                        {document.title}
                    </Link>
                </h3>

                <p className="text-ink/70 text-sm mb-4 line-clamp-2 font-serif flex-grow">
                    {previewText}
                </p>

                <div className="pt-4 mt-auto border-t border-parchment-dark/30 flex items-center justify-between text-xs text-ink/50">
                    <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {document.location}
                    </span>
                    <Link
                        to={`/document/${document.id}`}
                        className="text-accent font-semibold hover:underline"
                    >
                        Mehr erfahren →
                    </Link>
                </div>
            </div>
        </Motion.div>
    );
};

export default DocumentCard;
