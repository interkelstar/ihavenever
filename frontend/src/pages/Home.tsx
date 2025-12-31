import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, checkRoomExists } from '../api/client';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCreateGame = async () => {
        setLoading(true);
        setError(null);
        try {
            const newRoom = await createRoom();
            navigate(`/room/${newRoom.code}/host`);
        } catch (error) {
            console.error("Failed to create room", error);
            setError("Не удалось создать комнату. Попробуйте еще раз.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code) {
            setError("Пожалуйста, введите код комнаты.");
            return;
        }

        if (code.length !== 6) {
            setError("Код должен состоять из 6 цифр.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const exists = await checkRoomExists(parseInt(code));
            if (exists) {
                navigate(`/room/${code}`);
            } else {
                setError(`Комната ${code} не найдена.`);
            }
        } catch (error) {
            console.error("Failed to check room existence", error);
            setError("Произошла ошибка при проверке комнаты.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="glass-card">
                <h1>Я никогда не...</h1>

                <div className="mb-6">
                    <h2>Чтобы начать играть ты можешь</h2>
                    <button
                        onClick={handleCreateGame}
                        className="modern-btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Создать новую игру'}
                    </button>
                </div>

                <div className="my-6">
                    <h2>Либо</h2>
                </div>

                <form onSubmit={handleJoinGame}>
                    <div className="mb-4">
                        <input
                            type="number"
                            className="modern-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Ввести тут 6 цифр кода"
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <div className="modern-alert alert-error mb-4">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="modern-btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Проверка...' : 'Присоединиться'}
                    </button>
                </form>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-2 text-center"
            >
                <div className="inline-block max-w-[345px] px-8 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-sm leading-relaxed">
                    Новый год, новые вопросы, новая версия! Старая доступна <a href="/old" className="text-accent hover:underline font-medium">тут</a>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Home;
