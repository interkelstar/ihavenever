import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { loadQuestions, uploadQuestions } from '../api/client';
import { motion } from 'framer-motion';

const Host: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [datasetName, setDatasetName] = useState('common');
    const [size, setSize] = useState(10);
    const [loadStatus, setLoadStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [importStatus, setImportStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Construct the joining URL for the QR code
    const joinUrl = `${window.location.origin}/v2/room/${code}`;

    const handleLoadQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setIsLoading(true);
        setLoadStatus(null); // Clear previous status

        try {
            const count = await loadQuestions(parseInt(code), { size, datasetName });
            if (count === 0) {
                setLoadStatus({ text: "Все вопросы из этого набора уже загружены", type: 'success' });
            } else {
                setLoadStatus({ text: `Успешно загружено ${count} вопросов!`, type: 'success' });
            }
        } catch (error) {
            console.error("Failed to load questions", error);
            setLoadStatus({ text: "Ошибка загрузки вопросов", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !customFile) return;
        setIsLoading(true);
        setImportStatus(null); // Clear previous status

        try {
            const count = await uploadQuestions(parseInt(code), customFile);
            setImportStatus({ text: `Файл успешно загружен! Добавлено ${count} вопросов.`, type: 'success' });
            setCustomFile(null);
            // Reset file input manually if needed or just rely on state
        } catch (error) {
            console.error("Failed to upload file", error);
            setImportStatus({ text: "Ошибка загрузки файла", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-column"
            style={{ width: '100%' }}
        >
            <div className="glass-card text-center">
                <h1 className="mb-2">Комната номер</h1>
                <h1 style={{ fontSize: '4rem', marginTop: '-1rem' }}>{code}</h1>
            </div>

            <div className="glass-card mb-4">
                <p className="fs-4 text-center" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    Комната создана! Остальные могут ввести код или сканировать QR-код, чтобы подключиться.
                </p>

                <div className="qr-container">
                    <QRCodeSVG value={joinUrl} size={200} />
                </div>
            </div>

            <div className="glass-card">
                <p className="fs-4 text-center" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    По желанию загрузи вопросы из набора.
                </p>

                <form onSubmit={handleLoadQuestions} className="mb-4">
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px' }}>Хочу сразу загрузить</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                                value={size}
                                onChange={(e) => setSize(parseInt(e.target.value))}
                                className="modern-input"
                                style={{ flex: 1, marginBottom: 0 }}
                            >
                                {[10, 20, 30, 40, 50, 100, 200].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>

                            <span style={{ color: 'white' }}>вопросов из:</span>

                            <select
                                value={datasetName}
                                onChange={(e) => setDatasetName(e.target.value)}
                                className="modern-input"
                                style={{ flex: 2, marginBottom: 0 }}
                            >
                                <option value="common">Стандартного набора</option>
                                <option value="horny">Пошлого набора</option>
                            </select>
                        </div>
                    </div>

                    {loadStatus && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`modern-alert alert-${loadStatus.type} mb-4`}
                        >
                            {loadStatus.text}
                        </motion.div>
                    )}

                    <button type="submit" className="modern-btn btn-secondary" disabled={isLoading} style={{ marginTop: '15px' }}>
                        Загрузить
                    </button>
                </form>

                <div className="text-center mt-4 mb-4" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <p className="mb-2">А можно загрузить свой файл с вопросами</p>
                    <form onSubmit={handleFileUpload}>
                        <div className="form-group">
                            <input
                                type="file"
                                onChange={(e) => setCustomFile(e.target.files ? e.target.files[0] : null)}
                                className="modern-input"
                                style={{ padding: '10px' }}
                            />
                        </div>

                        {importStatus && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`modern-alert alert-${importStatus.type} mb-4`}
                            >
                                {importStatus.text}
                            </motion.div>
                        )}

                        <button type="submit" className="modern-btn btn-secondary" disabled={!customFile || isLoading}>
                            Импорт
                        </button>
                    </form>
                </div>

                <div className="text-center mt-4" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <Link to={`/room/${code}/game`} target="_blank" style={{ textDecoration: 'none' }}>
                        <button className="modern-btn btn-primary">
                            К вопросам!
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Host;
