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
    }
};

export default User;

