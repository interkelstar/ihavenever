import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BecomeHostPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onBecomeHostClick: () => void;
}

const BecomeHostPopup: React.FC<BecomeHostPopupProps> = ({ isOpen, onClose, onBecomeHostClick }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if click is on the button that opens the popup
            const isToggleButton = target.closest('#settings-toggle-btn');

            if (popupRef.current && !popupRef.current.contains(target) && !isToggleButton) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popupRef}
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    style={{
                        transformOrigin: 'top right',
                        position: 'absolute',
                        top: '50px',
                        right: '0px',
                        width: '280px',
                        zIndex: 1000,
                    }}
                    className="bg-zinc-900/95 backdrop-blur-lg p-5 rounded-2xl shadow-xl border border-white/20 text-white text-center"
                >
                    <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                        Если вы потеряли хоста, то можно
                    </p>
                    <button
                        onClick={onBecomeHostClick}
                        className="modern-btn btn-secondary w-full py-2.5 text-sm"
                    >
                        Стать хостом
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BecomeHostPopup;
