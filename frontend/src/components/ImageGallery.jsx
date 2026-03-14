import React, { useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, RotateCcw, X, ZoomIn } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

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
    const [zoom, setZoom] = useState(1);

    const normalizedImages = useMemo(() => {
        if (!Array.isArray(images)) {
            return [];
        }
        return images
            .map((image, index) => normalizeImage(image, index, title || 'Dokument'))
            .filter((image) => Boolean(image?.src));
    }, [images, title]);

    if (normalizedImages.length === 0) return null;

    const openImage = (image) => {
        setSelectedImage(image);
        setZoom(1);
    };

    const closeImage = () => {
        setSelectedImage(null);
        setZoom(1);
    };

    const updateZoom = (value) => {
        setZoom(clampZoom(value));
    };

    const handleImageClick = () => {
        const nextZoom = zoom >= MAX_ZOOM ? MIN_ZOOM : clampZoom(zoom + 0.75);
        updateZoom(nextZoom);
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {normalizedImages.map((img, index) => (
                    <Motion.figure
                        key={img.id || index}
                        whileHover={{ scale: 1.02 }}
                        className="group cursor-pointer overflow-hidden rounded-sm shadow-sm border border-parchment-dark bg-white flex flex-col"
                        onClick={() => openImage(img)}
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
                        onClick={closeImage}
                    >
                        <button
                            className="absolute top-4 right-4 text-parchment hover:text-white transition-colors"
                            onClick={closeImage}
                        >
                            <X size={32} />
                        </button>
                        <Motion.figure
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="flex h-full w-full flex-col rounded-sm border-4 border-parchment bg-white p-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex min-h-0 flex-1 flex-col gap-3">
                                <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-parchment-dark/60 bg-white/95 px-4 py-3 backdrop-blur-sm">
                                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink/70">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-2 border border-parchment-dark rounded-sm hover:bg-parchment/40"
                                            onClick={closeImage}
                                        >
                                            <X size={14} />
                                            Schließen
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-2 border border-parchment-dark rounded-sm hover:bg-parchment/40 disabled:opacity-50"
                                            onClick={() => updateZoom(zoom - ZOOM_STEP)}
                                            disabled={zoom <= MIN_ZOOM}
                                        >
                                            <Minus size={14} />
                                            Verkleinern
                                        </button>
                                        <span className="min-w-16 text-center font-semibold">Zoom: {(zoom * 100).toFixed(0)}%</span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-2 border border-parchment-dark rounded-sm hover:bg-parchment/40 disabled:opacity-50"
                                            onClick={() => updateZoom(zoom + ZOOM_STEP)}
                                            disabled={zoom >= MAX_ZOOM}
                                        >
                                            <Plus size={14} />
                                            Vergrößern
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-2 border border-parchment-dark rounded-sm hover:bg-parchment/40 disabled:opacity-50"
                                            onClick={() => updateZoom(1)}
                                            disabled={zoom === 1}
                                        >
                                            <RotateCcw size={14} />
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className="relative z-10 min-h-0 flex-1 overflow-auto rounded-sm border border-parchment-dark/60 bg-parchment/20 cursor-zoom-in"
                                    onClick={handleImageClick}
                                    role="presentation"
                                >
                                    <img
                                        src={selectedImage.src}
                                        alt={selectedImage.title}
                                        className="h-full w-full object-contain transition-transform duration-200 origin-center"
                                        style={{ transform: `scale(${zoom})` }}
                                    />
                                </div>
                            </div>
                            <figcaption className="pt-3 text-center space-y-1">
                                <p className="text-base font-semibold text-ink">{selectedImage.title}</p>
                                {selectedImage.description && (
                                    <p className="text-sm text-ink/70">{selectedImage.description}</p>
                                )}
                                <p className="text-xs text-ink/60">Tipp: Bild im Overlay anklicken, um weiter zu zoomen.</p>
                            </figcaption>
                        </Motion.figure>
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ImageGallery;
