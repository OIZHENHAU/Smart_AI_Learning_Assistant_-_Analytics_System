import React, { useState, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import quizService from "../../services/QuizService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Target, BookOpen } from 'lucide-react';


const QuizResultPage = () => {
    const { quizId } = useParams();
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

    const { data : {quiz, results: detailedResults }} = results;
    const score = quiz.score;
    const totalQuestions = detailedResults.length;
    const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
    const inCorrectAnswers = totalQuestions - correctAnswers;

    const getScoreMessage = (score) => {
        if (score >= 90) {
            return "Outstanding!";

        } else if (score >= 80 && score < 90) {
            return "Great Job!";

        } else if (score >= 70 && score < 80) {
            return "Good work!";

        } else if (score >= 60 && score < 70) {
            return "Not bad at all!";

        } else {
            return "Keep on Practicing!";
        }
    };

    return (
        <div className="">
            {/* Back Button */}
            <div className="">
                <Link
                    to={`/documents/${quiz.document.id}`}
                    className=""
                >
                    <ArrowLeft className="" strokeWidth={2}/>
                    Back to Document
                </Link>
            </div>

            <PageHeader title={`${quiz.title || 'Quiz'} Results`} />

            {/* Score Card */}
            <div className="">
                <div className="">
                    <div className="">
                        <Trophy className="" strokeWidth={2}/>
                    </div>

                    <div>
                        <p className="">
                            Your Score
                        </p>
                        <div className={`inline-block text-5xl font-bold bg-linear-to-r text-purple-600 bg-clip-text mb-2`}>
                            {score}%
                        </div>
                        <p className="">
                            {getScoreMessage(score)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuizResultPage