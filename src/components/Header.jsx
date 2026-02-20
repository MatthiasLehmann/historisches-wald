import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo-historisches-wald.png';

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
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative w-12 h-12 rounded-sm overflow-hidden border border-parchment-dark shadow-sm bg-parchment">
                        <img
                            src={logo}
                            alt="Historisches Wald Logo"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
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
                                <Motion.div
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
                    <Motion.div
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
                    </Motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
