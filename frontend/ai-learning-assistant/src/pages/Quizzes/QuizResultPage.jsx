import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import quizService from "../../services/QuizService";
import Spinner from "../../components/common/Spinner";
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Trophy, BookOpen } from 'lucide-react';


const QuizResultPage = () => {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const data = await quizService.getQuizResults(quizId);
                setResults(data);
            } catch (error) {
                toast.error("Failed to fetch the quiz result at the frontend page.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [quizId]);

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
                    <p className="text-slate-600 text-lg">Quiz result was not found.</p>
                </div>
            </div>
        );
    }

    const { data: { quiz, results: detailedResults } } = results;
    const score = quiz.score;
    const totalQuestions = detailedResults.length;
    const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;

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
                <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
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
                        {correctAnswers} Points
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
                    <div className="flex items-start justify-between mb-4">
                        <span className="px-4 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-xl">
                            Question {index + 1}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.isCorrect ? 'bg-purple-600' : 'bg-red-500'
                        }`}>
                            {item.isCorrect
                                ? <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                                : <XCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                            }
                        </div>
                    </div>

                    {/* Question Text */}
                    <h3 className="text-base font-bold text-slate-900 mb-4">{item.question}</h3>

                    {/* Options */}
                    <div className="space-y-2.5">
                        {item.options.map((option, i) => {
                            const isSelected = option === item.selectedAnswer;
                            const isCorrectAnswer = option === item.correctAnswer;
                            const isWrongSelection = isSelected && !item.isCorrect;
                            const isCorrectNotSelected = isCorrectAnswer && !item.isCorrect;

                            let containerStyle = "border-slate-200 bg-slate-50";
                            let radioStyle = "border-slate-300 bg-white";
                            let textStyle = "text-slate-600";

                            if (isSelected && item.isCorrect) {
                                containerStyle = "border-purple-400 bg-purple-50";
                                radioStyle = "border-purple-500 bg-purple-500";
                                textStyle = "text-purple-900 font-semibold";
                            } else if (isWrongSelection) {
                                containerStyle = "border-red-300 bg-red-50";
                                radioStyle = "border-red-400 bg-red-400";
                                textStyle = "text-red-700 font-semibold";
                            } else if (isCorrectNotSelected) {
                                containerStyle = "border-green-300 bg-green-50";
                                radioStyle = "border-green-500 bg-green-500";
                                textStyle = "text-green-800 font-semibold";
                            }

                            return (
                                <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${containerStyle}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${radioStyle}`}>
                                            {(isSelected || isCorrectNotSelected) && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${textStyle}`}>{option}</span>
                                    </div>

                                    {isSelected && (
                                        <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                                            item.isCorrect ? 'bg-purple-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                            Your Answer
                                        </span>
                                    )}
                                    {isCorrectNotSelected && (
                                        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-green-500 text-white">
                                            Correct Answer
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                        <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Explanation</p>
                            <p className="text-sm text-blue-800">{item.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default QuizResultPage;
