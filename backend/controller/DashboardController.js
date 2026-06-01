import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import db from '../config/MySQL.js';

//Get user's learning statistics GET /api/dashboard/main-page
//Get user's learning statistics GET /api/progress/dashboard
export const getMainDashboard = async (req, res, next) => {
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

        //Get all quizzes
        const [totalQuizRows] = await db.execute(
            `
            SELECT COUNT(*) AS totalQuizzes
            FROM quizzes
            WHERE user_id = ?
            `, [userId]
        );

        const totalQuizzes = totalQuizRows[0].totalQuizzes;


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

        //Get all recent document list
        const [recentDocument] = await db.execute(
            `
            SELECT id, title, file_name, upload_date
            FROM documents
            WHERE user_id = ?
            ORDER BY upload_date DESC
            LIMIT 10
            `, [userId]
        );


        res.status(200).json({
            success: true,
            data: {
                total_document: totalDocuments,
                total_quiz: totalQuizzes,
                recent_quizzes: recentQuizzes,
                recent_document: recentDocument
            }
        });

    } catch (error) {
        console.error("Fail to load the main page/dashboard at the frontend due to: " + error);
        next(error);
    }
}