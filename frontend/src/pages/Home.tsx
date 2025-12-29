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
        if (code.length === 6) {
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
                            min="100000"
                            max="999999"
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <div className="modern-alert alert-error mb-6">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="modern-btn btn-primary"
                        disabled={loading || code.length !== 6}
                    >
                        {loading ? 'Проверка...' : 'Присоединиться'}
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default Home;
