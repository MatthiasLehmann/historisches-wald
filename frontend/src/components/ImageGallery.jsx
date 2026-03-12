import React, { useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

const normalizeImage = (image, index, title) => {
    if (!image) {
        return null;
    }
    if (typeof image === 'string') {
        return {
            id: `legacy-${index}`,
            src: image,
            title: `${title} – Bild ${index + 1}`,
            description: '',
            meta: {}
        };
    }
    const src = image.src || image.previewUrl || image.url || '';
    if (!src) {
        return null;
    }
    return {
        id: image.id || `image-${index}`,
        src,
        title: image.title || image.name || `${title} – Bild ${index + 1}`,
        description: image.description || image.caption || '',
        meta: {
            author: image.author || '',
            source: image.source || '',
            license: image.license || '',
            year: image.year || image.date || '',
            location: image.location || ''
        }
    };
};

const ImageGallery = ({ images, title }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    const normalizedImages = useMemo(() => {
        if (!Array.isArray(images)) {
            return [];
        }
        return images
            .map((image, index) => normalizeImage(image, index, title || 'Dokument'))
            .filter((image) => Boolean(image?.src));
    }, [images, title]);

    if (normalizedImages.length === 0) return null;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {normalizedImages.map((img, index) => (
                    <Motion.figure
                        key={img.id || index}
                        whileHover={{ scale: 1.02 }}
                        className="group cursor-pointer overflow-hidden rounded-sm shadow-sm border border-parchment-dark bg-white flex flex-col"
                        onClick={() => setSelectedImage(img)}
                    >
                        <div className="relative w-full aspect-[4/3] bg-parchment/40 flex items-center justify-center overflow-hidden">
                            <img
                                src={img.src}
                                alt={img.title}
                                className="w-full h-full object-contain sepia-[.15] group-hover:sepia-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-parchment/90 p-2 rounded-full text-ink">
                                    <ZoomIn size={20} />
                                </div>
                            </div>
                        </div>
                        <figcaption className="border-t border-parchment-dark/60 bg-parchment/30 px-4 py-3 space-y-2">
                            <div className="p-3 border border-parchment-dark/60 rounded-sm bg-white/80 space-y-1">
                                <p className="text-sm font-semibold text-ink">{img.title || 'Ohne Titel'}</p>
                                <p className="text-xs text-ink/70 leading-relaxed">
                                    {img.description?.trim() ? img.description : 'Keine Beschreibung vorhanden.'}
                                </p>
                            </div>
                            {(img.meta?.author || img.meta?.source) && (
                                <div className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex flex-wrap gap-3">
                                    {img.meta.author && <span>Autor: {img.meta.author}</span>}
                                    {img.meta.source && <span>Quelle: {img.meta.source}</span>}
                                </div>
                            )}
                        </figcaption>
                    </Motion.figure>
                ))}
            </div>

            <AnimatePresence>
                {selectedImage && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-parchment hover:text-white transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={32} />
                        </button>
                        <Motion.figure
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-full max-h-[90vh] rounded-sm shadow-2xl border-4 border-parchment bg-white p-4 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.src}
                                alt={selectedImage.title}
                                className="max-h-[70vh] object-contain mx-auto"
                            />
                            <figcaption className="text-center space-y-1">
                                <p className="text-base font-semibold text-ink">{selectedImage.title}</p>
                                {selectedImage.description && (
                                    <p className="text-sm text-ink/70">{selectedImage.description}</p>
                                )}
                            </figcaption>
                        </Motion.figure>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ImageGallery;
