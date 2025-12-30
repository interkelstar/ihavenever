import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodePopupProps {
    roomCode: string;
    isOpen: boolean;
    onClose: () => void;
}

const QRCodePopup: React.FC<QRCodePopupProps> = ({ roomCode, isOpen, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    // The full URL for joining the room
    const joinUrl = `${window.location.origin}/v2/room/${roomCode}`;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if click is on the button that opens the popup - if so, let the button's own onClick handle it
            const isToggleButton = target.closest('#qr-code-toggle-btn');

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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={popupRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
                        className="bg-zinc-900/95 backdrop-blur-lg p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 text-white max-w-sm w-full text-center flex flex-col items-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-6">Код комнаты: {roomCode}</h3>

                        <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner">
                            <QRCodeSVG
                                value={joinUrl}
                                size={200}
                                includeMargin={false}
                            />
                        </div>

                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Отсканируйте этот QR-код, чтобы быстро зайти в эту комнату с другого устройства
                        </p>

                        <button
                            onClick={onClose}
                            className="modern-btn btn-secondary w-full py-3 text-sm"
                        >
                            Закрыть
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QRCodePopup;
