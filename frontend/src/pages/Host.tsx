import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { loadQuestions, uploadQuestions } from '../api/client';
import { motion } from 'framer-motion';
import { posthog } from '../analytics';

const Host: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [datasetName, setDatasetName] = useState('common');
    const [size, setSize] = useState(10);
    const [loadStatus, setLoadStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [importStatus, setImportStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Construct the joining URL for the QR code
    const constructJoinUrl = () => {
        const url = new URL(`${window.location.origin}/room/${code}`);
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
            url.searchParams.set(key, value);
        });
        url.searchParams.set('source', 'host_qr');
        return url.toString();
    };
    const joinUrl = constructJoinUrl();

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
                posthog.capture('questions_imported', {
                    source: 'host_page',
                    count: count,
                    dataset: datasetName,
                    size: size
                });
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
            posthog.capture('own_file_uploaded', {
                source: 'host_page',
                count: count
            });
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
                <h1>Комната номер</h1>
                <h1 className="text-6xl -mt-4 !mb-0">{code}</h1>
            </div>

            <div className="glass-card mb-5">
                <p className="text-center text-lg mb-4">
                    Комната создана! Остальные могут ввести код или сканировать QR-код, чтобы подключиться.
                </p>

                <div className="qr-container">
                    <QRCodeSVG value={joinUrl} size={200} />
                </div>
            </div>

            <div className="glass-card">
                <p className="text-center text-lg mb-4">
                    По желанию загрузи вопросы из набора.
                </p>

                <form onSubmit={handleLoadQuestions} className="mb-6">
                    <div className="mb-4">
                        <div className="flex gap-2.5 items-center">
                            <select
                                value={size}
                                onChange={(e) => setSize(parseInt(e.target.value))}
                                className="modern-input flex-1 !mb-0"
                            >
                                {[10, 20, 30, 40, 50, 100, 200].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <select
                                value={datasetName}
                                onChange={(e) => setDatasetName(e.target.value)}
                                className="modern-input flex-2 !mb-0"
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
                        >
                            {loadStatus.text}
                        </motion.div>
                    )}

                    <button type="submit" className="modern-btn btn-secondary mt-4" disabled={isLoading}>
                        Загрузить
                    </button>
                </form>

                <div className="text-center my-6 pt-5 border-t border-white/10">
                    <p className="mb-2">А можно загрузить свой файл с вопросами</p>
                    <form onSubmit={handleFileUpload}>
                        <div className="form-group">
                            <input
                                type="file"
                                onChange={(e) => setCustomFile(e.target.files ? e.target.files[0] : null)}
                                className="modern-input p-2.5"
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

                <div className="text-center mt-6 pt-5 border-t border-white/10">
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
