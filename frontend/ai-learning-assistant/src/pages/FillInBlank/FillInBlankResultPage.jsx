import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import fillInBlankService from "../../services/FillInBlankService";
import Spinner from "../../components/common/Spinner";
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Trophy, BookOpen } from 'lucide-react';


const parseQuestionText = (text) => {
    const parts = [];
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'blank', order: parseInt(match[1]) });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return parts;
};


const buildWordBankReview = (item) => {
    const entries = [];
    const usedWords = new Set();

    item.blanks.forEach((blank) => {
        entries.push({
            key: `correct-${blank.blankOrder}`,
            label: `(${blank.blankOrder}) ${blank.correctWord}`,
            state: 'correct'
        });
        usedWords.add(blank.correctWord);

        if (!blank.isCorrect && blank.selectedWord) {
            entries.push({
                key: `wrong-${blank.blankOrder}`,
                label: `(${blank.blankOrder}) ${blank.selectedWord}`,
                state: 'incorrect'
            });
            usedWords.add(blank.selectedWord);
        }
    });

    (item.wordBank || []).forEach((word) => {
        if (!usedWords.has(word)) {
            entries.push({ key: `distractor-${word}`, label: word, state: 'distractor' });
            usedWords.add(word);
        }
    });

    return entries;
};


const FillInBlankResultPage = () => {
    const { id: setId } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const data = await fillInBlankService.getSetResults(setId);
                setResults(data);
            } catch (error) {
                toast.error("Failed to fetch the fill-in-the-blank result at the frontend page.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [setId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    if (!results || !results.data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-slate-600 text-lg">Result was not found.</p>
                </div>
            </div>
        );
    }

    const { data: { set, results: detailedResults } } = results;
    const score = set.score;
    const totalQuestions = detailedResults.length;
    const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const totalEarnPoints = ((correctAnswers - incorrectAnswers) <= 0) ? 0 : correctAnswers - incorrectAnswers;
    const totalEarnXP = set.totalEarnXP || 0;

    // Group results by topic for breakdown
    const topicBreakdown = (() => {
        const map = {};
        detailedResults.forEach(r => {
            const topic = r.topic || "General";
            if (!map[topic]) map[topic] = { correct: 0, total: 0 };
            map[topic].total += 1;
            if (r.isCorrect) map[topic].correct += 1;
        });
        return Object.entries(map).map(([topic, data]) => ({
            topic,
            ...data,
            pct: Math.round((data.correct / data.total) * 100)
        })).sort((a, b) => a.pct - b.pct);
    })();

    const getScoreMessage = (score) => {
        if (score >= 90) return "Outstanding!";
        if (score >= 80) return "Great Job!";
        if (score >= 70) return "Good Work!";
        if (score >= 60) return "Not Bad At All!";
        return "Keep on Practicing!";
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">{set.title}</h1>
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                    Back
                </button>
            </div>

            {/* Score Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-purple-600" strokeWidth={2} />
                    </div>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Overall Result</h2>
                <p className="text-sm text-slate-500 mb-4">{getScoreMessage(score)}</p>
                <div className="text-6xl font-bold text-purple-600 mb-6">{score}%</div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <span className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl">
                        {totalQuestions} Total
                    </span>
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-xl">
                        {correctAnswers} Correct
                    </span>
                    <span className="px-4 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-xl">
                        {incorrectAnswers} Incorrect
                    </span>
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-xl">
                        {totalEarnPoints} Points
                    </span>
                    <span className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl">
                        {totalEarnXP} XP Earned
                    </span>
                </div>
            </div>

            {/* Topic Breakdown */}
            {topicBreakdown.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <h2 className="text-base font-semibold text-slate-800">Topic Breakdown</h2>
                    </div>
                    <div className="space-y-3">
                        {topicBreakdown.map(({ topic, correct, total, pct }) => {
                            const color = pct >= 70 ? { bar: "#7c3aed", bg: "bg-purple-100", text: "text-purple-700", label: "Mastered" }
                                : pct >= 50 ? { bar: "#f59e0b", bg: "bg-yellow-100", text: "text-yellow-700", label: "Developing" }
                                : { bar: "#ef4444", bg: "bg-red-100", text: "text-red-600", label: "Needs Work" };
                            return (
                                <div key={topic}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">{topic}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{correct}/{total} correct</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color.bg} ${color.text}`}>
                                                {color.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: color.bar }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Question Results */}
            {detailedResults.map((item, index) => (
                <div key={item.questionId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-6">
                        <span className="px-4 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-xl">
                            Question {index + 1}
                        </span>
                    </div>

                    {/* Question Text with inline blanks */}
                    <p className="text-base text-slate-900 leading-loose mb-5">
                        {parseQuestionText(item.question).map((part, i) => {
                            if (part.type === 'text') {
                                return <span key={i}>{part.value}</span>;
                            }

                            const blank = item.blanks.find(b => b.blankOrder === part.order);
                            const filled = blank?.selectedWord || blank?.correctWord || '___';

                            return (
                                <span
                                    key={i}
                                    className={`inline-block mx-1 px-3 py-1 rounded-lg font-semibold text-white align-middle border-b-2 border-white/50 ${
                                        blank?.isCorrect ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                >
                                    {filled}
                                </span>
                            );
                        })}
                    </p>

                    {/* Word Bank Review */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                        {buildWordBankReview(item).map((entry) => {
                            if (entry.state === 'distractor') {
                                return (
                                    <div
                                        key={entry.key}
                                        className="px-3 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium text-slate-300 line-through text-center"
                                    >
                                        {entry.label}
                                    </div>
                                );
                            }

                            const isCorrect = entry.state === 'correct';
                            return (
                                <div
                                    key={entry.key}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-semibold ${
                                        isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                        {isCorrect
                                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                            : <XCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                        }
                                    </div>
                                    {entry.label}
                                </div>
                            );
                        })}
                    </div>

                    {item.explanation && (
                        <div className="mt-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
                            <span className="text-xs font-semibold text-purple-700 mb-1">Explanation: </span>
                            <p className="text-sm text-purple-800">{item.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FillInBlankResultPage;
