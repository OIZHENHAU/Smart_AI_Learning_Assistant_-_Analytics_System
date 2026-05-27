import Quiz from '../models/Quiz.js';

//Get all quiz from the document GET /api/quizzes/:documentId
export const getQuizzes = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Fail to get all quizzes from the document. Please provude a valid document ID.",
                statusCode: 400
            });
        }

        const quizzes = await Quiz.getQuizzesByDocument(
            {
                userId: req.user.id,
                documentId
            }
        );

        res.status(200).json({
            success: true,
            count: quizzes.length,
            data: quizzes,
            message: "Quizzes from the particular document are retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all quiz based on the document due to: " + error);
        next(error);

    }
};

//Get quiz based on ID GET /api/quizzes/quiz/:quizId
export const getQuizById = async (req, res, next) => {
    try {
        const { quizId } = req.params;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                error: "Fail to retrieve the quiz by id. Please provide a valid quiz Id.",
                statusCode: 400
            });
        }

        const quiz = await Quiz.getQuizById({ quizId });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "No such quiz was found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: quiz,
            message: "Quiz retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the quiz base on it's id due to: " + error);
        next(error);
    }
};

//Submit quiz answer POST /api/quizzes/:quizId/submit
export const submitQuiz = async (req, res, next) => {
    try {
        const { answers } = req.body;
        const { quizId } = req.params;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: "Please provide answers array.",
                statusCode: 400
            });
        }

        //Get quiz
        const quiz = await Quiz.getQuizById({ quizId, userId: req.user.id });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "Quiz not found!",
                statusCode: 404
            });
        }

        //Check if the quiz has already completed
        if (quiz.completed_at) {
            return res.status(400).json({
                success: false,
                error: "Quiz already completed.",
                statusCode: 400
            });
        }

        //Process answer
        let correctCount = 0;
        const userAnswers = [];

        for (const answer of answers) {
            const { questionId, selectedAnswer } = answer;
            const question = quiz.questions.find(q => q.id === questionId);

            if (question) {
                const isCorrect = (selectedAnswer === question.correct_answer);

                if (isCorrect) {
                    correctCount += 1;
                }

                await Quiz.saveAnswer({ quizId, questionId: question.id, selectedAnswer, isCorrect });
                userAnswers.push({ questionId, selectedAnswer, isCorrect, answeredAt: new Date() });
            }
        }

        const score = Math.round(
            (correctCount / quiz.total_questions) * 100
        );

        //Update quiz result
        await Quiz.submitQuiz({
            quizId,
            score,
            completedAt: new Date()
        });

        res.status(200).json({
            success: true,
            data: {
                quizId,
                score,
                correctCount,
                totalQuestions: quiz.total_questions,
                percentage: score,
                userAnswers
            },
            message: "Quiz submitted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to submit the quiz answer due to: " + error);
        next(error);
    }
};

//Get the quiz result based on it's id GET /api/quizzes/:quizId/result
export const getQuizResult = async (req, res, next) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.getQuizResults({
            quizId,
            userId: req.user.id
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: "The particular quiz was not found.",
                statusCode: 404
            });
        }

        //Build the details results
        const detailedResults = quiz.questions.map(question => {
            const userAnswer = quiz.user_answers.find(
                a => a.question_id === question.id
            );

            return {
                questionId: question.id,
                question: question.question,
                options: question.options,
                correctAnswer: question.correct_answer,
                selectedAnswer: userAnswer?.selected_answer || null,
                isCorrect: userAnswer?.is_correct || false,
                explanation: question.explanation
            };
        });
        
        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    documentTitle: quiz.document_title,
                    score: quiz.score,
                    totalQuestions: quiz.total_questions,
                    completedAt: quiz.completed_at
                },
                results: detailedResults
            },
            message: "The qyuiz result retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the quiz result due to: " + error);
        next(error);
    }

};

//Delte quiz based on id DELETE /api/quizzes/:quizId
export const deleteQuiz = async (req, res, next) => {
    try {
        const { quizId } = req.params;

        if (!quizId) {
            res.status(404).json({
                success: false,
                error: "Please provide a valid quiz ID.",
                statusCode: 404
            });
        }

        const deleted = await Quiz.deleteQuiz({
            quizId,
            userId: req.user.id
        });
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "The quiz that want to delete was not found.",
                ststusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: "The quiz was deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the qyiz based on id due to: " + error);
        next(error);
    }
}