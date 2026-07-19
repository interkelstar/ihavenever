import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface HistoricalStat {
    id: number;
    creationDate: string;
    questionsTotal: number;
    questionsShown: number;
    questionsPredefined: number;
}

interface ActiveRoom {
    code: number;
    dateCreated: string;
    isPaid: boolean;
    questionsTotal: number;
    questionsShown: number;
    questionsPredefined: number;
}

interface StatsData {
    historical: HistoricalStat[];
    activeRooms: ActiveRoom[];
    totalActiveRooms: number;
    totalActiveQuestions: number;
    totalActiveShownQuestions: number;
    totalActivePredefinedQuestions: number;
}

interface AdminQuestion {
    id: number;
    question: string;
    roomCode: number;
    isPredefined: boolean;
    wasShown: boolean;
    dateAdded: string;
}

interface ArchivedRoom {
    roomCode: number;
    language: string;
    questionCount: number;
    lastArchived: string;
}

interface AiPreviewResponse {
    prompt?: string;
    language?: string;
    seedCount?: number;
    questions?: string[];
}

interface AiGenResult {
    id: string;
    timestamp: string;
    roomCode: number | null;
    language: string;
    seedCount: number;
    questions: string[];
    prompt: string;
    editedPrompt: string;
    collapsed: boolean;
}

const AI_LANGUAGES: { code: string; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
    { code: 'uk', label: 'UK' },
    { code: 'pl', label: 'PL' }
];

const MAX_AI_RESULTS = 3;

// Generate demo data to show if database is empty
const generateDemoData = (): StatsData => {
    const now = new Date();
    const historical: HistoricalStat[] = Array.from({ length: 30 }).map((_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - (30 - i) * 1.5); // Spread over ~45 days
        const questionsTotal = Math.floor(Math.random() * 30) + 15;
        const questionsShown = Math.floor(Math.random() * (questionsTotal - 5)) + 5;
        const questionsPredefined = Math.floor(questionsTotal * (Math.random() * 0.4 + 0.5)); // 50-90% predefined
        return {
            id: i + 1,
            creationDate: date.toISOString(),
            questionsTotal,
            questionsShown,
            questionsPredefined
        };
    });

    const activeRooms: ActiveRoom[] = [
        { code: 789456, dateCreated: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), isPaid: true, questionsTotal: 25, questionsShown: 12, questionsPredefined: 18 },
        { code: 456123, dateCreated: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), isPaid: false, questionsTotal: 40, questionsShown: 35, questionsPredefined: 20 },
        { code: 112233, dateCreated: new Date(now.getTime() - 1000 * 60 * 360).toISOString(), isPaid: false, questionsTotal: 15, questionsShown: 0, questionsPredefined: 15 },
        { code: 998877, dateCreated: new Date(now.getTime() - 1000 * 60 * 1440 * 2).toISOString(), isPaid: true, questionsTotal: 30, questionsShown: 10, questionsPredefined: 25 }
    ];

    return {
        historical,
        activeRooms,
        totalActiveRooms: activeRooms.length,
        totalActiveQuestions: activeRooms.reduce((sum, r) => sum + r.questionsTotal, 0),
        totalActiveShownQuestions: activeRooms.reduce((sum, r) => sum + r.questionsShown, 0),
        totalActivePredefinedQuestions: activeRooms.reduce((sum, r) => sum + r.questionsPredefined, 0)
    };
};

