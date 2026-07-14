import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { loadQuestions, uploadQuestions, checkRoomExists } from '../api/client';
import { motion } from 'framer-motion';
import { posthog } from '../analytics';
import { useTranslation } from '../i18n';

const Host: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { language, setLanguage, t } = useTranslation();

    const [datasetName, setDatasetName] = useState('common');
    const [size, setSize] = useState(10);
    const [loadStatus, setLoadStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [importStatus, setImportStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [customFile, setCustomFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const validate = async () => {
            if (!code) return;
            try {
                const roomData = await checkRoomExists(parseInt(code));
                if (roomData) {
                    setLanguage(roomData.language);
                } else {
                    navigate('/404');
                }
            } catch (error) {
                console.error("Failed to validate room", error);
            }
        };
        validate();
    }, [code, navigate, setLanguage]);

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
        setLoadStatus(null);

        try {
            const count = await loadQuestions(parseInt(code), { size, datasetName });
            if (count === 0) {
                setLoadStatus({ text: t('load_status_duplicate'), type: 'success' });
            } else {
                setLoadStatus({ text: t('load_status_success', { count }), type: 'success' });
                posthog.capture('questions_imported', {
                    source: 'host_page',
                    count: count,
                    dataset: datasetName,
                    size: size
                });
            }
        } catch (error) {
            console.error("Failed to load questions", error);
            setLoadStatus({ text: t('load_status_error'), type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !customFile) return;
        setIsLoading(true);
        setImportStatus(null);

        try {
            const count = await uploadQuestions(parseInt(code), customFile);
            setImportStatus({ text: t('upload_status_success', { count }), type: 'success' });
            posthog.capture('own_file_uploaded', {
                source: 'host_page',
                count: count
            });
            setCustomFile(null);
        } catch (error) {
            console.error("Failed to upload file", error);
            setImportStatus({ text: t('upload_status_error'), type: 'error' });
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
                <h1>{t('room_number')}</h1>
                <h1 className="text-6xl -mt-4 !mb-0">{code}</h1>
            </div>

            <div className="glass-card mb-5">
                <p className="text-center text-lg mb-4">
                    {t('room_created_desc')}
                </p>

                <div className="qr-container">
                    <QRCodeSVG value={joinUrl} size={200} />
                </div>
            </div>

            <div className="glass-card">
                <p className="text-center text-lg mb-4">
                    {t('load_dataset_desc')}
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
                                <option value="common">{t('dataset_common')}</option>
                                <option value="horny">{t('dataset_horny')}</option>
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
                        {isLoading ? t('loading') : t('load_btn')}
                    </button>
                </form>

                <div className="text-center my-6 pt-5 border-t border-white/10">
                    <p className="mb-2">{t('upload_file_desc')}</p>
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
                            {isLoading ? t('loading') : t('upload_btn')}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 pt-5 border-t border-white/10">
                    <Link to={`/room/${code}/game`} target="_blank" style={{ textDecoration: 'none' }}>
                        <button className="modern-btn btn-primary">
                            {t('to_questions_btn')}
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Host;
