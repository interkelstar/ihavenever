import React, { useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import ModalShell from './ModalShell';

interface BecomeHostWarningPopupProps {
    roomCode: string;
    isOpen: boolean;
    onClose: () => void;
}

const BecomeHostWarningPopup: React.FC<BecomeHostWarningPopupProps> = ({ roomCode, isOpen, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

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
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            zIndexClassName="z-[1001]"
            overlayBackground="rgba(0,0,0,0.6)"
            overlayBlur="blur(8px)"
            cardClassName="bg-zinc-900/95 backdrop-blur-lg p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 text-white max-w-sm w-full text-justify flex flex-col items-center overflow-hidden"
            springDuration={0.3}
            springBounce={0.3}
            cardRef={popupRef}
        >
            <div className="text-4xl mb-4">⚠️{t('host_warning_title')}⚠️</div>

            <p className="text-gray-200 text-base mb-8 leading-relaxed">
                {t('host_warning_desc')}
            </p>

            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={onClose}
                    className="modern-btn btn-primary w-full py-3 text-sm"
                >
                    {t('host_warning_cancel')}
                </button>
                <button
                    onClick={handleConfirm}
                    className="modern-btn btn-secondary w-full py-3 text-sm"
                >
                    {t('host_warning_confirm')}
                </button>
            </div>
        </ModalShell>
    );
};

export default BecomeHostWarningPopup;
