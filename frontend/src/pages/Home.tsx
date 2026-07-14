import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, checkRoomExists } from '../api/client';
import { motion } from 'framer-motion';
import CodeInput from '../components/CodeInput';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from '../i18n';

const Home: React.FC = () => {
    const { language, setLanguage, t } = useTranslation();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCreateGame = async () => {
        setLoading(true);
        setError(null);
        try {
            const newRoom = await createRoom(language);
            navigate(`/room/${newRoom.code}/host`);
        } catch (error) {
            console.error("Failed to create room", error);
            setError(t('error_create'));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code) {
            setError(t('error_no_code'));
            return;
        }

        if (code.length !== 6) {
            setError(t('error_wrong_length'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const roomData = await checkRoomExists(parseInt(code));
            if (roomData) {
                setLanguage(roomData.language);
                navigate(`/room/${code}`);
            } else {
                setError(t('error_not_found', { code }));
            }
        } catch (error) {
            console.error("Failed to check room existence", error);
            setError(t('error_validation'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Elegant glassmorphic Language Dropdown in the top-right of the viewport */}
            <LanguageSelector />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="glass-card">
                    <h1>{t('title')}</h1>

                    <div className="mb-6">
                        <h2>{t('subtitle')}</h2>
                        <button
                            onClick={handleCreateGame}
                            className="modern-btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? t('loading') : t('create_btn')}
                        </button>
                    </div>

                    <h2 style={{ marginTop: '16px', marginBottom: '4px' }}>{t('or')}</h2>

                    <form onSubmit={handleJoinGame}>
                        <div className="mb-4">
                            <label className="block text-center text-secondary mb-2 text-sm tracking-wider">
                                {t('room_code_label')}
                            </label>
                            <CodeInput
                                value={code}
                                onChange={setCode}
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
                            {loading ? t('checking') : t('join_btn')}
                        </button>
                    </form>
                </div>
            </motion.div>
        </>
    );
};

export default Home;
