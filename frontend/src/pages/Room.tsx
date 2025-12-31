import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postQuestion, checkRoomExists } from '../api/client';
import { motion } from 'framer-motion';
import QRCodePopup from '../components/QRCodePopup';
import BecomeHostPopup from '../components/BecomeHostPopup';
import BecomeHostWarningPopup from '../components/BecomeHostWarningPopup';

const Room: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [okMessage, setOkMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState('...прыгал с парашютом');
    const [rawSuggestion, setRawSuggestion] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isPointerActive = useRef(false);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            // Only grow if focused (to show placeholder/typing) or if there's actual text
            if (isFocused || question) {
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        }
    };

    useEffect(() => {
        const validateRoom = async () => {
            if (!code) return;
            try {
                const exists = await checkRoomExists(parseInt(code));
                if (!exists) {
                    navigate('/404');
                }
            } catch (error) {
                console.error("Error validating room", error);
            }
        };
        validateRoom();

        const loadSuggestions = async () => {
            try {
                const response = await fetch('/common.txt');
                if (response.ok) {
                    const text = await response.text();
                    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    setSuggestions(lines);
                }
            } catch (error) {
                console.error("Error loading suggestions", error);
            }
        };
        loadSuggestions();
    }, [code, navigate]);

    useEffect(() => {
        adjustHeight();
    }, [placeholder, question, isFocused]);

    const refreshPlaceholder = () => {
        if (suggestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * suggestions.length);
            const sug = suggestions[randomIndex];
            setRawSuggestion(sug);
            setPlaceholder('...' + sug);
        } else {
            setRawSuggestion('прыгал с парашютом');
            setPlaceholder('...прыгал с парашютом');
        }
    };

    const handlePointerDown = () => {
        isPointerActive.current = true;

        if (isFocused && !question) {
            // Clicked on an already focused empty field -> use the suggestion
            setQuestion(rawSuggestion);
        } else {
            // Focusing now or field not empty -> roll for new suggestion
            refreshPlaceholder();
        }

        // Reset flag quickly so onFocus can detect it
        setTimeout(() => {
            isPointerActive.current = false;
        }, 100);
    };

    const handleFocus = () => {
        setIsFocused(true);
        // Only refresh if focus was NOT caused by a pointer event (e.g. Tab)
        if (!isPointerActive.current) {
            refreshPlaceholder();
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            if (form) {
                form.requestSubmit();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setOkMessage(null);
        setErrorMessage(null);

        if (!question.trim()) {
            setErrorMessage("Пожалуйста, введите вопрос!");
            return;
        }

        setIsLoading(true);

        if (!code) return;

        try {
            await postQuestion(parseInt(code), { question });
            setOkMessage("Хорошо, давай ещё!");
            setQuestion('');
        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                setErrorMessage("Такой вопрос уже был!");
            } else {
                setErrorMessage("Ошибка при отправке. Попробуйте снова.");
                console.error(error);
            }
        } finally {
            setIsLoading(false);
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
                <BecomeHostPopup
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    onBecomeHostClick={() => {
                        setShowSettings(false);
                        setShowWarning(true);
                    }}
                />
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="glass-card"
            >
                <h1>Задавай свой каверзный вопрос!</h1>

                <form onSubmit={handleSubmit}>
                    <div className="floating-group">
                        <textarea
                            ref={textareaRef}
                            id="question-input"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onPointerDown={handlePointerDown}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="modern-input"
                            maxLength={255}
                            autoComplete="off"
                            rows={1}
                        />
                        <label htmlFor="question-input">Я никогда не...</label>
                    </div>

                    <button type="submit" className="modern-btn btn-primary" disabled={isLoading}>
                        {isLoading ? "Отправка..." : "Отправить!"}
                    </button>

                    {okMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="modern-alert alert-success"
                        >
                            {okMessage}
                        </motion.div>
                    )}

                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="modern-alert alert-error"
                        >
                            {errorMessage}
                        </motion.div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            id="qr-code-toggle-btn"
                            type="button"
                            onClick={() => setShowQR(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-secondary hover:text-white transition-all text-sm cursor-pointer"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="5" height="5" x="3" y="3" rx="1" />
                                <rect width="5" height="5" x="16" y="3" rx="1" />
                                <rect width="5" height="5" x="3" y="16" rx="1" />
                                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                                <path d="M21 21v.01" />
                                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                                <path d="M3 12h.01" />
                                <path d="M12 3h.01" />
                                <path d="M12 16v.01" />
                                <path d="M16 12h1" />
                                <path d="M21 12v.01" />
                                <path d="M12 21v-1" />
                            </svg>
                            <span>Код комнаты: <span className="font-bold">{code}</span></span>
                        </button>
                    </div>
                </form>
            </motion.div>

            {code && (
                <QRCodePopup
                    roomCode={code}
                    isOpen={showQR}
                    onClose={() => setShowQR(false)}
                />
            )}

            {code && (
                <BecomeHostWarningPopup
                    roomCode={code}
                    isOpen={showWarning}
                    onClose={() => setShowWarning(false)}
                />
            )}
        </div>
    );
};

export default Room;
