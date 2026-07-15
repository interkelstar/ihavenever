import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRandomQuestion, getNotShownCount, downloadQuestions, checkRoomExists, generateAiQuestions } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { posthog } from '../analytics';
import { useTranslation } from '../i18n';

import GameSettingsPopup from '../components/GameSettingsPopup';
import CoffeeGatePopup from '../components/CoffeeGatePopup';
import AiPaymentPopup from '../components/AiPaymentPopup';

interface Question {
    question: string;
}

const Game: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { setLanguage, t } = useTranslation();

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [remainingCount, setRemainingCount] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [wereQuestionsLoaded, setWereQuestionsLoaded] = useState(false);

    // Monetization gate states
    const [questionsShownThisSession, setQuestionsShownThisSession] = useState(0);
    const [gateShown, setGateShown] = useState(false);
    const [showCoffeeGate, setShowCoffeeGate] = useState(false);

    // AI Generation states
    const [isPaid, setIsPaid] = useState(false);
    const [showAiPay, setShowAiPay] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
    const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
    const [aiEnabled, setAiEnabled] = useState(false);

    // Валидация комнаты и определение языка при входе
    useEffect(() => {
        const validate = async () => {
            if (!code) return;
            try {
                const roomData = await checkRoomExists(parseInt(code));
                if (roomData) {
                    setLanguage(roomData.language);
                    setIsPaid(roomData.isPaid);
                    setAiEnabled(roomData.aiEnabled);
                } else {
                    navigate('/404');
                }
            } catch (error) {
                console.error("Failed to validate room in Game screen", error);
            }
        };
        validate();
    }, [code, navigate, setLanguage]);

    const loadNextQuestion = React.useCallback(async () => {
        if (!code) return;
        setIsLoading(true);
        try {
            const questionData = await getRandomQuestion(parseInt(code));
            if (questionData) {
                setCurrentQuestion(questionData);
                setIsFinished(false);
                const count = await getNotShownCount(parseInt(code));
                setRemainingCount(count);

                // Monetization soft gate check after 10 questions shown
                setQuestionsShownThisSession(prev => {
                    const nextCount = prev + 1;
                    if (nextCount === 10 && !gateShown) {
                        setShowCoffeeGate(true);
                    }
                    return nextCount;
                });
            } else {
                setIsFinished(true);
                setCurrentQuestion(null);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                navigate('/404');
                return;
            }
            setIsFinished(true);
            setCurrentQuestion(null);
        } finally {
            setIsLoading(false);
        }
    }, [code, navigate, gateShown]);

    const initialLoadDone = React.useRef(false);

    // Load initial question (only after language/room checks or once mounted)
    useEffect(() => {
        if (!initialLoadDone.current) {
            loadNextQuestion();
            initialLoadDone.current = true;
        }
    }, [loadNextQuestion]);

    // Refresh if questions were loaded when closing settings (only if game was finished)
    useEffect(() => {
        if (!showSettings && wereQuestionsLoaded && isFinished) {
            loadNextQuestion();
            setWereQuestionsLoaded(false);
        }
    }, [showSettings, wereQuestionsLoaded, isFinished, loadNextQuestion]);

    const handleDownload = async () => {
        if (!code) return;
        try {
            const data = await downloadQuestions(parseInt(code));
            const blob = new Blob([data as any], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `questions_${code}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            posthog.capture('questions_downloaded', {
                roomCode: code,
                count: remainingCount
            });
        } catch (error) {
            console.error("Download failed", error);
        }
    };

    const handleGenerateAiQuestions = async () => {
        if (!code) return;
        if (!isPaid) {
            setShowAiPay(true);
            return;
        }

        setAiLoading(true);
        setAiSuccessMessage(null);
        setAiErrorMessage(null);
        posthog.capture('ai_generation_requested', { roomCode: code });
        try {
            const result = await generateAiQuestions(parseInt(code));
            setAiSuccessMessage(t('finished_ai_success', { count: result.count }));
            setWereQuestionsLoaded(true);
            posthog.capture('ai_generation_success', { roomCode: code, count: result.count });
        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status === 402) {
                setIsPaid(false);
                setShowAiPay(true);
            } else if (error.response && error.response.status === 400) {
                setAiErrorMessage(t('finished_ai_error_vibe'));
            } else {
                setAiErrorMessage(t('error_validation'));
            }
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="fixed top-5 right-5 z-50">
                <button
                    id="settings-toggle-btn"
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur border border-white/20 text-white"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                {code && (
                    <GameSettingsPopup
                        roomCode={parseInt(code)}
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        onQuestionsLoaded={() => setWereQuestionsLoaded(true)}
                        resetStatusTrigger={currentQuestion?.question}
                        analyticsSource={isFinished ? 'game_finished' : 'game_active'}
                    />
                )}
            </div>
            <AnimatePresence mode='wait'>
                {!isFinished ? (
                    <motion.div
                        key="game-active"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="glass-card text-center min-h-96 flex flex-col justify-center"
                    >
                        <h1>{t('title')}</h1>

                        <div className="min-h-36 flex items-center justify-center">
                            {isLoading && !currentQuestion ? (
                                <h2>{t('loading')}</h2>
                            ) : (
                                <h2 className="text-white text-3xl">
                                    {currentQuestion ? currentQuestion.question : "..."}
                                </h2>
                            )}
                        </div>

                        <div className="mt-6">
                            <button onClick={loadNextQuestion} className="modern-btn btn-primary max-w-xs">
                                {t('next_btn')}
                            </button>
                        </div>

                        <div className="mt-6 text-secondary">
                            {remainingCount !== 0 && (
                                <p>{t('remaining_count', { count: remainingCount !== null ? remainingCount : '...' })}</p>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="game-finished"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card text-center"
                    >
                        <h1>{t('finished_title')}</h1>

                        <div className="mb-4 mt-2">
                            <button onClick={loadNextQuestion} className="modern-btn btn-primary max-w-xs">
                                {t('finished_check_btn')}
                            </button>
                        </div>

                        <div className="mb-4 mt-2">
                            <h2>{t('finished_desc')}</h2>
                            <button onClick={() => setShowSettings(true)} className="modern-btn btn-secondary max-w-xs">
                                {t('finished_load_more_btn')}
                            </button>
                        </div>

                        {/* AI Questions Generation block */}
                        {aiEnabled && (
                            <div className="mb-4 mt-6 pt-5 border-t border-white/10 flex flex-col items-center">
                                <h2>{t('finished_ai_title')}</h2>
                                <p className="text-secondary text-sm mb-4 max-w-sm">
                                    {t('finished_ai_desc')}
                                </p>
                                <button
                                    onClick={handleGenerateAiQuestions}
                                    className="modern-btn btn-primary max-w-xs font-bold"
                                    disabled={aiLoading}
                                >
                                    {aiLoading ? t('finished_ai_loading') : t('finished_ai_btn')}
                                </button>

                                {aiSuccessMessage && (
                                    <div className="modern-alert alert-success text-xs mt-3 w-full max-w-xs">
                                        {aiSuccessMessage}
                                    </div>
                                )}
                                {aiErrorMessage && (
                                    <div className="modern-alert alert-error text-xs mt-3 w-full max-w-xs">
                                        {aiErrorMessage}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4 mt-6 pt-5 border-t border-white/10 flex flex-col items-center">
                            <h2>{t('finished_download_desc')}</h2>
                            <button onClick={handleDownload} className="modern-btn btn-secondary max-w-xs">
                                {t('finished_download_btn')}
                            </button>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-base">
                                {t('coffee_donate')}{' '}
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(new Event('trigger-bmc-widget'));
                                    }}
                                    className="text-accent underline cursor-pointer bg-transparent border-0 p-0 font-medium inline"
                                >
                                    {t('coffee_donate_btn')}
                                </button>
                            </h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coffee payment soft gate */}
            <CoffeeGatePopup
                isOpen={showCoffeeGate}
                onClose={() => {
                    setShowCoffeeGate(false);
                    setGateShown(true);
                }}
            />

            {/* AI Generation hard gate */}
            {aiEnabled && code && (
                <AiPaymentPopup
                    roomCode={parseInt(code)}
                    isOpen={showAiPay}
                    onClose={() => setShowAiPay(false)}
                    onSuccess={() => setIsPaid(true)}
                />
            )}
        </div>
    );
};

export default Game;