const AdminStats: React.FC = () => {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);
    const [authRequired, setAuthRequired] = useState(false);
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'historical' | 'questions' | 'ai-lab'>('overview');
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);
    const [questions, setQuestions] = useState<AdminQuestion[]>([]);

    // AI Lab state
    const [aiRooms, setAiRooms] = useState<ArchivedRoom[]>([]);
    const [aiRoomsLoading, setAiRoomsLoading] = useState(false);
    const [aiRoomsError, setAiRoomsError] = useState<string | null>(null);
    const [aiRoomsLoaded, setAiRoomsLoaded] = useState(false);
    const [aiSelectedRoom, setAiSelectedRoom] = useState<number | null>(null);
    const [aiLanguage, setAiLanguage] = useState<string>('ru');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiGenError, setAiGenError] = useState<string | null>(null);
    const [aiResults, setAiResults] = useState<AiGenResult[]>([]);
    const [aiCopiedId, setAiCopiedId] = useState<string | null>(null);

    // Time filter states
    const [timeUnit, setTimeUnit] = useState<'all' | 'month' | 'week'>('all');
    const [timeOffset, setTimeOffset] = useState<number>(0);

    // Load credentials from localStorage if available
    const [authHeader, setAuthHeader] = useState<string | null>(() => {
        return localStorage.getItem('admin_auth_header');
    });

    const fetchStats = async (headerToUse = authHeader) => {
        setLoading(true);
        setAuthError(null);
        try {
            const config = headerToUse ? { headers: { 'Authorization': headerToUse } } : {};
            const [statsRes, qsRes] = await Promise.all([
                axios.get('/admin/api/statistics', config),
                axios.get('/admin/api/questions', config).catch(() => ({ data: [] }))
            ]);
            setData(statsRes.data);
            setQuestions(qsRes.data || []);
            setAuthRequired(false);
            if (headerToUse) {
                localStorage.setItem('admin_auth_header', headerToUse);
                setAuthHeader(headerToUse);
            }
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
            if (error.response && error.response.status === 401) {
                setAuthRequired(true);
                localStorage.removeItem('admin_auth_header');
                setAuthHeader(null);
            } else {
                setAuthError('Не удалось загрузить данные с сервера. Пожалуйста, попробуйте позже.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Панель статистики | Я никогда не...";
        fetchStats();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const credentials = btoa(`${username}:${password}`);
        const header = `Basic ${credentials}`;
        fetchStats(header);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_auth_header');
        setAuthHeader(null);
        setAuthRequired(true);
        setData(null);
    };

    const toggleDemoMode = () => {
        if (isDemo) {
            setIsDemo(false);
            fetchStats();
        } else {
            setIsDemo(true);
            setData(generateDemoData());
            setQuestions([]);
            setAuthRequired(false);
        }
    };

    // Recompute the top-level active-room aggregates from a fresh activeRooms array,
    // so StatsData stays internally consistent even though the UI derives its own
    // numbers from the (filtered) arrays rather than these fields.
    const recomputeActiveAggregates = (activeRooms: ActiveRoom[]) => ({
        totalActiveRooms: activeRooms.length,
        totalActiveQuestions: activeRooms.reduce((sum, r) => sum + r.questionsTotal, 0),
        totalActiveShownQuestions: activeRooms.reduce((sum, r) => sum + r.questionsShown, 0),
        totalActivePredefinedQuestions: activeRooms.reduce((sum, r) => sum + r.questionsPredefined, 0)
    });

    const deleteRoom = async (code: number) => {
        if (!window.confirm(`Вы уверены, что хотите удалить комнату ${code}?`)) return;
        try {
            await axios.delete(`/admin/api/rooms/${code}`, { headers: { 'Authorization': authHeader } });
            setData(prev => {
                if (!prev) return prev;
                const activeRooms = prev.activeRooms.filter(r => r.code !== code);
                return { ...prev, activeRooms, ...recomputeActiveAggregates(activeRooms) };
            });
            // Deleting a room cascades to its questions server-side, so drop them locally too.
            setQuestions(prev => prev.filter(q => q.roomCode !== code));
        } catch (e) {
            console.error(e);
            alert('Ошибка при удалении комнаты');
        }
    };

    const deleteQuestion = async (id: number) => {
        if (!window.confirm('Удалить вопрос?')) return;
        try {
            await axios.delete(`/admin/api/questions/${id}`, { headers: { 'Authorization': authHeader } });
            const deleted = questions.find(q => q.id === id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (deleted) {
                setData(prev => {
                    if (!prev) return prev;
                    const activeRooms = prev.activeRooms.map(r => {
                        if (r.code !== deleted.roomCode) return r;
                        return {
                            ...r,
                            questionsTotal: r.questionsTotal - 1,
                            questionsShown: deleted.wasShown ? r.questionsShown - 1 : r.questionsShown,
                            questionsPredefined: deleted.isPredefined ? r.questionsPredefined - 1 : r.questionsPredefined
                        };
                    });
                    return { ...prev, activeRooms, ...recomputeActiveAggregates(activeRooms) };
                });
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка при удалении вопроса');
        }
    };

    const toggleRoomPaid = async (code: number) => {
        try {
            await axios.patch(`/admin/api/rooms/${code}/toggle-paid`, {}, { headers: { 'Authorization': authHeader } });
            setData(prev => {
                if (!prev) return prev;
                const activeRooms = prev.activeRooms.map(r => r.code === code ? { ...r, isPaid: !r.isPaid } : r);
                return { ...prev, activeRooms };
            });
        } catch (e) {
            console.error(e);
            alert('Ошибка при изменении статуса AI/Play');
        }
    };

    const toggleQuestionShown = async (id: number) => {
        try {
            await axios.patch(`/admin/api/questions/${id}/toggle-shown`, {}, { headers: { 'Authorization': authHeader } });
            const target = questions.find(q => q.id === id);
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, wasShown: !q.wasShown } : q));
            if (target) {
                const delta = target.wasShown ? -1 : 1;
                setData(prev => {
                    if (!prev) return prev;
                    const activeRooms = prev.activeRooms.map(r => {
                        if (r.code !== target.roomCode) return r;
                        return { ...r, questionsShown: r.questionsShown + delta };
                    });
                    return { ...prev, activeRooms, ...recomputeActiveAggregates(activeRooms) };
                });
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка при изменении статуса вопроса');
        }
    };

    // --- AI Lab helpers ---

    const fetchArchivedRooms = async () => {
        setAiRoomsLoading(true);
        setAiRoomsError(null);
        try {
            const config = authHeader ? { headers: { 'Authorization': authHeader } } : {};
            const res = await axios.get('/admin/api/ai/archived-rooms', config);
            setAiRooms(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
            setAiRoomsError('Не удалось загрузить архивные комнаты');
        } finally {
            setAiRoomsLoading(false);
            setAiRoomsLoaded(true);
        }
    };

    useEffect(() => {
        if (activeTab === 'ai-lab' && !aiRoomsLoaded && !aiRoomsLoading) {
            fetchArchivedRooms();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const selectAiRoom = (room: ArchivedRoom) => {
        setAiSelectedRoom(room.roomCode);
        if (room.language && AI_LANGUAGES.some(l => l.code === room.language)) {
            setAiLanguage(room.language);
        }
    };

    const clearAiRoomSelection = () => setAiSelectedRoom(null);

    const runAiPreview = async (body: { roomCode?: number; language?: string; prompt?: string }) => {
        setAiGenerating(true);
        setAiGenError(null);
        try {
            const config = authHeader ? { headers: { 'Authorization': authHeader } } : {};
            const res = await axios.post('/admin/api/ai/preview', body, config);
            const data: AiPreviewResponse = res.data || {};
            const prompt = typeof data.prompt === 'string' ? data.prompt : (body.prompt || '');
            const result: AiGenResult = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                timestamp: new Date().toISOString(),
                roomCode: typeof body.roomCode === 'number' ? body.roomCode : null,
                language: data.language || body.language || aiLanguage,
                seedCount: typeof data.seedCount === 'number' ? data.seedCount : 0,
                questions: Array.isArray(data.questions) ? data.questions : [],
                prompt,
                editedPrompt: prompt,
                collapsed: false
            };
            setAiResults(prev => [result, ...prev.map(r => ({ ...r, collapsed: true }))].slice(0, MAX_AI_RESULTS));
        } catch (e: any) {
            console.error(e);
            const status = e?.response?.status;
            if (status === 503) {
                setAiGenError('Gemini API key не настроен на сервере');
            } else if (status === 502) {
                setAiGenError('Ошибка при обращении к Gemini API');
            } else if (status === 404) {
                setAiGenError('Комната не найдена');
            } else {
                setAiGenError('Не удалось получить превью генерации');
            }
        } finally {
            setAiGenerating(false);
        }
    };

    const handleAiGenerate = () => {
        if (aiSelectedRoom != null) {
            runAiPreview({ roomCode: aiSelectedRoom, language: aiLanguage });
        } else {
            runAiPreview({ language: aiLanguage });
        }
    };

    const handleAiRegenerate = (result: AiGenResult) => {
        const body: { roomCode?: number; language?: string; prompt?: string } = {
            language: result.language,
            prompt: result.editedPrompt
        };
        if (result.roomCode != null) body.roomCode = result.roomCode;
        runAiPreview(body);
    };

    const updateAiEditedPrompt = (id: string, value: string) => {
        setAiResults(prev => prev.map(r => r.id === id ? { ...r, editedPrompt: value } : r));
    };

    const toggleAiResultCollapsed = (id: string) => {
        setAiResults(prev => prev.map(r => r.id === id ? { ...r, collapsed: !r.collapsed } : r));
    };

    const copyAiQuestions = async (result: AiGenResult) => {
        try {
            const text = result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
            await navigator.clipboard.writeText(text);
            setAiCopiedId(result.id);
            setTimeout(() => {
                setAiCopiedId(prev => prev === result.id ? null : prev);
            }, 1500);
        } catch (e) {
            console.error(e);
        }
    };

    if (authRequired) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card max-w-md mx-auto"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Админ-панель</h1>
                    <p className="text-sm text-gray-400">Вход для просмотра статистики проекта</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Имя пользователя</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="modern-input w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="modern-input w-full"
                            required
                        />
                    </div>

                    {authError && (
                        <div className="modern-alert alert-error text-sm">
                            Неверные данные или ошибка сервера. Пожалуйста, проверьте имя пользователя и пароль.
                        </div>
                    )}

                    <button type="submit" className="modern-btn btn-primary w-full mt-6">
                        Войти
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={toggleDemoMode}
                        className="text-xs text-blue-400 hover:text-blue-300 transition underline"
                    >
                        Посмотреть демонстрационный режим
                    </button>
                </div>
            </motion.div>
        );
    }

    if (loading && !data) {
        return (
            <div className="glass-card text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h2 className="text-xl text-white">Загрузка статистики...</h2>
            </div>
        );
    }

    const rawStats = data || generateDemoData();

    // Calculate dates and labels for time filters
    const getPeriodRange = () => {
        let start: Date | null = null;
        let end: Date | null = null;

        if (timeUnit === 'month') {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + timeOffset);
            start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0);
            end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
        } else if (timeUnit === 'week') {
            const targetDate = new Date();
            const day = targetDate.getDay();
            const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(targetDate.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            
            start = new Date(monday.getTime() + timeOffset * 7 * 24 * 60 * 60 * 1000);
            end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000);
        }
        return { start, end };
    };

    const { start, end } = getPeriodRange();

    const getPeriodLabel = () => {
        if (timeUnit === 'all') return 'Все время';
        if (timeUnit === 'month') {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + timeOffset);
            return targetDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        }
        if (timeUnit === 'week' && start && end) {
            return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return '';
    };
    const periodLabel = getPeriodLabel();

    // Filter data by selected date range
    const filteredHistorical = rawStats.historical.filter(h => {
        if (!start || !end) return true;
        const d = new Date(h.creationDate);
        return d >= start && d <= end;
    });

    const filteredActive = rawStats.activeRooms.filter(r => {
        if (!start || !end) return true;
        const d = new Date(r.dateCreated);
        return d >= start && d <= end;
    });

    // Calculations based on filtered data
    const totalHistoricalRooms = filteredHistorical.length;
    const totalRooms = filteredActive.length + totalHistoricalRooms;

    const totalHistoricalQuestions = filteredHistorical.reduce((sum, h) => sum + h.questionsTotal, 0);
    const totalActiveQuestions = filteredActive.reduce((sum, r) => sum + r.questionsTotal, 0);
    const totalQuestions = totalActiveQuestions + totalHistoricalQuestions;

    const totalHistoricalShown = filteredHistorical.reduce((sum, h) => sum + h.questionsShown, 0);
    const totalActiveShown = filteredActive.reduce((sum, r) => sum + r.questionsShown, 0);
    const totalShown = totalActiveShown + totalHistoricalShown;

    const totalHistoricalPredefined = filteredHistorical.reduce((sum, h) => sum + h.questionsPredefined, 0);
    const totalActivePredefined = filteredActive.reduce((sum, r) => sum + r.questionsPredefined, 0);
    const totalPredefined = totalActivePredefined + totalHistoricalPredefined;
    const totalCustom = totalQuestions - totalPredefined;

    const showRate = totalQuestions > 0 ? (totalShown / totalQuestions) * 100 : 0;
    const predefinedRate = totalQuestions > 0 ? (totalPredefined / totalQuestions) * 100 : 0;
    const customRate = 100 - predefinedRate;

    // Process room creation timeline (fill all days for selected week/month or dynamic for all time)
    let timelineData: { date: string; count: number }[] = [];

    const processDateLabel = (date: Date) => {
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    };

    if (timeUnit === 'week' && start) {
        timelineData = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            return { date: processDateLabel(d), count: 0 };
        });
    } else if (timeUnit === 'month' && start && end) {
        const daysInMonth = end.getDate();
        timelineData = Array.from({ length: daysInMonth }).map((_, i) => {
            const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
            return { date: processDateLabel(d), count: 0 };
        });
    }

    const fillTimeline = (dateStr: string) => {
        const d = new Date(dateStr);
        const label = processDateLabel(d);
        const existing = timelineData.find(t => t.date === label);
        if (existing) {
            existing.count++;
        } else if (timeUnit === 'all') {
            timelineData.push({ date: label, count: 1 });
        }
    };

    filteredHistorical.forEach(h => fillTimeline(h.creationDate));
    filteredActive.forEach(r => fillTimeline(r.dateCreated));

    if (timeUnit === 'all') {
        // Group & sort for all-time
        const groupedMap: { [key: string]: number } = {};
        timelineData.forEach(item => {
            groupedMap[item.date] = (groupedMap[item.date] || 0) + item.count;
        });

        timelineData = Object.entries(groupedMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => {
                const [dayA, monthA] = a.date.split('.').map(Number);
                const [dayB, monthB] = b.date.split('.').map(Number);
                return (monthA * 32 + dayA) - (monthB * 32 + dayB);
            });

        // Pad to at least 5 points
        if (timelineData.length < 5 && timelineData.length > 0) {
            const firstDateStr = timelineData[0].date;
            const [day, month] = firstDateStr.split('.').map(Number);
            for (let i = 4; i > 0; i--) {
                const prevDate = new Date(2026, month - 1, day - i);
                const prevLabel = processDateLabel(prevDate);
                if (!groupedMap[prevLabel]) {
                    timelineData.unshift({ date: prevLabel, count: 0 });
                }
            }
        }
    }

    // Chart SVG definitions
    const chartWidth = 500;
    const chartHeight = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const maxTimelineValue = Math.max(...timelineData.map(d => d.count), 5);

    // Generate SVG path for timeline area chart
    let linePath = '';
    let areaPath = '';
    const points: { x: number; y: number; label: string; value: number }[] = [];

    if (timelineData.length > 1) {
        timelineData.forEach((d, i) => {
            const x = paddingLeft + (i / (timelineData.length - 1)) * plotWidth;
            const y = paddingTop + plotHeight - (d.count / maxTimelineValue) * plotHeight;
            points.push({ x, y, label: d.date, value: d.count });

            if (i === 0) {
                linePath += `M ${x} ${y}`;
                areaPath += `M ${x} ${paddingTop + plotHeight} L ${x} ${y}`;
            } else {
                const prevPoint = points[i - 1];
                const cpX1 = prevPoint.x + (x - prevPoint.x) / 2;
                const cpY1 = prevPoint.y;
                const cpX2 = prevPoint.x + (x - prevPoint.x) / 2;
                const cpY2 = y;
                linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
                areaPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
            }

            if (i === timelineData.length - 1) {
                areaPath += ` L ${x} ${paddingTop + plotHeight} Z`;
            }
        });
    }

    return (
        <div className="w-full text-gray-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white text-left mb-1 flex items-center gap-2">
                        <span>📊</span> Панель статистики
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isDemo ? (
                            <span className="text-amber-400 font-semibold">🖥️ Демонстрационный режим</span>
                        ) : (
                            <span>Реальные данные приложения</span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={toggleDemoMode}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                            isDemo
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                        }`}
                    >
                        {isDemo ? 'Вернуться к БД' : 'Демо режим'}
                    </button>
                    {!isDemo && (
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                        >
                            Выйти
                        </button>
                    )}
                </div>
            </div>

            {/* Time Filter Toolbar */}
            <div className="glass-card p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => { setTimeUnit('all'); setTimeOffset(0); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            timeUnit === 'all'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Все время
                    </button>
                    <button
                        onClick={() => { setTimeUnit('month'); setTimeOffset(0); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            timeUnit === 'month'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        По месяцам
                    </button>
                    <button
                        onClick={() => { setTimeUnit('week'); setTimeOffset(0); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            timeUnit === 'week'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        По неделям
                    </button>
                </div>

                {timeUnit !== 'all' && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setTimeOffset(prev => prev - 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-bold text-white tracking-wide min-w-[150px] text-center capitalize">
                            {periodLabel}
                        </span>
                        <button
                            onClick={() => setTimeOffset(prev => prev + 1)}
                            disabled={timeOffset === 0}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white transition-all ${
                                timeOffset === 0
                                    ? 'opacity-20 cursor-not-allowed'
                                    : 'hover:bg-white/10 cursor-pointer'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Card 1 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-5 mb-0 flex flex-col justify-between border-l-4 border-l-blue-500"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Всего комнат</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-4xl font-extrabold text-white">{totalRooms}</span>
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-semibold">
                            {filteredActive.length} акт.
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">За выбранный период</p>
                </motion.div>

                {/* Card 2 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-5 mb-0 flex flex-col justify-between border-l-4 border-l-purple-500"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Всего вопросов</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-4xl font-extrabold text-white">{totalQuestions}</span>
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-semibold">
                            {totalActiveQuestions} в акт.
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Создано за выбранный период</p>
                </motion.div>

                {/* Card 3 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-5 mb-0 flex flex-col justify-between border-l-4 border-l-emerald-500"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Показано игрокам</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-4xl font-extrabold text-white">{totalShown}</span>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                            {showRate.toFixed(0)}% вовлеч.
                        </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${showRate}%` }}></div>
                    </div>
                </motion.div>

                {/* Card 4 */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card p-5 mb-0 flex flex-col justify-between border-l-4 border-l-cyan-500"
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Встроенные вопросы</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-4xl font-extrabold text-white">{totalPredefined}</span>
                        <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-semibold">
                            {predefinedRate.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-purple-500 rounded-full h-1.5 mt-3 overflow-hidden flex">
                        <div className="bg-cyan-400 h-1.5" style={{ width: `${predefinedRate}%` }}></div>
                    </div>
                </motion.div>
            </div>

            {/* Visual Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Rooms Creation Timeline */}
                <div className="glass-card lg:col-span-2 p-6 flex flex-col justify-between relative overflow-visible">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Динамика создания комнат</h3>
                        <p className="text-xs text-gray-400 mb-4">График создания новых игровых сессий по датам</p>
                    </div>

                    <div className="relative h-60 w-full mt-2">
                        {timelineData.length > 0 && maxTimelineValue > 0 ? (
                            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines & labels */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                    const y = paddingTop + plotHeight * (1 - ratio);
                                    const value = Math.round(ratio * maxTimelineValue);
                                    return (
                                        <g key={index} className="opacity-40">
                                            <line
                                                x1={paddingLeft}
                                                y1={y}
                                                x2={chartWidth - paddingRight}
                                                y2={y}
                                                stroke="rgba(255,255,255,0.08)"
                                                strokeWidth="1"
                                                strokeDasharray="4,4"
                                            />
                                            <text
                                                x={paddingLeft - 8}
                                                y={y + 4}
                                                fill="rgba(255,255,255,0.4)"
                                                fontSize="10"
                                                textAnchor="end"
                                            >
                                                {value}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Area Fill */}
                                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                                {/* Glowing Stroke */}
                                {linePath && (
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* Interactive Dots */}
                                {points.map((p, idx) => (
                                    <circle
                                        key={idx}
                                        cx={p.x}
                                        cy={p.y}
                                        r={hoveredPoint?.label === p.label ? "6" : "4"}
                                        fill={hoveredPoint?.label === p.label ? "#60a5fa" : "#3b82f6"}
                                        stroke="#1a1a2e"
                                        strokeWidth="2"
                                        className="transition-all cursor-pointer duration-150"
                                        onMouseEnter={(e) => {
                                            setHoveredPoint({
                                                x: p.x,
                                                y: p.y,
                                                label: p.label,
                                                value: p.value
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                ))}

                                {/* X-axis labels */}
                                {timelineData.map((d, i) => {
                                    const step = Math.max(Math.ceil(timelineData.length / 8), 1);
                                    if (i % step !== 0 && i !== timelineData.length - 1) return null;

                                    const x = paddingLeft + (i / (timelineData.length - 1)) * plotWidth;
                                    return (
                                        <text
                                            key={i}
                                            x={x}
                                            y={chartHeight - 15}
                                            fill="rgba(255,255,255,0.4)"
                                            fontSize="9"
                                            textAnchor="middle"
                                        >
                                            {d.date}
                                        </text>
                                    );
                                })}
                            </svg>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Недостаточно данных для графика
                            </div>
                        )}

                        {/* Chart Tooltip */}
                        {hoveredPoint && (
                            <div
                                className="absolute bg-slate-900/95 border border-blue-500/30 rounded-xl px-3 py-1.5 shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
                                style={{
                                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                                    top: `${(hoveredPoint.y / chartHeight) * 100 - 4}%`,
                                }}
                            >
                                <span className="font-semibold block text-gray-400">{hoveredPoint.label}</span>
                                <span className="text-white text-sm font-bold">{hoveredPoint.value} комн.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Mix Donut & Info */}
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Состав вопросов</h3>
                        <p className="text-xs text-gray-400 mb-6">Пропорция встроенных и пользовательских вопросов</p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="10"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#a855f7"
                                    strokeWidth="10"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#22d3ee"
                                    strokeWidth="10"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - predefinedRate / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold text-white">{predefinedRate.toFixed(0)}%</span>
                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Встроенные</span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3 text-center mt-2">
                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-2">
                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                                    <span className="text-xs font-bold text-cyan-400">Предустановл.</span>
                                </div>
                                <span className="text-base font-extrabold text-white">{totalPredefined}</span>
                                <span className="text-[10px] text-gray-400 block">{predefinedRate.toFixed(0)}%</span>
                            </div>
                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-2">
                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                                    <span className="text-xs font-bold text-purple-400">Свои вопросы</span>
                                </div>
                                <span className="text-base font-extrabold text-white">{totalCustom}</span>
                                <span className="text-[10px] text-gray-400 block">{customRate.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Management Tabs & Tables */}
            <div className="glass-card p-6">
                <div className="flex border-b border-white/10 pb-4 mb-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`mr-6 pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Активные комнаты ({filteredActive.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('historical')}
                        className={`mr-6 pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'historical'
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        История сессий ({filteredHistorical.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`mr-6 pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'questions'
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Все вопросы ({questions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('ai-lab')}
                        className={`pb-2 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'ai-lab'
                                ? 'border-amber-500 text-amber-300'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        <span>🧪</span> AI Лаборатория
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="overflow-x-auto">
                        {filteredActive.length > 0 ? (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Код комнаты</th>
                                        <th className="pb-3 px-4">Создана</th>
                                        <th className="pb-3 px-4 text-center">Вопросов всего</th>
                                        <th className="pb-3 px-4 text-center">Встроенных</th>
                                        <th className="pb-3 px-4 text-center">Своих</th>
                                        <th className="pb-3 px-4 text-center">AI / Play</th>
                                        <th className="pb-3 pl-4">Просмотрено</th>
                                        <th className="pb-3 pl-4">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredActive.map((room, idx) => {
                                        const customCount = room.questionsTotal - room.questionsPredefined;
                                        const pctShown = room.questionsTotal > 0 ? (room.questionsShown / room.questionsTotal) * 100 : 0;
                                        return (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                                <td className="py-4 pr-4 font-mono font-bold text-white text-base">
                                                    {room.code}
                                                </td>
                                                <td className="py-4 px-4 text-gray-300">
                                                    {new Date(room.dateCreated).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-4 px-4 text-center font-semibold text-white">
                                                    {room.questionsTotal}
                                                </td>
                                                <td className="py-4 px-4 text-center text-cyan-400 font-medium">
                                                    {room.questionsPredefined}
                                                </td>
                                                <td className="py-4 px-4 text-center text-purple-400 font-medium">
                                                    {customCount}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button onClick={() => toggleRoomPaid(room.code)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${room.isPaid ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' : 'bg-gray-500/10 text-gray-400 border border-gray-500/30 hover:bg-gray-500/20'}`}>
                                                        {room.isPaid ? 'AI Enabled' : 'Off'}
                                                    </button>
                                                </td>
                                                <td className="py-4 pl-4 w-52">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pctShown}%` }}></div>
                                                        </div>
                                                        <span className="font-semibold text-xs text-white">
                                                            {room.questionsShown} / {room.questionsTotal}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 pl-4">
                                                    <button onClick={() => deleteRoom(room.code)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase transition-colors">Удалить</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Нет активных комнат за выбранный период
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'historical' && (
                    <div className="overflow-x-auto">
                        {filteredHistorical.length > 0 ? (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="pb-3 pr-4">ID записи</th>
                                        <th className="pb-3 px-4">Была активна</th>
                                        <th className="pb-3 px-4 text-center">Всего вопросов</th>
                                        <th className="pb-3 px-4 text-center">Встроенных</th>
                                        <th className="pb-3 px-4 text-center">Пользовательских</th>
                                        <th className="pb-3 pl-4">Просмотрено</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistorical.map((hist, idx) => {
                                        const customCount = hist.questionsTotal - hist.questionsPredefined;
                                        const pctShown = hist.questionsTotal > 0 ? (hist.questionsShown / hist.questionsTotal) * 100 : 0;
                                        return (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                                <td className="py-4 pr-4 font-mono font-bold text-gray-400">
                                                    #{hist.id}
                                                </td>
                                                <td className="py-4 px-4 text-gray-300">
                                                    {new Date(hist.creationDate).toLocaleString('ru-RU', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-4 px-4 text-center font-semibold text-white">
                                                    {hist.questionsTotal}
                                                </td>
                                                <td className="py-4 px-4 text-center text-cyan-400 font-medium">
                                                    {hist.questionsPredefined}
                                                </td>
                                                <td className="py-4 px-4 text-center text-purple-400 font-medium">
                                                    {customCount}
                                                </td>
                                                <td className="py-4 pl-4 w-52">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-indigo-500/70 h-2 rounded-full" style={{ width: `${pctShown}%` }}></div>
                                                        </div>
                                                        <span className="font-semibold text-xs text-white">
                                                            {hist.questionsShown} / {hist.questionsTotal}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                В истории пока нет записей за выбранный период
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="overflow-x-auto">
                        {questions.length > 0 ? (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Комната</th>
                                        <th className="pb-3 px-4">Текст</th>
                                        <th className="pb-3 px-4">Добавлен</th>
                                        <th className="pb-3 px-4">Тип</th>
                                        <th className="pb-3 px-4">Статус</th>
                                        <th className="pb-3 pl-4">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => (
                                        <tr key={q.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                            <td className="py-4 pr-4 font-mono font-bold text-gray-300">{q.roomCode}</td>
                                            <td className="py-4 px-4 text-white font-medium max-w-xs truncate" title={q.question}>{q.question}</td>
                                            <td className="py-4 px-4 text-gray-400">
                                                {new Date(q.dateAdded).toLocaleString('ru-RU', {
                                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-4">
                                                {q.isPredefined ? <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-semibold text-xs">Встроенный</span> : <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-semibold text-xs">Свой</span>}
                                            </td>
                                            <td className="py-4 px-4">
                                                <button onClick={() => toggleQuestionShown(q.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${q.wasShown ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/30 hover:bg-gray-500/20'}`}>
                                                    {q.wasShown ? 'Показан' : 'Ожидает'}
                                                </button>
                                            </td>
                                            <td className="py-4 pl-4">
                                                <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase transition-colors">Удалить</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Нет вопросов
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ai-lab' && (
                    <div>
                        <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 mb-1">
                                <span>🧪</span> Тестирование генерации вопросов Gemini
                            </h3>
                            <p className="text-xs text-gray-400">
                                Экспериментальный раздел для проверки промптов и качества генерации перед включением функции для всех пользователей.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            {/* Archived room picker */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Архивные комнаты (сид)</h4>
                                    <button
                                        onClick={fetchArchivedRooms}
                                        disabled={aiRoomsLoading}
                                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {aiRoomsLoading ? 'Обновление…' : 'Обновить'}
                                    </button>
                                </div>

                                {aiRoomsError && (
                                    <div className="modern-alert alert-error text-sm mb-3">
                                        {aiRoomsError}
                                    </div>
                                )}

                                <div className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="max-h-72 overflow-y-auto overflow-x-auto">
                                        {aiRoomsLoading && aiRooms.length === 0 ? (
                                            <div className="text-center py-10 text-gray-500 text-sm">Загрузка комнат…</div>
                                        ) : aiRooms.length > 0 ? (
                                            <table className="w-full text-left border-collapse text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider sticky top-0 bg-[#161622]">
                                                        <th className="py-2 pl-3 pr-2">Код</th>
                                                        <th className="py-2 px-2">Язык</th>
                                                        <th className="py-2 px-2 text-center">Вопросов</th>
                                                        <th className="py-2 pr-3">Архивирована</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {aiRooms.map((room) => {
                                                        const selected = aiSelectedRoom === room.roomCode;
                                                        return (
                                                            <tr
                                                                key={room.roomCode}
                                                                onClick={() => selectAiRoom(room)}
                                                                className={`border-b border-white/5 cursor-pointer transition-colors ${
                                                                    selected ? 'bg-amber-500/10' : 'hover:bg-white/5'
                                                                }`}
                                                            >
                                                                <td className={`py-3 pl-3 pr-2 font-mono font-bold ${selected ? 'text-amber-300' : 'text-white'}`}>
                                                                    {room.roomCode}
                                                                </td>
                                                                <td className="py-3 px-2 text-gray-300 uppercase text-xs">{room.language || '—'}</td>
                                                                <td className="py-3 px-2 text-center text-gray-300">{room.questionCount ?? '—'}</td>
                                                                <td className="py-3 pr-3 text-gray-400 text-xs">
                                                                    {room.lastArchived ? new Date(room.lastArchived).toLocaleString('ru-RU', {
                                                                        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                                                                    }) : '—'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-center py-10 text-gray-500 text-sm">Архивных комнат не найдено</div>
                                        )}
                                    </div>
                                </div>

                                {aiSelectedRoom != null && (
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        <span className="text-gray-400">Выбрана комната как сид:</span>
                                        <span className="font-mono font-bold text-amber-300">{aiSelectedRoom}</span>
                                        <button onClick={clearAiRoomSelection} className="text-red-400 hover:text-red-300 uppercase font-bold cursor-pointer">
                                            Сбросить
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Language selector + generate */}
                            <div className="flex flex-col">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Язык генерации</h4>
                                <p className="text-xs text-gray-400 mb-2">
                                    Используется, если сид-комната не выбрана (генерация без примера) — либо для передачи с сидом.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {AI_LANGUAGES.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => setAiLanguage(l.code)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                aiLanguage === l.code
                                                    ? 'bg-amber-500 border-amber-500 text-black'
                                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    {aiGenError && (
                                        <div className="modern-alert alert-error text-sm mb-3">
                                            {aiGenError}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={aiGenerating}
                                        className="modern-btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: aiGenerating ? undefined : '#f59e0b', boxShadow: 'none' }}
                                    >
                                        {aiGenerating && (
                                            <span className="inline-block w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                                        )}
                                        {aiGenerating ? 'Генерация…' : 'Сгенерировать'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                                Результаты генерации {aiResults.length > 0 && <span className="text-gray-500 normal-case font-medium">(последние {aiResults.length})</span>}
                            </h4>

                            {aiResults.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                                    Пока нет сгенерированных результатов
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {aiResults.map((result) => (
                                        <div key={result.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/2">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                                                onClick={() => toggleAiResultCollapsed(result.id)}
                                            >
                                                <div className="flex items-center gap-3 flex-wrap text-xs">
                                                    <span className="text-white font-bold text-sm">
                                                        {new Date(result.timestamp).toLocaleString('ru-RU', {
                                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold uppercase">
                                                        {result.language}
                                                    </span>
                                                    {result.roomCode != null && (
                                                        <span className="text-gray-300 font-mono">комната {result.roomCode}</span>
                                                    )}
                                                    <span className="text-gray-400">сид: {result.seedCount}</span>
                                                    <span className="text-gray-400">вопросов: {result.questions.length}</span>
                                                </div>
                                                <svg
                                                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${result.collapsed ? '' : 'rotate-180'}`}
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {!result.collapsed && (
                                                <div className="px-4 pb-4 border-t border-white/5 pt-4">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Промпт (редактируемый)</label>
                                                    </div>
                                                    <textarea
                                                        value={result.editedPrompt}
                                                        onChange={(e) => updateAiEditedPrompt(result.id, e.target.value)}
                                                        className="w-full h-40 resize-y font-mono text-xs bg-black/30 border border-white/10 rounded-xl p-3 text-gray-200 outline-none focus:border-amber-500/50 overflow-y-auto"
                                                        spellCheck={false}
                                                    />
                                                    <div className="flex justify-end mt-2">
                                                        <button
                                                            onClick={() => handleAiRegenerate(result)}
                                                            disabled={aiGenerating}
                                                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Перегенерировать с изменённым промптом
                                                        </button>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                            Сгенерированные вопросы ({result.questions.length})
                                                        </label>
                                                        <button
                                                            onClick={() => copyAiQuestions(result)}
                                                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            {aiCopiedId === result.id ? '✓ Скопировано' : '📋 Копировать вопросы'}
                                                        </button>
                                                    </div>
                                                    {result.questions.length > 0 ? (
                                                        <ol className="list-decimal list-inside mt-2 space-y-1.5 text-sm text-gray-200">
                                                            {result.questions.map((q, i) => (
                                                                <li key={i} className="pl-1">{q}</li>
                                                            ))}
                                                        </ol>
                                                    ) : (
                                                        <div className="text-xs text-gray-500 mt-2">Нет вопросов в ответе</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStats;
