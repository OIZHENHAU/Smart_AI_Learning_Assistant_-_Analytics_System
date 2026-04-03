import db from '../config/MySQL.js';
import bcrypt from 'bcryptjs';

const User = {
    //Create User Account
    async create({username, email, password, phone_number}) {
        const salt = await bcrypt.genSalt(10);
        const password_hashing = await bcrypt.hash(password, salt);

        //Time when the account was created
        const currentTime = new Date();

        const [result] = await db.execute(
            `INSERT INTO users (username, email, password_hash, phone_number, created_at)
             VALUES (?, ?, ?, ?, ?)`,
             [username, email.toLowerCase(), password_hashing, phone_number || null, currentTime]
        );

        return result.insertId;
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
        const [result] = await db.execute(
            `DELETE FROM users WHERE id = ?`, [userId]
        );

        return result;
    }
};

export default User;

