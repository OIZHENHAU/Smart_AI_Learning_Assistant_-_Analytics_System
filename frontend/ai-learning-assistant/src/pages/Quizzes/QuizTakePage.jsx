import React, {useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, Snowflake, Shield, Lightbulb, Lock } from "lucide-react";
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from "../../components/common/Button";
import CountDownTimer from '../../components/common/CountdownTimer';
import Modal from '../../components/common/Modal';
import achievementService from "../../services/AchievementService";
import quizService from "../../services/QuizService";

const QuizTakePage = () => {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setCurrentQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(null);
    const [timeExpired, setTimeExpired] = useState(false);
    /*
    const [activeFeatureType, setActiveFeatureType] = useState(null);
    const [activeFeature, setActiveFeature] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isUnavailableModalOpen, setUnavailableModalOpen] = useState(false);
    */
    const [isHintModalOpen, setIsHintModalOpen] = useState(false);
    const [isHintUnavailableModalOpen, setIsHintUnavailableModalOpen] = useState(false);
    const [currentHintFeature, setHintFeature] = useState(null);
    const [questionHints, setQuestionHints] = useState({});
    
   /*const FEATURE_FETCHERS = {
        hint: achievementService.getHintFeature,
        //freeze: achievementService.getFreezeFeature,
        shield: achievementService.getShieldFeature
   };*/


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

    useEffect(() => {
        if (quiz?.questions?.length) {
            setTotalSeconds(/*quiz.duration_seconds*/18000);
        }
    }, [quiz]);

    useEffect(() => {
        const loadHintIfApplied = async () => {
            const question = quiz?.questions?.[currentQuestionIndex];

            if (!question) {
                return;
            }

            if (question.has_hint && questionHints[question.id] === undefined) {
                try {
                    const response = await quizService.getQuizHintByQuestionId(quizId, question.id);
                    setQuestionHints((prev) => ({
                        ...prev,
                        [question.id]: response.data.hints
                    }));

                } catch (error) {
                    console.error("Fail to load the hint of this question.", error);
                }
            }
        };

        loadHintIfApplied();
    }, [currentQuestionIndex, quiz, quizId]);

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

    const handleTimeUp = () => {
        if (submitting || timeExpired) return;
        setTimeExpired(true);
        toast("Time's up! Submitting your answers...");
        handleSubmitQuizAnswer();
    };

    const handleFreezeTimer = () => {
        toast("Freeze Timer coming soon!");
    };

    const handleScoreShield = () => {
        toast("Score Shield coming soon!");
    };

    const handleHint = async () => {
        if (quiz.questions[currentQuestionIndex].has_hint) {
            return;
        }

        try {
            const response = await achievementService.getHintFeature();
            const hintFeature = response.data;
            setHintFeature(hintFeature);

            if (hintFeature.num_unlock > 0) {
                setIsHintModalOpen(true);
            } else {
                setIsHintUnavailableModalOpen(true);
            }

        } catch (error) {
            toast.error("Failed to fetch the hint feature.");
            console.error(error);
        }
    };

    const handleConfirmUseHint = async () => {
        const questionId = quiz.questions[currentQuestionIndex].id;

        try {
            await quizService.setHintOnQuestion(quizId, questionId);
            const hintResponse = await quizService.getQuizHintByQuestionId(quizId, questionId);

            setQuestionHints((prev) => ({
                ...prev,
                [questionId]: hintResponse.data.hints
            }));

            setCurrentQuiz((prev) => ({
                ...prev,
                questions: prev.questions.map((q) =>
                    q.id === questionId ? { ...q, has_hint: true } : q
                )
            }));

            setIsHintModalOpen(false);
            toast("Hint was applied successfully.");

        } catch (error) {
            toast.error("Failed to apply the hint on this question.");
            console.error(error);
        }
        
    };

    /*const handleUseFeature = async (type) => {
        try {
            const response = await FEATURE_FETCHERS[type]();
            setActiveFeatureType(type);
            setActiveFeature(response.data);
            
            if (response.data.num_unlock > 0) {
                setIsConfirmModalOpen(true);

            } else {
                setIsUnavailableModalOpen(true);
            }

        } catch (error) {
            toast.error(`Failed to fetch the ${type} features.`);
            console.error(error);
        }
    }*/

    /*const handleConfirmUseFeature = () => {
        if (activeFeatureType === 'hint') {
            setQuestionHints((prev) => ({ ...prev, [quiz.questions[currentQuestionIndex].id]: true}));

        } else if (activeFeatureType === 'freeze') {
            //freeze-timer effect

        } else if (activeFeatureType === 'shield') {
            //score-shield effect

        }
        setIsConfirmModalOpen(false);
    }*/

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
            <PageHeader title={quiz.title || 'Take quiz'}>
                {totalSeconds !== null && (
                    <div className="px-4 py-2 border-2 border-slate-900 rounded-lg text-sm font-semibold text-slate-900">
                        Reset in: <CountDownTimer resetInSeconds={totalSeconds} onZero={handleTimeUp} />
                    </div>
                )}
            </PageHeader>

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

            {/* Hint */}
            {questionHints[currentQuestion.id] && (
                <div className="flex items-start gap-2 px-5 py-4 mb-6 bg-purple-300/70 border border-purple-300 rounded-xl text-sm text-purple-950">
                    <span className="font-semibold shrink-0">Hint:</span>
                    <span>{questionHints[currentQuestion.id] || "No hint available for this question."}</span>
                </div>
            )}

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

                {/* Feature Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleFreezeTimer}
                        title="Freeze Timer"
                        className="w-11 h-11 rounded-full bg-linear-to-r from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center hover:from-purple-500 hover:to-purple-600 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 active:scale-[0.98]"
                    >
                        <Snowflake className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleScoreShield}
                        title="Score Shield"
                        className="w-11 h-11 rounded-full bg-linear-to-r from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center hover:from-purple-500 hover:to-purple-600 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 active:scale-[0.98]"
                    >
                        <Shield className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleHint}
                        disabled={currentQuestion.has_hint}
                        title={currentQuestion.has_hint ? "Hint already used for this question" : "Hint"}
                        className={`w-11 h-11 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200 ${
                            currentQuestion.has_hint
                                ? 'bg-slate-300 shadow-none cursor-not-allowed'
                                : questionHints[currentQuestion.id]
                                    ? 'bg-linear-to-r from-purple-600 to-purple-700 shadow-purple-500/40 active:scale-[0.98]'
                                    : 'bg-linear-to-r from-purple-400 to-purple-500 shadow-purple-500/25 hover:from-purple-500 hover:to-purple-600 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]'
                        }`}
                    >
                        {currentQuestion.has_hint ? (
                            <Lock className="w-5 h-5" />
                        ) : (
                            <Lightbulb className="w-5 h-5" />
                        )}
                    </button>
                </div>

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

            {/* Confirm Use Hint Modal */}
            <Modal
                isOpen={isHintModalOpen}
                onClose={() => setIsHintModalOpen(false)}
                title="Use a Hint?"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        You have{' '}
                        <span className="font-semibold text-purple-600">
                            {currentHintFeature?.num_unlock}/{currentHintFeature?.limit_number}
                        </span>{' '}
                        hints available. Do you want to use one for this question?
                    </p>
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            onClick={() => setIsHintModalOpen(false)}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmUseHint}
                            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Insufficient Hints Modal */}
            <Modal
                isOpen={isHintUnavailableModalOpen}
                onClose={() => setIsHintUnavailableModalOpen(false)}
                title="No Hints Available"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        You don't have enough hints left to use right now. Earn more points to unlock additional hints.
                    </p>
                    <div className="flex justify-end pt-1">
                        <button
                            onClick={() => setIsHintUnavailableModalOpen(false)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </Modal>
        </div>

    )
}

export default QuizTakePage