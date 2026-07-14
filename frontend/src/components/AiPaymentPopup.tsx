import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import { payForRoom } from '../api/client';
import { posthog } from '../analytics';

interface AiPaymentPopupProps {
    roomCode: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AiPaymentPopup: React.FC<AiPaymentPopupProps> = ({ roomCode, isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoToPay = () => {
        posthog.capture('ai_pay_external_click', { roomCode });
        window.open('https://revolut.me/kelstar', '_blank');
    };

    const handleCheckPayment = async () => {
        setLoading(true);
        setError(null);
        posthog.capture('ai_pay_check_click', { roomCode });
        try {
            const roomData = await payForRoom(roomCode);
            if (roomData && roomData.isPaid) {
                posthog.capture('ai_pay_success_confirmed', { roomCode });
                onSuccess();
                onClose();
            } else {
                setError("Платеж еще не подтвержден. Пожалуйста, попробуйте через пару секунд.");
            }
        } catch (err) {
            console.error(err);
            setError("Ошибка при проверке оплаты. Пожалуйста, попробуйте еще раз.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[1002] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
                        className="bg-zinc-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20 text-white max-w-md w-full text-center flex flex-col items-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-5xl mb-4">✨💳✨</div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                            {t('ai_pay_title')}
                        </h2>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                            {t('ai_pay_desc')}
                        </p>

                        {error && (
                            <div className="modern-alert alert-error text-xs mb-5 w-full">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleGoToPay}
                                className="modern-btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                💳 {t('ai_pay_btn')}
                            </button>
                            <button
                                onClick={handleCheckPayment}
                                className="modern-btn btn-secondary w-full py-3 text-sm font-bold"
                                disabled={loading}
                            >
                                {loading ? t('loading') : t('ai_pay_check_btn')}
                            </button>
                            <button
                                onClick={onClose}
                                className="modern-btn btn-secondary w-full py-3 text-sm font-semibold opacity-60 hover:opacity-100"
                                disabled={loading}
                            >
                                {t('ai_pay_cancel')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AiPaymentPopup;
