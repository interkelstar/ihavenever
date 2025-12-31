import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BecomeHostWarningPopupProps {
    roomCode: string;
    isOpen: boolean;
    onClose: () => void;
}

const BecomeHostWarningPopup: React.FC<BecomeHostWarningPopupProps> = ({ roomCode, isOpen, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (popupRef.current && !popupRef.current.contains(target)) {
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

    const handleConfirm = () => {
        const basename = window.location.origin;
        window.open(`${basename}/room/${roomCode}/host`, '_blank');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={popupRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
                        className="bg-zinc-900/95 backdrop-blur-lg p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 text-white max-w-sm w-full text-justify flex flex-col items-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-4xl mb-4">⚠️ВНИМАНИЕ⚠️</div>

                        <p className="text-gray-200 text-base mb-8 leading-relaxed">
                            В игре должен быть только один хост, чтобы точно показались все заданные вопросы, так что нажимайте только в случае если изначальный хост закрыл вкладку, потерял телефон или отключился
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="modern-btn btn-primary w-full py-3 text-sm"
                            >
                                Назад к игре
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="modern-btn btn-secondary w-full py-3 text-sm"
                            >
                                Стать хостом
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BecomeHostWarningPopup;
