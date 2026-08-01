import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';

const normalizeImage = (image, index, title) => {
    if (!image) {
        return null;
    }
    if (typeof image === 'string') {
        return {
            id: `legacy-${index}`,
            src: image,
            original: image,
            title: `${title} - Bild ${index + 1}`,
            description: '',
            type: 'legacy',
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
        original: image.original || image.originalUrl || image.fullUrl || src,
        title: image.title || image.name || `${title} - Bild ${index + 1}`,
        description: image.description || image.caption || '',
        type: image.type || '',
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
    const [selectedIndex, setSelectedIndex] = useState(null);
    const normalizedImages = useMemo(() => {
        if (!Array.isArray(images)) {
            return [];
        }
        return images
            .map((image, index) => normalizeImage(image, index, title || 'Dokument'))
            .filter((image) => Boolean(image?.src));
    }, [images, title]);

    const selectedImage = selectedIndex === null ? null : normalizedImages[selectedIndex];
    const hasMultipleImages = normalizedImages.length > 1;

    const closeViewer = useCallback(() => {
        setSelectedIndex(null);
    }, []);

    const showPreviousImage = useCallback(() => {
        setSelectedIndex((currentIndex) => (
            currentIndex === null
                ? 0
                : (currentIndex - 1 + normalizedImages.length) % normalizedImages.length
        ));
    }, [normalizedImages.length]);

    const showNextImage = useCallback(() => {
        setSelectedIndex((currentIndex) => (
            currentIndex === null
                ? 0
                : (currentIndex + 1) % normalizedImages.length
        ));
    }, [normalizedImages.length]);

    useEffect(() => {
        if (!selectedImage) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeViewer();
            }
            if (event.key === 'ArrowLeft' && hasMultipleImages) {
                showPreviousImage();
            }
            if (event.key === 'ArrowRight' && hasMultipleImages) {
                showNextImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeViewer, hasMultipleImages, selectedImage, showNextImage, showPreviousImage]);

    if (normalizedImages.length === 0) return null;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {normalizedImages.map((img, index) => (
                    <Motion.button
                        key={img.id || index}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        className="group overflow-hidden rounded-sm shadow-sm border border-parchment-dark bg-white flex h-full flex-col text-left"
                        onClick={() => setSelectedIndex(index)}
                    >
                        <div className="relative w-full aspect-[4/3] bg-parchment/40 flex items-center justify-center overflow-hidden">
                            <img
                                src={img.src}
                                alt={img.title}
                                className="w-full h-full object-contain sepia-[.15] group-hover:sepia-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-parchment/90 p-2 rounded-full text-ink">
                                    <ExternalLink size={20} />
                                </div>
                            </div>
                        </div>
                        <figcaption className="w-full border-t border-parchment-dark/60 bg-parchment/30 px-4 py-3 space-y-2">
                            <div className="p-3 border border-parchment-dark/60 rounded-sm bg-white/80 space-y-1">
                                <p className="text-sm font-semibold text-ink">{img.title || 'Ohne Titel'}</p>
                                <p className="text-xs text-ink/70 leading-relaxed">
                                    {img.description?.trim() ? img.description : 'Keine Beschreibung vorhanden.'}
                                </p>
                            </div>
                            {img.meta?.source && (
                                <div className="text-[10px] uppercase tracking-[0.2em] text-ink/50 flex flex-wrap gap-3">
                                    <span>Quelle: {img.meta.source}</span>
                                </div>
                            )}
                        </figcaption>
                    </Motion.button>
                ))}
            </div>

            <AnimatePresence>
                {selectedImage && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
                        onClick={closeViewer}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 rounded-full bg-parchment/90 p-2 text-ink shadow hover:bg-white"
                            onClick={closeViewer}
                            aria-label="Galerie schließen"
                        >
                            <X size={24} />
                        </button>

                        {hasMultipleImages && (
                            <>
                                <button
                                    type="button"
                                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-parchment/90 p-3 text-ink shadow hover:bg-white"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        showPreviousImage();
                                    }}
                                    aria-label="Vorheriges Bild"
                                >
                                    <ChevronLeft size={28} />
                                </button>
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-parchment/90 p-3 text-ink shadow hover:bg-white"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        showNextImage();
                                    }}
                                    aria-label="Nächstes Bild"
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}

                        <Motion.figure
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-sm border border-parchment-dark bg-white shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex min-h-0 flex-1 items-center justify-center bg-parchment/30 p-4">
                                <img
                                    src={selectedImage.original || selectedImage.src}
                                    alt={selectedImage.title}
                                    className="max-h-[72vh] w-full object-contain"
                                />
                            </div>
                            <figcaption className="border-t border-parchment-dark/60 bg-white px-5 py-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-1">
                                        <p className="text-base font-semibold text-ink">{selectedImage.title || 'Ohne Titel'}</p>
                                        {selectedImage.description && (
                                            <p className="text-sm text-ink/70">{selectedImage.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
                                            {selectedImage.meta?.source && <span>Quelle: {selectedImage.meta.source}</span>}
                                            {selectedImage.meta?.license && <span>Lizenz: {selectedImage.meta.license}</span>}
                                            {hasMultipleImages && (
                                                <span>
                                                    Bild {selectedIndex + 1} von {normalizedImages.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={selectedImage.original || selectedImage.src}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-parchment-dark px-3 py-2 text-sm font-semibold text-ink hover:bg-parchment/40"
                                    >
                                        <ExternalLink size={16} />
                                        Original öffnen
                                    </a>
                                </div>
                            </figcaption>
                        </Motion.figure>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ImageGallery;
