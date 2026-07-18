import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import { posthog } from '../analytics';
import ModalShell from './ModalShell';

interface CoffeeGatePopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const CoffeeGatePopup: React.FC<CoffeeGatePopupProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2>(1);

    const handleBuyClick = () => {
        posthog.capture('coffee_gate_buy_click', { step });
        window.dispatchEvent(new Event('trigger-bmc-widget'));
    };

    const handleFreeClick = () => {
        posthog.capture('coffee_gate_free_click');
        setStep(2);
    };

    const handlePromiseClick = () => {
        posthog.capture('coffee_gate_promise_click');
        onClose();
    };

    const handleBackToStep1 = () => {
        posthog.capture('coffee_gate_back_to_payment');
        setStep(1);
    };

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            closeOnOverlayClick={false}
            zIndexClassName="z-[1002]"
            overlayBackground="rgba(0,0,0,0.75)"
            overlayBlur="blur(12px)"
            cardClassName="bg-zinc-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20 text-white max-w-md w-full text-center flex flex-col items-center overflow-hidden"
            springDuration={0.4}
            springBounce={0.25}
        >
            <div className="text-5xl mb-4">☕️</div>

            <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-4">
                                        {t('coffee_gate_title')}
                                    </h2>
                                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                        {t('coffee_gate_desc')}
                                    </p>

                                    <div className="flex flex-col gap-3 w-full">
                                        <button
                                            onClick={handleBuyClick}
                                            className="modern-btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                                        >
                                            <span>☕️</span> {t('coffee_gate_buy_btn')}
                                        </button>
                                        <button
                                            onClick={handleFreeClick}
                                            className="modern-btn btn-secondary w-full py-3 text-sm font-semibold"
                                        >
                                            {t('coffee_gate_free_btn')}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step-2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-4">
                                        {t('coffee_gate_confirm_title')}
                                    </h2>
                                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                        {t('coffee_gate_confirm_desc')}
                                    </p>

                                    <div className="flex flex-col gap-3 w-full">
                                        <button
                                            onClick={handlePromiseClick}
                                            className="modern-btn btn-primary w-full py-3 text-sm font-bold"
                                        >
                                            {t('coffee_gate_promise_btn')}
                                        </button>
                                        <button
                                            onClick={handleBackToStep1}
                                            className="modern-btn btn-secondary w-full py-3 text-sm font-semibold"
                                        >
                                            {t('coffee_gate_back_btn')}
                                        </button>
                                    </div>
                                </motion.div>
            )}
            </AnimatePresence>
        </ModalShell>
    );
};

export default CoffeeGatePopup;
