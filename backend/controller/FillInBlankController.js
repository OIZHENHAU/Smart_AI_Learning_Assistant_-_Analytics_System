import FillInBlank from '../models/FillInBlank.js';
import Achievement from '../models/Achievement.js';

const normalize = (str) => (str || '').toString().trim().toLowerCase();

//GET get all fill-in-the-blank sets for a document GET /api/fill-in-blank/:documentId
export const getSetsByDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Fail to get all fill-in-the-blank sets from the document. Please provide a valid document ID.",
                statusCode: 400
            });
        }

        const sets = await FillInBlank.getSetsByDocument({
            userId: req.user.id,
            documentId
        });

        res.status(200).json({
            success: true,
            count: sets.length,
            data: sets,
            message: "Fill-in-the-blank sets from the particular document are retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all fill-in-the-blank sets based on the document due to: " + error);
        next(error);
    }
};

//GET get all fill-in-the-blank sets based on the user id GET /api/fill-in-blank/all-sets
export const getAllSets = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const sets = await FillInBlank.getAllSets({ userId });

        res.status(200).json({
            success: true,
            count: sets.length,
            data: sets,
            message: "All fill-in-the-blank sets for the user are retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all fill-in-the-blank sets for the user due to: " + error);
        next(error);
    }
};

//GET set based on ID GET /api/fill-in-blank/set/:setId
export const getSetById = async (req, res, next) => {
    try {
        const { setId } = req.params;

        if (!setId) {
            return res.status(400).json({
                success: false,
                error: "Fail to retrieve the set by id. Please provide a valid set Id.",
                statusCode: 400
            });
        }

        const set = await FillInBlank.getSetById({ setId });

        if (!set) {
            return res.status(404).json({
                success: false,
                error: "No such fill-in-the-blank set was found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: set,
            message: "Fill-in-the-blank set retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank set based on it's id due to: " + error);
        next(error);
    }
};

//GET set hint by question id GET /api/fill-in-blank/:setId/hint/:questionId
export const getSetHintByQuestionId = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { setId, questionId } = req.params;

        if (!setId || !questionId) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid set or question ID.",
                statusCode: 400
            });
        }

        const hint = await FillInBlank.getSetHintByQuestionId({ setId, questionId, userId });

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
            message: "Fill-in-the-blank hint was retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank hint based on the question id at the controller due to: " + error);
        next(error);
    }
};

//GET set shield by question id GET /api/fill-in-blank/:setId/shield/:questionId
export const getShieldByQuestionId = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { setId, questionId } = req.params;

        if (!setId || !questionId) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid set or question ID.",
                statusCode: 400
            });
        }

        const shield = await FillInBlank.getShieldByQuestionId({ setId, questionId, userId });

        if (!shield) {
            return res.status(404).json({
                success: false,
                error: "No shield was provided or not found from the particular question.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: shield,
            message: "Protective shield was retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank shield based on the question id at the controller due to: " + error);
        next(error);
    }
};

//POST set hint on the particular question POST /api/fill-in-blank/:setId/set-hint/:questionId
export const setHintOnQuestion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { setId, questionId } = req.params;

        if (!setId || !questionId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid set or question ID.",
                statusCode: 400
            });
        }

        await FillInBlank.setHintOnQuestion({ setId, questionId, userId });

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
};

//POST set shield on the particular question POST /api/fill-in-blank/:setId/set-shield/:questionId
export const setShieldOnQuestion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { setId, questionId } = req.params;

        if (!setId || !questionId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid set or question id.",
                statusCode: 400
            });
        }

        await FillInBlank.setShieldOnQuestion({ setId, questionId, userId });

        res.status(200).json({
            success: true,
            data: true,
            message: "Shield was set up successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to set the shield on the particular question due to: " + error);
        next(error);
    }
};

