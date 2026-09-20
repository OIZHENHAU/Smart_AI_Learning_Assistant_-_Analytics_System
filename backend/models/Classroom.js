import crypto from 'crypto';
import db from '../config/MySQL.js';

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 5;

const generateClassCode = () =>
    Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');

const CLASS_SELECT = `SELECT c.id, c.owner_id, u.username AS owner_name, c.class_name, c.class_code,
                             c.max_students, c.created_at,
                             (SELECT COUNT(*) FROM class_members m
                              WHERE m.class_id = c.id AND m.status = 'approved') AS member_count,
                             (SELECT m.status FROM class_members m
                              WHERE m.class_id = c.id AND m.user_id = ?) AS my_status
                      FROM classes c
                      JOIN users u ON u.id = c.owner_id`;

const Classroom = {
    async createClassroom({ ownerId, className, maxStudents }) {
        for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            const classCode = generateClassCode();

            try {
                const [result] = await db.execute(
                    `INSERT INTO classes (owner_id, class_name, class_code, max_students, created_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [ownerId, className, classCode, maxStudents, new Date()]
                );
                return { id: result.insertId, class_code: classCode };

            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') continue;
                console.error("Fail to create the class due to: " + error);
                throw error;
            }
        }

        throw new Error('Unable to generate a unique class code. Please try again.');
    },

    async getAllClasses({ userId, role, className, classCode, startDate, endDate }) {
        try {
            let query = CLASS_SELECT;
            const conditions = [];
            const params = [userId];

            if (role === 'student') {
                conditions.push(`EXISTS (SELECT 1 FROM class_members m WHERE m.class_id = c.id AND m.user_id = ?)`);
                params.push(userId);
            } else if (role !== 'admin') {
                conditions.push(`c.owner_id = ?`);
                params.push(userId);
            }
            if (className && className.trim()) {
                conditions.push(`c.class_name LIKE ?`);
                params.push(`%${className.trim()}%`);
            }
            if (classCode && classCode.trim()) {
                conditions.push(`c.class_code LIKE ?`);
                params.push(`%${classCode.trim()}%`);
            }
            if (startDate) {
                conditions.push(`DATE(c.created_at) >= ?`);
                params.push(startDate);
            }
            if (endDate) {
                conditions.push(`DATE(c.created_at) <= ?`);
                params.push(endDate);
            }

            if (conditions.length > 0) {
                query += ` WHERE ` + conditions.join(' AND ');
            }
            query += ` ORDER BY c.created_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;

        } catch (error) {
            console.error("Fail to get all the classes due to: " + error);
            throw error;
        }
    },

    async getClassById(classId, userId) {
        const [rows] = await db.execute(`${CLASS_SELECT} WHERE c.id = ?`, [userId, classId]);
        return rows[0];
    },

    async getClassByCode(classCode, userId) {
        const [rows] = await db.execute(`${CLASS_SELECT} WHERE c.class_code = ?`, [userId, classCode]);
        return rows[0];
    },

    async updateClass(classId, { className, maxStudents }) {
        const [result] = await db.execute(
            `UPDATE classes SET class_name = ?, max_students = ? WHERE id = ?`,
            [className, maxStudents, classId]
        );
        return result;
    },

    async deleteClass(classId) {
        const [result] = await db.execute(`DELETE FROM classes WHERE id = ?`, [classId]);
        return result;
    },

    async joinClass(classId, userId, role) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [classRows] = await connection.execute(
                `SELECT id, max_students FROM classes WHERE id = ? FOR UPDATE`, [classId]
            );
            if (!classRows[0]) {
                await connection.rollback();
                return 'not_found';
            }

            const [existing] = await connection.execute(
                `SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?`, [classId, userId]
            );
            if (existing.length > 0) {
                await connection.rollback();
                return 'already_joined';
            }

            const [[{ total }]] = await connection.execute(
                `SELECT COUNT(*) AS total FROM class_members WHERE class_id = ? AND status = 'approved'`, [classId]
            );
            if (total >= classRows[0].max_students) {
                await connection.rollback();
                return 'full';
            }

            const isStudent = role === 'student';
            await connection.execute(
                `INSERT INTO class_members (class_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)`,
                [classId, userId, isStudent ? 'pending' : 'approved', new Date()]
            );

            await connection.commit();
            return isStudent ? 'requested' : 'joined';

        } catch (error) {
            await connection.rollback();
            console.error("Fail to join the class due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    }
};

export default Classroom;
