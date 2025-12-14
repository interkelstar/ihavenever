import React, { useState, useEffect } from 'react';
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
    }, [code, navigate]);

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
                <div className="form-group">
                    <label className="text-secondary text-start" style={{ display: 'block', marginBottom: '8px' }}>Я никогда не...</label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="...ел жуков"
                        className="modern-input"
                        required
                        maxLength={255}
                        autoComplete="off"
                    />
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

                <div className="mt-4 text-center">
                    <p className="text-secondary">Код комнаты: <span style={{ color: 'white', fontWeight: 'bold' }}>{code}</span></p>
                </div>
            </form>
        </motion.div>
    );
};

export default Room;
