import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Startseite', path: '/' },
        { name: 'Archiv', path: '/archive' },
        { name: 'Zeitleiste', path: '/timeline' },
    ];

    const isActive = (path) => {
        return location.pathname === path ? 'text-accent font-semibold' : 'text-ink/80 hover:text-accent';
    };

    return (
        <header className="bg-parchment/90 backdrop-blur-sm sticky top-0 z-50 border-b border-parchment-dark shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-ink text-parchment rounded-sm group-hover:bg-accent transition-colors duration-300">
                        <ScrollText size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-bold leading-none tracking-tight">Historisches Wald</h1>
                        <p className="text-xs text-ink/60 uppercase tracking-widest font-sans">Digitales Archiv</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-8 font-sans">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`transition-colors duration-200 relative ${isActive(item.path)}`}
                        >
                            {item.name}
                            {location.pathname === item.path && (
                                <motion.div
                                    layoutId="underline"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-ink p-2"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-parchment border-t border-parchment-dark overflow-hidden"
                    >
                        <nav className="flex flex-col p-4 gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`py-2 px-4 rounded-md ${location.pathname === item.path ? 'bg-parchment-dark text-black' : 'text-ink/80'}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
