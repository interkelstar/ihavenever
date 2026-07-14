import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadQuestions } from '../api/client';
import { posthog } from '../analytics';
import { useTranslation } from '../i18n';

interface GameSettingsPopupProps {
    roomCode: number;
    isOpen: boolean;
    onClose: () => void;
    resetStatusTrigger?: any;
    onQuestionsLoaded?: () => void;
    analyticsSource?: string;
}

const GameSettingsPopup: React.FC<GameSettingsPopupProps> = ({ roomCode, isOpen, onClose, resetStatusTrigger, onQuestionsLoaded, analyticsSource }) => {
    const [datasetName, setDatasetName] = useState('common');
    const [size, setSize] = useState(10);
    const [loadStatus, setLoadStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    // Clear status when trigger changes
    useEffect(() => {
        setLoadStatus(null);
    }, [resetStatusTrigger]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
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

    const handleLoadQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoadStatus(null);

        try {
            const count = await loadQuestions(roomCode, { size, datasetName });
            if (count === 0) {
                setLoadStatus({ text: t('load_status_duplicate'), type: 'success' });
            } else {
                setLoadStatus({ text: t('load_status_success', { count }), type: 'success' });
                if (onQuestionsLoaded) {
                    onQuestionsLoaded();
                }
                posthog.capture('questions_imported', {
                    source: analyticsSource || 'game_unknown',
                    count: count,
                    dataset: datasetName,
                    size: size
                });
            }
        } catch (error) {
            console.error("Failed to load questions", error);
            setLoadStatus({ text: t('load_status_error'), type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

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
                        width: '320px',
                        zIndex: 1000,
                    }}
                    className="bg-zinc-900/95 backdrop-blur-lg p-5 rounded-2xl shadow-lg border border-white/20 text-white"
                >
                    <h3 className="mt-0 text-lg mb-4 font-semibold">{t('game_settings_title')}</h3>

                    <form onSubmit={handleLoadQuestions}>
                        <div className="mb-0">
                            <label className="block mb-1.5 text-sm text-gray-200">{t('add_questions_label')}</label>
                            <div className="flex gap-2">
                                <select
                                    value={size}
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    className="modern-input flex-1 p-2 text-sm"
                                >
                                    {[10, 20, 30, 40, 50, 100, 200].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <select
                                    value={datasetName}
                                    onChange={(e) => setDatasetName(e.target.value)}
                                    className="modern-input flex-2 p-2 text-sm"
                                >
                                    <option value="common">{t('dataset_common')}</option>
                                    <option value="horny">{t('dataset_horny')}</option>
                                </select>
                            </div>
                        </div>

                        {loadStatus && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`modern-alert alert-${loadStatus.type} text-sm rounded-lg p-2.5 my-2.5 !mt-0 mb-4`}
                            >
                                {loadStatus.text}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="modern-btn btn-secondary w-full p-2 text-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? t('loading') : t('load_btn')}
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GameSettingsPopup;
