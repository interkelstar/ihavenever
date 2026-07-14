import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, Language } from '../i18n';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language; label: string }[] = [
        { code: 'ru', label: 'ru' },
        { code: 'en', label: 'en' },
        { code: 'uk', label: 'ua' },
        { code: 'pl', label: 'pl' }
    ];

    const currentLabel = languages.find(l => l.code === language)?.label || 'ru';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={dropdownRef} className="fixed top-6 right-6 z-50">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer transition-all shadow-md text-sm font-semibold tracking-wide"
            >
                <span className="uppercase">{currentLabel}</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-white/70 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-zinc-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-1.5 min-w-[110px] flex flex-col gap-1 z-50"
                    >
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                                    language === lang.code
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <span className="uppercase">{lang.label}</span>
                                {language === lang.code && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;
