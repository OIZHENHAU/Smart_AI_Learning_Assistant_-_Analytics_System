import React, {useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import quizService from "../../services/QuizService";
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from "../../components/common/Button";


const QuizTakePage = () => {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setCurrentQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCurrentQuiz = async () => {
            try {
                const response = await quizService.getQuizById(quizId);
                setCurrentQuiz(response.data);

            } catch (error) {
                 toast.error("Failed to fetch thw quiz question at the quiz taken page.");
                 console.error(error);

            } finally {
                setLoading(false);
            }
        };

        fetchCurrentQuiz();

    }, [quizId]);

    const handleOptionChange = (questionId, optionIndex) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const handleSubmitQuizAnswer = async () => {
        setSubmitting(true);
        try {
            const answers = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
                questionId: parseInt(questionId),
                selectedAnswer
            }));
            await quizService.submitQuiz(quizId, answers);
            toast.success("Quiz submitted successfully!");
            navigate(`/quizzes/${quizId}/results`);
        } catch (error) {
            toast.error("Failed to submit quiz.");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex item-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        )
    }

    if (!quiz || quiz.questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-slate-600 text-lg">Quiz was not found or it has no questions.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isAnswered = selectedAnswers.hasOwnProperty(currentQuestion.id);
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader title={quiz.title || 'Take quiz'} />

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </span>
                    <span className="text-sm font-medium text-slate-500">
                        {answeredCount} answered
                    </span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-linear-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1 ) / quiz.questions.length) * 100}%` }} 
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl mb-6">
                    <span className="text-sm font-semibold text-purple-700">
                        Question {currentQuestionIndex + 1}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
                    {currentQuestion.question}
                </h3>

                {/* Answer Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswers[currentQuestion.id] === option;
                        return (
                            <button
                                key={index}
                                onClick={() => handleOptionChange(currentQuestion.id, option)}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                                    isSelected
                                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 text-slate-700'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                                }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"/>}
                                </div>
                                <span className="text-sm font-medium">{option}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <Button onClick={handleNextQuestion}>
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmitQuizAnswer}
                        disabled={submitting || answeredCount < quiz.questions.length}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${quiz.questions.length})`}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default QuizTakePage