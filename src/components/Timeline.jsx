import React, { useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Timeline = ({ events, onSelectEvent }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    // Sort events by year
    const sortedEvents = [...events].sort((a, b) => a.year - b.year);

    return (
        <div className="relative w-full py-8 bg-parchment-dark/30 border-y border-parchment-dark">
            <div className="container mx-auto px-4 relative">
                <h2 className="text-2xl font-serif font-bold mb-6 text-center text-ink/80">Zeitstrahl</h2>

                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-parchment rounded-full shadow-md text-ink hover:text-accent disabled:opacity-50"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-parchment rounded-full shadow-md text-ink hover:text-accent"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-8 overflow-x-auto scrollbar-hide px-12 py-4 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {sortedEvents.map((event, index) => (
                        <Motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 w-64 snap-center cursor-pointer group"
                            onClick={() => onSelectEvent && onSelectEvent(event)}
                        >
                            <div className="relative flex flex-col items-center">
                                <div className="w-4 h-4 rounded-full bg-accent border-4 border-parchment z-10 mb-2 group-hover:scale-125 transition-transform duration-300"></div>
                                <div className="absolute top-2 w-full h-0.5 bg-ink/20 -z-0"></div>

                                <div className="text-center p-4 bg-parchment rounded-sm shadow-sm border border-parchment-dark hover:shadow-md transition-shadow duration-300 w-full">
                                    <span className="block text-2xl font-serif font-bold text-accent mb-1">{event.year}</span>
                                    <h4 className="font-medium text-sm text-ink line-clamp-1 group-hover:text-accent transition-colors">{event.title}</h4>
                                    <p className="text-xs text-ink/60 mt-1">{event.category}</p>
                                </div>
                            </div>
                        </Motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
