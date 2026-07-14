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

// Generate demo data to show if database is empty
const generateDemoData = (): StatsData => {
    const now = new Date();
    const historical: HistoricalStat[] = Array.from({ length: 15 }).map((_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - (15 - i) * 2);
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
        { code: 789456, dateCreated: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), questionsTotal: 25, questionsShown: 12, questionsPredefined: 18 },
        { code: 456123, dateCreated: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), questionsTotal: 40, questionsShown: 35, questionsPredefined: 20 },
        { code: 112233, dateCreated: new Date(now.getTime() - 1000 * 60 * 360).toISOString(), questionsTotal: 15, questionsShown: 0, questionsPredefined: 15 },
        { code: 998877, dateCreated: new Date(now.getTime() - 1000 * 60 * 1440 * 2).toISOString(), questionsTotal: 30, questionsShown: 10, questionsPredefined: 25 }
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
    const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'historical'>('overview');
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

    // Load credentials from localStorage if available
    const [authHeader, setAuthHeader] = useState<string | null>(() => {
        return localStorage.getItem('admin_auth_header');
    });

    const fetchStats = async (headerToUse = authHeader) => {
        setLoading(true);
        setAuthError(null);
        try {
            const config = headerToUse ? { headers: { 'Authorization': headerToUse } } : {};
            const response = await axios.get('/admin/api/statistics', config);
            setData(response.data);
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
            setAuthRequired(false);
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

    // Prepare combined calculations
    const stats = data || generateDemoData();
    const totalHistoricalRooms = stats.historical.length;
    const totalRooms = stats.totalActiveRooms + totalHistoricalRooms;

    const totalHistoricalQuestions = stats.historical.reduce((sum, h) => sum + h.questionsTotal, 0);
    const totalQuestions = stats.totalActiveQuestions + totalHistoricalQuestions;

    const totalHistoricalShown = stats.historical.reduce((sum, h) => sum + h.questionsShown, 0);
    const totalShown = stats.totalActiveShownQuestions + totalHistoricalShown;

    const totalHistoricalPredefined = stats.historical.reduce((sum, h) => sum + h.questionsPredefined, 0);
    const totalPredefined = stats.totalActivePredefinedQuestions + totalHistoricalPredefined;
    const totalCustom = totalQuestions - totalPredefined;

    const showRate = totalQuestions > 0 ? (totalShown / totalQuestions) * 100 : 0;
    const predefinedRate = totalQuestions > 0 ? (totalPredefined / totalQuestions) * 100 : 0;
    const customRate = 100 - predefinedRate;

    // Process room creation timeline
    // Group rooms by date
    const timelineMap: { [key: string]: number } = {};
    const processDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        } catch {
            return 'Unknown';
        }
    };

    stats.historical.forEach(h => {
        const key = processDate(h.creationDate);
        timelineMap[key] = (timelineMap[key] || 0) + 1;
    });
    stats.activeRooms.forEach(r => {
        const key = processDate(r.dateCreated);
        timelineMap[key] = (timelineMap[key] || 0) + 1;
    });

    // Sort timeline keys (assuming they are DD.MM formats we can map chronologically)
    const timelineData = Object.entries(timelineMap)
        .map(([date, count]) => ({ date, count }))
        // Simple sort by day/month mapping
        .sort((a, b) => {
            const [dayA, monthA] = a.date.split('.').map(Number);
            const [dayB, monthB] = b.date.split('.').map(Number);
            return (monthA * 32 + dayA) - (monthB * 32 + dayB);
        });

    // Ensure we have at least 5 points for a beautiful chart
    if (timelineData.length < 5 && timelineData.length > 0) {
        // pad with some older zero dates
        const firstDateStr = timelineData[0].date;
        const [day, month] = firstDateStr.split('.').map(Number);
        for (let i = 4; i > 0; i--) {
            const prevDate = new Date(2026, month - 1, day - i);
            const prevLabel = prevDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            if (!timelineMap[prevLabel]) {
                timelineData.unshift({ date: prevLabel, count: 0 });
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
                // smooth curves using bezier control points
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
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
                        className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
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
                            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all"
                        >
                            Выйти
                        </button>
                    )}
                </div>
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
                            {stats.totalActiveRooms} акт.
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">С учетом удаленных комнат</p>
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
                            {stats.totalActiveQuestions} в акт.
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">База всех созданных вопросов</p>
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
                    {/* Tiny Progress bar */}
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
                    {/* Custom vs Predefined bar */}
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
                        {timelineData.length > 1 ? (
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
                                <path d={areaPath} fill="url(#chartGradient)" />

                                {/* Glowing Stroke */}
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                />

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
                                            const rect = e.currentTarget.getBoundingClientRect();
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
                                    // limit labels to keep it clean
                                    const step = Math.ceil(timelineData.length / 8);
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

                    {/* SVG Radial Progress */}
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Track */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="10"
                                />
                                {/* Custom slice */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#a855f7" // purple-500
                                    strokeWidth="10"
                                />
                                {/* Predefined slice overlay */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#22d3ee" // cyan-400
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

                        {/* Legends */}
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
                        className={`mr-6 pb-2 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'overview'
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Активные комнаты ({stats.totalActiveRooms})
                    </button>
                    <button
                        onClick={() => setActiveTab('historical')}
                        className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'historical'
                                ? 'border-blue-500 text-white'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        История сессий ({stats.historical.length})
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div className="overflow-x-auto">
                        {stats.activeRooms.length > 0 ? (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Код комнаты</th>
                                        <th className="pb-3 px-4">Создана</th>
                                        <th className="pb-3 px-4 text-center">Вопросов всего</th>
                                        <th className="pb-3 px-4 text-center">Встроенных</th>
                                        <th className="pb-3 px-4 text-center">Пользовательских</th>
                                        <th className="pb-3 pl-4">Просмотрено</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.activeRooms.map((room, idx) => {
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
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Нет активных игровых комнат в базе данных
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'historical' && (
                    <div className="overflow-x-auto">
                        {stats.historical.length > 0 ? (
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
                                    {stats.historical.map((hist, idx) => {
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
                                В истории пока нет записей об удаленных сессиях
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStats;
