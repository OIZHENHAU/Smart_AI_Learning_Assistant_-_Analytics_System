import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Clock, BookOpen, Target, TrendingUp, Eye } from "lucide-react";
import progressService from "../../services/ProgressService";
import Spinner from "../../components/common/Spinner";
import moment from "moment";

const PIE_COLORS = ["#7c3aed", "#818cf8", "#c4b5fd"];

const getMasteryColor = (pct) => {
    if (pct >= 70) return { bar: "#7c3aed", bg: "bg-purple-100", text: "text-purple-700", label: "Mastered" };
    if (pct >= 50) return { bar: "#f59e0b", bg: "bg-yellow-100", text: "text-yellow-700", label: "Developing" };
    return { bar: "#ef4444", bg: "bg-red-100", text: "text-red-600", label: "Needs Work" };
};

const ProgressPage = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [dashData, topicData] = await Promise.all([
                    progressService.getProgressDashboard(),
                    progressService.getTopicAnalysis()
                ]);
                setDashboard(dashData.data);
                setTopics(topicData.data || []);
            } catch (error) {
                console.error("Failed to load progress data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    const masteredCount = topics.filter(t => t.mastery_percentage >= 70).length;

    const weeklyData = (() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const map = {};
        (dashboard?.weekly_activity || []).forEach(r => { map[r.day?.slice(0, 3)] = parseFloat(r.hours) || 0; });
        return days.map(d => ({ day: d, hours: map[d] || 0 }));
    })();

    const trendData = (dashboard?.performance_trend || []).map(r => ({
        month: r.month,
        score: r.avg_score
    }));

    const studyTimeData = (dashboard?.study_time_pattern || []).map(r => ({
        name: r.time_of_day,
        value: r.session_count
    }));

    const stats = [
        { label: "Total Learning Hours", value: dashboard?.total_learning_hour ?? 0, icon: <Clock className="w-6 h-6 text-purple-600" />, bg: "bg-purple-50" },
        { label: "Average Score", value: `${dashboard?.average_score ?? 0}%`, icon: <Target className="w-6 h-6 text-green-600" />, bg: "bg-green-50" },
        { label: "Quizzes Completed", value: dashboard?.completed_quiz ?? 0, icon: <BookOpen className="w-6 h-6 text-blue-600" />, bg: "bg-blue-50" },
        { label: "Topics Mastered", value: masteredCount, icon: <TrendingUp className="w-6 h-6 text-orange-500" />, bg: "bg-orange-50" },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">View Progress</h1>
                <p className="text-sm text-slate-500 mt-1">Track your learning performance and improvements</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-200 hover:translate-y-1">
                        <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                            {s.icon}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                            <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Weekly Activity + Performance Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Weekly Activity</h2>
                    {weeklyData.every(d => d.hours === 0) ? (
                        <p className="text-sm text-slate-400 text-center py-10">No activity data yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeklyData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={true} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="h" />
                                <Tooltip cursor={{ fill: "#f5f3ff" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${v}h`, "Study Hours"]} />
                                <Bar dataKey="hours" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Performance Trend</h2>
                    {trendData.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">No quiz data yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Study Time Pattern + Topic Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Study Time Pattern</h2>
                    {studyTimeData.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">No session data yet.</p>
                    ) : (
                        <div className="flex items-center justify-center gap-6">
                            <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                    <Pie data={studyTimeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                        {studyTimeData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {studyTimeData.map((entry, i) => {
                                    const total = studyTimeData.reduce((s, d) => s + d.value, 0);
                                    const pct = total ? Math.round((entry.value / total) * 100) : 0;
                                    return (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-sm text-slate-600">{entry.name}</span>
                                            <span className="text-sm font-semibold text-slate-800 ml-1">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Topic Performance</h2>
                    <p className="text-xs text-slate-400 mb-4">Based on your quiz answers across all quizzes</p>
                    {topics.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No topic data yet. Complete quizzes to see your topic performance.</p>
                    ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {topics.map((t) => {
                                const style = getMasteryColor(t.mastery_percentage);
                                return (
                                    <div key={t.topic}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[60%]">{t.topic}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-slate-400">{t.correct_answers}/{t.total_questions}</span>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${style.bg} ${style.text}`}>
                                                    {style.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${t.mastery_percentage}%`, backgroundColor: style.bar }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Quizzes */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">View Quiz Performance</h2>
                </div>
                {(dashboard?.recent_quizzes || []).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No quizzes completed yet.</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {dashboard.recent_quizzes.map((quiz) => (
                            <div key={quiz.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{quiz.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {quiz.completed_at
                                            ? moment(quiz.completed_at).calendar(null, {
                                                sameDay: "[Today at] HH.mm.ss",
                                                lastDay: "[Yesterday at] HH.mm.ss",
                                                else: "DD MMM YYYY"
                                            })
                                            : "In Progress"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold ${quiz.score >= 70 ? "text-purple-600" : quiz.score >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                                        {quiz.score != null ? `${quiz.score}%` : "—"}
                                    </span>
                                    {quiz.completed_at && (
                                        <button
                                            onClick={() => navigate(`/quizzes/${quiz.id}/results`)}
                                            className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressPage;
