import Quiz from '../models/Quiz.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';

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

//GET quizzes hint by question id GET /api/quizzes/:quizId/hint/:questionId
export const getQuizHintByQuestionId = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quizId, questionId } = req.params;
        
        if (!quizId || !questionId) {
            return res.status(400).json({
                success: false,
                error: "Please provide the valid quiz or question ID.",
                statusCode: 400
            });
        }

        const hint = await Quiz.getQuizHintByQuestionId({ quizId, questionId, userId });

        if (!hint) {
            return res.status(404).json({
                success: false,
                error: "No hint was provided or not found from the particular question.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: hint,
            message: "Quiz hint was retreived successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the quiz hint based on the question id at the controller due to: " + error);
        next(error);
    }
};

//GET quiz shield by question id GET /api/quizzes/:quizId/shield/:questionId
export const getShieldByQuestionId = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quizId, questionId } = req.params;

        if (!quizId || !questionId) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid quiz or question ID.",
                statusCode: 400
            });
        }

        const shield = await Quiz.getShieldByQuestionId({ quizId, questionId, userId });
        
        if (!shield) {
            return res.status(404).json({
                success: false,
                error: "No shield was provded or not found from the particualr questions.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: shield,
            message: "Protective shield was retrieved successfully.",
            statsuCode: 200
        });

    } catch (error) {
        console.error("Fail to get the quiz shield bassed on the question id at the controller due to: " + error);
        next(error);
    }
}

//POST Set hint in the particular question POST /api/quizzes/:quizId/set-hint/:questionId
export const setHintOnQuestion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quizId, questionId } = req.params;

        if (!quizId || !questionId) {
            return res.status(400).json({
                success: false,
                message: "Please a valid quiz or question ID.",
                statusCode: 400
            });
        }

        await Quiz.setHintOnQuestion({ quizId, questionId, userId });

        res.status(200).json({
            success: true,
            data: true,
            message: "The hint was set up successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to set the hint on the particular question at the controller due to: " + error);
        next(error);
    }
}

//POST Set shield on the particular question POST /api/quizzes/:quizId/set-shield/:questionId
export const setShieldOnQuestion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quizId, questionId } = req.params;

        if (!quizId || !questionId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid quiz or question id.",
                statusCode: 400
            });
        }

        await Quiz.setShieldOnQuestion({ quizId, questionId, userId });

        res.status(200).json({
            success: true,
            data: true,
            message: "Shield was set up successfully.",
            statsuCode: 200
        });

    } catch (error) {
        console.error("Fail to set the shield on the particular question due to: " + error);
        next(error);
    }
}

//Submit quiz answer POST /api/quizzes/:quizId/submit
export const submitQuiz = async (req, res, next) => {
    try {
        const { answers } = req.body;
        const { quizId } = req.params;
        const userId = req.user.id;

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
        //Total correct answer count
        let correctCount = 0;
        //Total incorrect answer count
        let wrongCount = 0;
        const userAnswers = [];
        //Total earn level XP
        let totalEarnLevelXP = 0;

        for (const answer of answers) {
            const { questionId, selectedAnswer } = answer;
            const question = quiz.questions.find(q => q.id === questionId);

            if (question) {
                const isCorrect = (selectedAnswer === question.correct_answer);
                const questionXP = question.num_xp || 0;

                if (isCorrect) {
                    correctCount += 1;
                    totalEarnLevelXP += questionXP;

                } else {
                    wrongCount += 1;
                    totalEarnLevelXP -= questionXP;
                }

                await Quiz.saveAnswer({ quizId, questionId: question.id, selectedAnswer, isCorrect });
                userAnswers.push({ questionId, selectedAnswer, isCorrect, answeredAt: new Date() });
            }
        }

        const score = Math.round(
            (correctCount / quiz.total_questions) * 100
        );

        //Overall points
        let totalEarnPoints = ((correctCount - wrongCount) <= 0) ? 0 : correctCount - wrongCount;

        //Update quiz result
        await Quiz.submitQuiz({
            quizId,
            score,
            completedAt: new Date()
        });

        //Update the achievement points
        await Achievement.updateEarnPoints({
            userId,
            earnPoints: totalEarnPoints
        });

        //Check and update the current level of the user
        const allLevel = await Achievement.retrieveAllLevelXP();
        const currentAchievementStatistics = await Achievement.displayAchievementStatistic(userId);

        let newLevelXP = currentAchievementStatistics[0].total_xp + totalEarnLevelXP;
        let currentLevel = currentAchievementStatistics[0].current_level;

        //Check if the new level XP is greater than the level length, 
        // then update the current level
        for (const level of allLevel) {
            if (newLevelXP >= level.level_length) {
                currentLevel = level.level_number;

            } else {
                break;
            }
        }
        //Update the earn level and XP
        await Achievement.updateLevelAndXP({
            userId,
            newLevel: currentLevel,
            newLevelXP
        });

        res.status(200).json({
            success: true,
            data: {
                quizId,
                score,
                correctCount,
                totalQuestions: quiz.total_questions,
                percentage: score,
                xp_gain: totalEarnLevelXP,
                total_earn_points: totalEarnPoints,
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
                explanation: question.explanation,
                topic: question.topic
            };
        });
        
        //Get the number of earn XP
        let totalEarnXP = detailedResults.reduce((total, result) => {
            const question = quiz.questions.find(q => q.id === result.questionId);

            if (result.isCorrect) {
                return total + (question ? question.num_xp : 0);

            } else {
                return total - (question ? question.num_xp : 0);
            }

            //return total;

        }, 0);

        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    documentTitle: quiz.document_title,
                    score: quiz.score,
                    totalQuestions: quiz.total_questions,
                    completedAt: quiz.completed_at,
                    totalEarnXP: totalEarnXP
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