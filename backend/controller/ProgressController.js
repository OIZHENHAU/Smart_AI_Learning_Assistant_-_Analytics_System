import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import db from '../config/MySQL.js';

//Get user's learning statistics GET /api/progress/dashboard
export const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // --- Quiz & document queries (always available) ---
        const [documentRows] = await db.execute(
            `SELECT COUNT(*) AS totalDocuments FROM documents WHERE user_id = ?`,
            [userId]
        );

        const [completedQuizRows] = await db.execute(
            `SELECT COUNT(*) AS completedQuizzes FROM quizzes WHERE user_id = ? AND completed_at IS NOT NULL`,
            [userId]
        );

        const [averageRows] = await db.execute(
            `SELECT AVG(score) AS averageScore FROM quizzes WHERE user_id = ? AND completed_at IS NOT NULL`,
            [userId]
        );

        const [trendRows] = await db.execute(
            `SELECT DATE_FORMAT(completed_at, '%b') AS month,
                    ROUND(AVG(score)) AS avg_score
             FROM quizzes
             WHERE user_id = ? AND completed_at IS NOT NULL
             GROUP BY DATE_FORMAT(completed_at, '%Y-%m'), DATE_FORMAT(completed_at, '%b')
             ORDER BY DATE_FORMAT(completed_at, '%Y-%m') ASC`,
            [userId]
        );

        const [recentQuizzes] = await db.execute(
            `SELECT id, title, score, total_questions, completed_at
             FROM quizzes
             WHERE user_id = ? AND completed_at IS NOT NULL
             ORDER BY completed_at DESC
             LIMIT 10`,
            [userId]
        );

        let totalLearningHours = 0;
        let weeklyRows = [];
        let timePatternRows = [];

        try {
            const [hoursRows] = await db.execute(
                `SELECT ROUND(SUM(duration_minutes) / 60, 1) AS totalHours
                 FROM study_sessions WHERE user_id = ? AND ended_at IS NOT NULL`,
                [userId]
            );
            totalLearningHours = hoursRows[0].totalHours || 0;

            const [weekly] = await db.execute(
                `SELECT DAYNAME(started_at) AS day,
                        ROUND(SUM(duration_minutes) / 60, 1) AS hours
                 FROM study_sessions
                 WHERE user_id = ? AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                   AND ended_at IS NOT NULL
                 GROUP BY DAY(started_at), DAYNAME(started_at)
                 ORDER BY DAY(started_at) ASC`,
                [userId]
            );
            weeklyRows = weekly;

            const [timePattern] = await db.execute(
                `SELECT
                    CASE
                        WHEN HOUR(started_at) BETWEEN 5 AND 11 THEN 'Morning'
                        WHEN HOUR(started_at) BETWEEN 12 AND 17 THEN 'Afternoon'
                        ELSE 'Evening'
                    END AS time_of_day,
                    COUNT(*) AS session_count
                 FROM study_sessions
                 WHERE user_id = ? AND ended_at IS NOT NULL
                 GROUP BY time_of_day`,
                [userId]
            );
            timePatternRows = timePattern;
        } catch (sessionErr) {
            console.warn("Study session data unavailable:", sessionErr.message);
        }

        res.status(200).json({
            success: true,
            data: {
                total_document: documentRows[0].totalDocuments,
                completed_quiz: completedQuizRows[0].completedQuizzes,
                average_score: Math.round(averageRows[0].averageScore || 0),
                performance_trend: trendRows,
                recent_quizzes: recentQuizzes,
                total_learning_hour: totalLearningHours,
                weekly_activity: weeklyRows,
                study_time_pattern: timePatternRows
            }
        });

    } catch (error) {
        console.error("Fail to load the user's learning statistics due to: " + error);
        next(error);
    }
}

//Get topic-level performance analytics GET /api/progress/topic-analysis
export const getTopicAnalysis = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [topicRows] = await db.execute(
            `
            SELECT
                q.topic,
                COUNT(*) AS total_questions,
                SUM(ua.is_correct) AS correct_answers,
                ROUND((SUM(ua.is_correct) / COUNT(*)) * 100) AS mastery_percentage
            FROM questions q
            JOIN user_answers ua ON ua.question_id = q.id
            JOIN quizzes qz ON qz.id = q.quiz_id
            WHERE qz.user_id = ?
                AND q.topic IS NOT NULL
                AND q.topic != ''
            GROUP BY q.topic
            ORDER BY mastery_percentage ASC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: topicRows
        });

    } catch (error) {
        console.error("Fail to get topic analysis due to: " + error);
        next(error);
    }
};

//Start a study session POST /api/progress/sesson/start
export const startSession = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            `INSERT INTO study_sessions (user_id, started_at)
            VALUES (?, NOW())`,
            [userId]
        );

        res.status(201).json({
            success: true,
            data: {
                sessionId: result.insertId
            },
            message: "Study session started successfully.",
            statsuCode: 201
        });

    } catch (error) {
        console.error("Fail to start study session due to: " + error);
        next(error);
    }
}

//.End the study session PATCH /api/progress/session/:sessionId/end
export const endSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        await db.execute(
            `
            UPDATE study_sessions
            SET ended_at = NOW(),
                duration_minutes = TIMESTAMPDIFF(MINUTE, started_at, NOW())
            WHERE id = ? AND user_id = ?
            `,
            [sessionId, userId]
        );

        res.status(200).json({
            success: true,
            message: "Study session ended successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to end the study session due to: " + error);
        next(errror);
    }
}