import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRandomQuestion, getNotShownCount, downloadQuestions } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

import GameSettingsPopup from '../components/GameSettingsPopup';

interface Question {
    question: string;
}

const Game: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [remainingCount, setRemainingCount] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [wereQuestionsLoaded, setWereQuestionsLoaded] = useState(false);

    const loadNextQuestion = React.useCallback(async () => {
        if (!code) return;
        setIsLoading(true);
        try {
            const questionData = await getRandomQuestion(parseInt(code));
            if (questionData) {
                setCurrentQuestion(questionData);
                setIsFinished(false);
                // Update count
                const count = await getNotShownCount(parseInt(code));
                setRemainingCount(count);
            } else {
                setIsFinished(true);
                setCurrentQuestion(null);
            }
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                navigate('/404');
                return;
            }
            // 204 No Content means no more questions usually, or we catch it here
            setIsFinished(true);
            setCurrentQuestion(null);
        } finally {
            setIsLoading(false);
        }
    }, [code, navigate]);

    const initialLoadDone = React.useRef(false);

    // Load initial question
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
        } catch (error) {
            console.error("Download failed", error);
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
                        <h1 className="mb-6">Я никогда не...</h1>

                        <div className="min-h-36 flex items-center justify-center">
                            {isLoading && !currentQuestion ? (
                                <h2>Загрузка...</h2>
                            ) : (
                                <h2 className="text-white text-3xl">
                                    {currentQuestion ? currentQuestion.question : "..."}
                                </h2>
                            )}
                        </div>

                        <div className="mt-6">
                            <button onClick={loadNextQuestion} className="modern-btn btn-primary max-w-xs">
                                Следующий!
                            </button>
                        </div>

                        <div className="mt-6 text-secondary">
                            <p>Осталось вопросов: {remainingCount !== null ? remainingCount : '...'}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="game-finished"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card text-center"
                    >
                        <h1>Кончились вопросы!</h1>

                        <div className="mb-6">
                            <button onClick={loadNextQuestion} className="modern-btn btn-primary max-w-xs">
                                Точно?
                            </button>
                        </div>

                        <div className="mb-6">
                            <h2>Поздравляю, это были все вопросы, заданные в этой комнате</h2>
                            <button onClick={() => setShowSettings(true)} className="modern-btn btn-secondary max-w-xs">
                                Загрузить ещё!
                            </button>
                        </div>

                        <div className="mb-6 flex flex-col gap-4 items-center">
                            <h2>Теперь их можно скачать на память!</h2>
                            <button onClick={handleDownload} className="modern-btn btn-secondary max-w-xs">
                                Скачать все вопросы
                            </button>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-base">И если игра вам понравилась, можете кинуть мне $5 на <a href="https://revolut.me/kelstar" target="_blank" className="text-accent">Revolut</a></h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Game;
