import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import db from '../config/MySQL.js';

//Get user's learning statistics GET /api/progress/dashboard
export const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;

        //Get total docuemnt counts
        const [documentRows] = await db.execute(
            `
            SELECT COUNT(*) AS totalDocuments
            FROM documents
            WHERE user_id = ?
            `, [userId]
        );
        const totalDocuments = documentRows[0].totalDocuments;
        //const totalFlashcardSets = await Flashcard.countDocuments({ userId });

        //Get all completed quiz
        const [completedQuizRows] = await db.execute(
            `
            SELECT COUNT(*) AS completedQuizzes
            FROM quizzes
            WHERE user_id = ?
                AND completed_at IS NOT NULL
            `,
            [userId]
        );

        const completedQuizzes = completedQuizRows[0].completedQuizzes;

        //Get the average score of the quizzes
        const [averageRows] = await db.execute(
            `
            SELECT AVG(score) AS averageScore
            FROM quizzes
            WHERE user_id = ?
                AND completed_at IS NOT NULL
            `,
            [userId]
        );

        const averageScore = Math.round(averageRows[0].averageScore || 0);

        //Get performance trend
        const [trendRows] = await db.execute(
            `
            SELECT DATE_FORMAT(completed_at, '%b') AS month,
                    DATE_FORMAT(completed_at, '%Y-%m') AS month_sort,
                    ROUND(AVG(score)) AS avg_score
            FROM quizzes
            WHERE user_id = ? AND completed_at IS NOT NULL
            GROUP BY month_sort
            ORDER BY month_sort ASC
            `
            , [userId]
        );

        //Get quiz performance list
        const [recentQuizzes] = await db.execute(
            `
            SELECT id, title, score, total_questions, completed_at
            FROM quizzes
            WHERE user_id = ? AND completed_at IS NOT NULL
            ORDER BY completed_at DESC
            LIMIT 10
            `, [userId]
        );

        //Get totla learning hours
        const [hoursRows] = await db.execute(
            `
            SELECT ROUND(SUM(duration_minutes) / 60, 1) AS totalHours
            FROM study_sessions
            WHERE user_id = ? AND ended_at IS NOT NULL
            `,
            [userId]
        );

        const totalLearningHours = hoursRows[0].totalHours || 0;

        //Geet weekly activity where session count per day this week
        const [weeklyRows] = await db.execute(
            `
            SELECT DAYNAME(started_at) AS day, COUNT(*) AS sessions
            FROM study_sessions
            WHERE user_id = ?
                AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DAY(started)
            `
        );

        //Total learning hours
        const [hoursRows] = await db.execute(
            `
            SELECT ROUND(SUM(duration_minutes) / 60, 1) AS totalHours
            FROM study_sessions
            WHERE user_id = ? AND ended_at IS NOT NULL
            `,
            [userId]
        );

        //Weekly activity where the session count per day this week
        const [weeklyRows] = await db.execute(
            `
            SELECT DAYNAME(started_at) AS day,
                COUNT(*) AS sessions
            FROM study_sessions
            WHERE user_id = ?
                AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DAY(started_at), DAYNAME(started_at)
            ORDER BY DAY(started_at) ASC
            `,
            [userId]
        );

        //Study time pattern like Morning, Evening, Afternoon BreakDown
        const [timePatternRows] = await db.execute(
            `
            SELECT
                CASE
                    WHEN HOUR(started_at) BETWEEN 5 AND 11 THEN 'Morning'
                    WHEN HOUR(started_at) BETWEEN 12 AND 17 THEN 'Afternoon'
                    ELSE 'Evening'
                END AS time_of_day,
                COUNT(*) AS session_count
            FROM study_sessions
            WHERE user_id = ? AND ended_at IS NOT NULL
            GROUP BY time_of_day        
            `,
            [userId]
        );


        res.status(200).json({
            success: true,
            data: {
                total_document: totalDocuments,
                completed_quiz: completedQuizzes,
                average_score: averageScore,
                performance_trend: trendRows,
                recent_quizzes: recentQuizzes,
                total_learning_hour: totalLearningHours,
                weekly_activity: weeklyRows,
                study_time_pattern: timePatternRows
            }
        });

    } catch (error) {
        console.error("Fail to load the user's learning statistics due to: " + error);
        throw error;
    }
}

//Start a study session POST /api/progress/sesson/start
export const startSession = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            `INSERT INTO study session (user_id, started_at)
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