//POST submit set answers POST /api/fill-in-blank/:setId/submit
// body: { answers: [{ questionId, blankOrder, selectedWord }, ...] }
export const submitSet = async (req, res, next) => {
    try {
        const { answers } = req.body;
        const { setId } = req.params;
        const userId = req.user.id;

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: "Please provide answers array.",
                statusCode: 400
            });
        }

        const set = await FillInBlank.getSetById({ setId });

        if (!set) {
            return res.status(404).json({
                success: false,
                error: "Fill-in-the-blank set not found!",
                statusCode: 404
            });
        }

        if (set.completed_at) {
            return res.status(400).json({
                success: false,
                error: "Set already completed.",
                statusCode: 400
            });
        }

        //Group answers by question so a question only counts as correct when every blank in it is correct
        const answersByQuestion = new Map();

        let correctBlanks = 0;
        let wrongBlanks = 0;
        let totalEarnLevelXP = 0;
        const userAnswers = [];

        for (const answer of answers) {
            const { questionId, blankOrder, selectedWord } = answer;
            const question = set.questions.find(q => q.id === questionId);

            if (!question) {
                continue;
            }

            const correctWord = await FillInBlank.getCorrectWord({ questionId, blankOrder });
            const isCorrect = normalize(selectedWord) === normalize(correctWord);

            if (isCorrect) {
                correctBlanks += 1;
            } else {
                wrongBlanks += 1;
            }

            await FillInBlank.saveAnswer({ setId, questionId, blankOrder, selectedWord, isCorrect });
            userAnswers.push({ questionId, blankOrder, selectedWord, isCorrect, answeredAt: new Date() });

            if (!answersByQuestion.has(questionId)) {
                answersByQuestion.set(questionId, []);
            }
            answersByQuestion.get(questionId).push(isCorrect);
        }

        //XP is only awarded per fully-correct question, same spirit as Quiz's per-question XP
        for (const [questionId, results] of answersByQuestion.entries()) {
            const question = set.questions.find(q => q.id === questionId);
            const questionXP = question?.num_xp || 0;
            const allBlanksCorrect = results.every(Boolean);

            totalEarnLevelXP += allBlanksCorrect ? questionXP : -questionXP;
        }

        const totalBlanks = correctBlanks + wrongBlanks;
        const score = totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 0;

        let totalEarnPoints = ((correctBlanks - wrongBlanks) <= 0) ? 0 : correctBlanks - wrongBlanks;

        await FillInBlank.submitSet({
            setId,
            score,
            completedAt: new Date()
        });

        await Achievement.updateEarnPoints({ userId, earnPoints: totalEarnPoints });
        await Achievement.updateDailyGoalProgress({ userId, eventType: 'quiz', amount: 1 });
        await Achievement.updateDailyGoalProgress({ userId, eventType: 'xp', amount: Math.max(totalEarnLevelXP, 0) });

        const allLevel = await Achievement.retrieveAllLevelXP();
        const currentAchievementStatistics = await Achievement.displayAchievementStatistic(userId);

        let newLevelXP = currentAchievementStatistics[0].total_xp + totalEarnLevelXP;
        let currentLevel = currentAchievementStatistics[0].current_level;

        for (const level of allLevel) {
            if (newLevelXP >= level.level_length) {
                currentLevel = level.level_number;
            } else {
                break;
            }
        }

        await Achievement.updateLevelAndXP({ userId, newLevel: currentLevel, newLevelXP });

        res.status(200).json({
            success: true,
            data: {
                setId,
                score,
                correctBlanks,
                totalBlanks,
                percentage: score,
                xp_gain: totalEarnLevelXP,
                total_earn_points: totalEarnPoints,
                userAnswers
            },
            message: "Fill-in-the-blank set submitted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to submit the fill-in-the-blank answers due to: " + error);
        next(error);
    }
};

//GET the set result based on it's id GET /api/fill-in-blank/:setId/results
export const getSetResult = async (req, res, next) => {
    try {
        const { setId } = req.params;

        const set = await FillInBlank.getSetResults({
            setId,
            userId: req.user.id
        });

        if (!set) {
            return res.status(404).json({
                success: false,
                error: "The particular set was not found.",
                statusCode: 404
            });
        }

        const detailedResults = set.questions.map(question => {
            const blankResults = [];

            for (let order = 1; order <= question.numBlanks; order++) {
                const userAnswer = set.user_answers.find(
                    a => a.question_id === question.id && a.blank_order === order
                );

                blankResults.push({
                    blankOrder: order,
                    correctWord: question.correctWords[order - 1],
                    selectedWord: userAnswer?.selected_word || null,
                    isCorrect: userAnswer?.is_correct || false
                });
            }

            return {
                questionId: question.id,
                question: question.questionText,
                blanks: blankResults,
                wordBank: question.wordBank,
                isCorrect: blankResults.every(b => b.isCorrect),
                explanation: question.explanation,
                topic: question.topic
            };
        });

        let totalEarnXP = detailedResults.reduce((total, result) => {
            const question = set.questions.find(q => q.id === result.questionId);
            const questionXP = question ? question.num_xp : 0;

            return result.isCorrect ? total + questionXP : total - questionXP;
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                set: {
                    id: set.id,
                    title: set.title,
                    documentTitle: set.document_title,
                    score: set.score,
                    totalQuestions: set.total_questions,
                    completedAt: set.completed_at,
                    totalEarnXP: totalEarnXP
                },
                results: detailedResults
            },
            message: "The fill-in-the-blank result retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the fill-in-the-blank result due to: " + error);
        next(error);
    }
};

//DELETE set based on id DELETE /api/fill-in-blank/:setId
export const deleteSet = async (req, res, next) => {
    try {
        const { setId } = req.params;

        if (!setId) {
            return res.status(404).json({
                success: false,
                error: "Please provide a valid set ID.",
                statusCode: 404
            });
        }

        const deleted = await FillInBlank.deleteSet({
            setId,
            userId: req.user.id
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "The set that want to delete was not found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: "The set was deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the set based on id due to: " + error);
        next(error);
    }
};
