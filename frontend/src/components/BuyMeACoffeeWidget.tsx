import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import { posthog } from '../analytics';

const BuyMeACoffeeWidget: React.FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Listen for custom trigger event to open the coffee payment modal programmatically
    useEffect(() => {
        const handleTrigger = () => {
            setIsOpen(true);
            posthog.capture('bmc_widget_programmatic_trigger');
        };
        window.addEventListener('trigger-bmc-widget', handleTrigger);
        return () => window.removeEventListener('trigger-bmc-widget', handleTrigger);
    }, []);

    // Tooltip timer logic (show on language change and mount, hide after 5 seconds)
    useEffect(() => {
        setShowTooltip(true);
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, [t]);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleToggleModal = () => {
        posthog.capture('bmc_widget_click', { newState: !isOpen });
        setIsOpen(!isOpen);
        setShowTooltip(false);
    };

    return (
        <>
            {/* Tooltip cloud (placed relative to viewport, 1-in-1 with original position) */}
            <AnimatePresence>
                {showTooltip && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: 10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed z-[1000] bg-white text-[#0D0C22] shadow-[0px_2px_5px_rgba(0,0,0,0.05),0px_8px_40px_rgba(0,0,0,0.04),0px_0px_2px_rgba(0,0,0,0.15)] rounded text-[18px] leading-[1.5] max-w-[260px] w-auto pointer-events-none"
                        style={{
                            right: '84px',
                            bottom: '21px',
                            padding: '16px 16px',
                            fontFamily: '"Avenir Book", "Segoe UI", sans-serif',
                            transformOrigin: 'right bottom'
                        }}
                    >
                        {t('bmc_tooltip')}
                        {/* Little white triangle pointing to the button */}
                        <div 
                            className="absolute bg-white" 
                            style={{
                                right: '-6px',
                                bottom: '23px',
                                width: '12px',
                                height: '12px',
                                transform: 'rotate(45deg)',
                                boxShadow: '2px -2px 2px rgba(0, 0, 0, 0.02)'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button (original dimensions: 64x64, right: 15px, bottom: 23px) */}
            <div 
                className="fixed z-[1000]"
                style={{
                    right: '15px',
                    bottom: '23px'
                }}
            >
                <motion.button
                    onClick={handleToggleModal}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-full flex items-center justify-center cursor-pointer border-none focus:outline-none"
                    style={{
                        width: '64px',
                        height: '64px',
                        background: '#BD5FFF',
                        boxShadow: '0 4px 8px rgba(0,0,0,.15)',
                        transition: 'background-color 0.25s ease'
                    }}
                >
                    {isOpen ? (
                        /* Arrow chevron down to close */
                        <svg 
                            style={{ width: '16px', height: '16px' }} 
                            width="16" 
                            height="10" 
                            viewBox="0 0 16 10" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M14.1133 0L8 6.11331L1.88669 0L0 1.88663L8 9.88663L16 1.88663L14.1133 0Z" fill="white"/>
                        </svg>
                    ) : (
                        /* Original coffee cup SVG */
                        <img 
                            src="https://cdn.buymeacoffee.com/widget/assets/coffee%20cup.svg" 
                            alt="Buy Me a Coffee" 
                            style={{ height: '36px', width: '36px', margin: 0, padding: 0 }}
                        />
                    )}
                </motion.button>
            </div>

            {/* Coffee payment Overlay containing the original BMC widget frame */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-white/10 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden w-full flex flex-col relative no-scrollbar"
                            style={{ width: '420px', height: '85vh', minHeight: '640px', maxHeight: '800px' }}
                        >
                            {/* Close button inside modal header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/40">
                                <span className="font-bold text-white flex items-center gap-2">
                                    ☕️ Buy Me a Coffee
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white font-bold cursor-pointer hover:bg-white/20 transition-all border-none"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 bg-white relative overflow-hidden no-scrollbar">
                                <iframe
                                    src="https://www.buymeacoffee.com/widget/page/kelstar?description=Support%20me%20on%20Buy%20me%20a%20coffee!&color=%23BD5FFF"
                                    title="Buy Me a Coffee"
                                    className="w-full h-full border-none no-scrollbar"
                                    scrolling="no"
                                    style={{ overflow: 'hidden' }}
                                    allow="payment *"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BuyMeACoffeeWidget;
