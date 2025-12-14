import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadQuestions } from '../api/client';

interface GameSettingsPopupProps {
    roomCode: number;
    isOpen: boolean;
    onClose: () => void;
    resetStatusTrigger?: any;
    onQuestionsLoaded?: () => void;
}

const GameSettingsPopup: React.FC<GameSettingsPopupProps> = ({ roomCode, isOpen, onClose, resetStatusTrigger, onQuestionsLoaded }) => {
    const [datasetName, setDatasetName] = useState('common');
    const [size, setSize] = useState(10);
    const [loadStatus, setLoadStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Clear status when trigger changes
    useEffect(() => {
        setLoadStatus(null);
    }, [resetStatusTrigger]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is on the gear button - if so, let the button's own onClick handle it
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
                setLoadStatus({ text: "Все вопросы из этого набора уже загружены", type: 'success' });
            } else {
                setLoadStatus({ text: `Успешно загружено ${count} вопросов!`, type: 'success' });
                if (onQuestionsLoaded) {
                    onQuestionsLoaded();
                }
            }
        } catch (error) {
            console.error("Failed to load questions", error);
            setLoadStatus({ text: "Ошибка загрузки вопросов", type: 'error' });
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
                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                        backdropFilter: 'blur(10px)',
                        padding: '20px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white'
                    }}
                >
                    <h3 style={{ marginTop: 0, fontSize: '1.2rem', marginBottom: '15px' }}>Настройки игры</h3>

                    <form onSubmit={handleLoadQuestions}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#eee' }}>Добавить вопросы</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    value={size}
                                    onChange={(e) => setSize(parseInt(e.target.value))}
                                    className="modern-input"
                                    style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                                >
                                    {[10, 20, 30, 40, 50, 100, 200].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <select
                                    value={datasetName}
                                    onChange={(e) => setDatasetName(e.target.value)}
                                    className="modern-input"
                                    style={{ flex: 2, padding: '8px', fontSize: '0.9rem' }}
                                >
                                    <option value="common">Стандартных</option>
                                    <option value="horny">Пошлых</option>
                                </select>
                            </div>
                        </div>

                        {loadStatus && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`modern-alert alert-${loadStatus.type}`}
                                style={{
                                    padding: '10px',
                                    marginTop: '10px',
                                    marginBottom: '10px',
                                    fontSize: '0.85rem',
                                    borderRadius: '8px'
                                }}
                            >
                                {loadStatus.text}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="modern-btn btn-secondary"
                            disabled={isLoading}
                            style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
                        >
                            {isLoading ? "Загрузка..." : "Загрузить"}
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GameSettingsPopup;
