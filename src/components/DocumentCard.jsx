import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentCard = ({ document }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group bg-white rounded-sm shadow-md overflow-hidden border border-parchment-dark hover:shadow-lg transition-all duration-300 flex flex-col h-full"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-parchment-dark">
                {document.images && document.images.length > 0 ? (
                    <img
                        src={document.images[0]}
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
                        {document.subcategory && (
                            <>
                                <span className="text-ink/30">•</span>
                                {document.subcategory}
                            </>
                        )}
                    </span>
                </div>

                <h3 className="font-serif text-xl font-bold mb-2 text-ink group-hover:text-accent transition-colors line-clamp-1">
                    <Link to={`/document/${document.id}`}>
                        {document.title}
                    </Link>
                </h3>

                <p className="text-ink/70 text-sm mb-4 line-clamp-2 font-serif flex-grow">
                    {document.description}
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
        </motion.div>
    );
};

export default DocumentCard;
