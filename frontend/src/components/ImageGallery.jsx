import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const normalizeImage = (image, index, title) => {
    if (!image) {
        return null;
    }
    if (typeof image === 'string') {
        return {
            id: `legacy-${index}`,
            src: image,
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
    const normalizedImages = useMemo(() => {
        if (!Array.isArray(images)) {
            return [];
        }
        return images
            .map((image, index) => normalizeImage(image, index, title || 'Dokument'))
            .filter((image) => Boolean(image?.src));
    }, [images, title]);

    if (normalizedImages.length === 0) return null;

    const renderImageCard = (img, index) => {
        const card = (
            <Motion.figure
                whileHover={{ scale: 1.02 }}
                className="group overflow-hidden rounded-sm shadow-sm border border-parchment-dark bg-white flex h-full flex-col"
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
                <figcaption className="border-t border-parchment-dark/60 bg-parchment/30 px-4 py-3 space-y-2">
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
            </Motion.figure>
        );

        if (img.type === 'album' && img.id) {
            return (
                <Link key={img.id || index} to={`/photos/${img.id}`} className="block h-full">
                    {card}
                </Link>
            );
        }

        return (
            <a key={img.id || index} href={img.src} target="_blank" rel="noreferrer" className="block h-full">
                {card}
            </a>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedImages.map((img, index) => renderImageCard(img, index))}
        </div>
    );
};

export default ImageGallery;
