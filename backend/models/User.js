import db from '../config/MySQL.js';
import bcrypt from 'bcryptjs';

const User = {
    //Create User Account
    async create({username, email, password, phone_number}) {
        const salt = await bcrypt.genSalt(10);
        const password_hashing = await bcrypt.hash(password, salt);

        //Time when the account was created
        const currentTime = new Date();

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO users (username, email, password_hash, phone_number, created_at)
                VALUES (?, ?, ?, ?, ?)`,
                [username, email.toLowerCase(), password_hashing, phone_number || null, currentTime]
            );

            const userId = result.insertId;

            await connection.execute(
                `INSERT INTO achievements (user_id, current_level, total_points, current_rank, current_steak, total_xp)
                VALUES (?, 0, 0, 0, 0, 0)`,
                [userId]
            );

            await connection.commit();

            return userId;

        } catch (error) {
            await connection.rollback();
            console.error("Fail to create the user account at the controller due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    async findMatchEmail(email) {
        const [rows] = await db.execute(
            `SELECT * FROM users WHERE email = ?`,
            [email.toLowerCase()]
        );

        return rows[0];
    },

    async findMatchPassword(enteredPassword, storedHash) {
        return await bcrypt.compare(enteredPassword, storedHash);
    },

    async findAcountById(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM users WHERE id = ?`, [userId]
        );

        return rows[0];
    },

    async updateUserProfile(userId, {username, email, phone_number}) {
        const [result] = await db.execute(
            `UPDATE users
             SET username = ?, email = ?, phone_number = ?
             WHERE id = ?`,
             [username, email.toLowerCase(), phone_number || null, userId]
        );
        return result;
    },

    async updateNewPassword(userId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await db.execute(
            `UPDATE users SET password_hash = ? WHERE id = ?`, [newHashPassword, userId]
        );

        return result;
    },

    async deleteUserAccount(userId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            //Quiz-related data (options/user_answers/questions depend on quizzes, quiz_schedules depends on quizzes)
            await connection.execute(
                `DELETE o FROM options o
                 JOIN questions q ON o.question_id = q.id
                 JOIN quizzes qz ON q.quiz_id = qz.id
                 WHERE qz.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE ua FROM user_answers ua
                 JOIN quizzes qz ON ua.quiz_id = qz.id
                 WHERE qz.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE q FROM questions q
                 JOIN quizzes qz ON q.quiz_id = qz.id
                 WHERE qz.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM quiz_schedules WHERE user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM quizzes WHERE user_id = ?`, [userId]
            );

            //Flashcard-related data
            await connection.execute(
                `DELETE fi FROM flashcard_items fi
                 JOIN flashcards f ON fi.flashcard_id = f.id
                 WHERE f.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM flashcards WHERE user_id = ?`, [userId]
            );

            //Chat-related data (messages/relevant_chunks depend on chat_histories)
            await connection.execute(
                `DELETE m FROM messages m
                 JOIN chat_histories ch ON m.chat_id = ch.id
                 WHERE ch.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE rc FROM relevant_chunks rc
                 JOIN chat_histories ch ON rc.chat_id = ch.id
                 WHERE ch.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM chat_histories WHERE user_id = ?`, [userId]
            );

            //Document-related data (document_chunks depends on documents)
            await connection.execute(
                `DELETE dc FROM document_chunks dc
                 JOIN documents d ON dc.document_id = d.id
                 WHERE d.user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM documents WHERE user_id = ?`, [userId]
            );

            //Study session and gamification data
            await connection.execute(
                `DELETE FROM study_sessions WHERE user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM unlocked_features WHERE user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM achievements WHERE user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM badges WHERE user_id = ?`, [userId]
            );
            await connection.execute(
                `DELETE FROM daily_goal WHERE user_id = ?`, [userId]
            );

            //Finally, the user row itself
            const [result] = await connection.execute(
                `DELETE FROM users WHERE id = ?`, [userId]
            );

            await connection.commit();
            return result;

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }
    }
};

export default User;

