import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

const ImageGallery = ({ images, title }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    if (!images || images.length === 0) return null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((img, index) => (
                    <Motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        className="relative group cursor-pointer overflow-hidden rounded-sm shadow-sm border border-parchment-dark"
                        onClick={() => setSelectedImage(img)}
                    >
                        <img
                            src={img}
                            alt={`${title} - Ansicht ${index + 1}`}
                            className="w-full h-64 object-cover sepia-[.15] group-hover:sepia-0 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-parchment/90 p-2 rounded-full text-ink">
                                <ZoomIn size={20} />
                            </div>
                        </div>
                    </Motion.div>
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
                        <Motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedImage}
                            alt="Detailansicht"
                            className="max-w-full max-h-[90vh] rounded-sm shadow-2xl border-4 border-parchment"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ImageGallery;
