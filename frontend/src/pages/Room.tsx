import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postQuestion, checkRoomExists } from '../api/client';
import { motion } from 'framer-motion';

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
                const response = await fetch('/v2-static/common.txt');
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
                        required
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
                    <p className="text-secondary">Код комнаты: <span className="text-white font-bold">{code}</span></p>
                </div>
            </form>
        </motion.div>
    );
};

export default Room;
