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
    },

    //Everyone who asked to join (or was added to) the class, with the same filters as User Management.
    async getMembers(classId, { username, email, role, startDate, endDate } = {}) {
        try {
            let query = `SELECT u.id, u.username, u.email, u.role, m.status, m.joined_at AS created_at
                         FROM class_members m
                         JOIN users u ON u.id = m.user_id
                         JOIN classes c ON c.id = m.class_id
                         WHERE m.class_id = ? AND m.user_id <> c.owner_id`;
            const params = [classId];

            if (username && username.trim()) {
                query += ` AND u.username LIKE ?`;
                params.push(`%${username.trim()}%`);
            }
            if (email && email.trim()) {
                query += ` AND u.email LIKE ?`;
                params.push(`%${email.trim()}%`);
            }
            if (role && role.trim()) {
                query += ` AND u.role = ?`;
                params.push(role.trim());
            }
            if (startDate) {
                query += ` AND DATE(m.joined_at) >= ?`;
                params.push(startDate);
            }
            if (endDate) {
                query += ` AND DATE(m.joined_at) <= ?`;
                params.push(endDate);
            }
            query += ` ORDER BY m.joined_at DESC`;

            const [rows] = await db.execute(query, params);
            return rows;

        } catch (error) {
            console.error("Fail to get the class members due to: " + error);
            throw error;
        }
    },

    //Approve a pending request or re-activate a deactivated member. Re-checks the class limit inside a transaction.
    async approveMember(classId, userId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [classRows] = await connection.execute(
                `SELECT max_students FROM classes WHERE id = ? FOR UPDATE`, [classId]
            );
            const [memberRows] = await connection.execute(
                `SELECT status FROM class_members WHERE class_id = ? AND user_id = ?`, [classId, userId]
            );
            if (!classRows[0] || !memberRows[0]) {
                await connection.rollback();
                return 'not_found';
            }
            if (memberRows[0].status === 'approved') {
                await connection.rollback();
                return 'already_approved';
            }

            const [[{ total }]] = await connection.execute(
                `SELECT COUNT(*) AS total FROM class_members WHERE class_id = ? AND status = 'approved'`, [classId]
            );
            if (total >= classRows[0].max_students) {
                await connection.rollback();
                return 'full';
            }

            await connection.execute(
                `UPDATE class_members SET status = 'approved' WHERE class_id = ? AND user_id = ?`, [classId, userId]
            );
            await connection.commit();
            return 'approved';

        } catch (error) {
            await connection.rollback();
            console.error("Fail to approve the class member due to: " + error);
            throw error;

        } finally {
            connection.release();
        }
    },

    //Only an approved member can be deactivated. Returns false when there was nothing to update.
    async deactivateMember(classId, userId) {
        const [result] = await db.execute(
            `UPDATE class_members SET status = 'deactivated'
             WHERE class_id = ? AND user_id = ? AND status = 'approved'`,
            [classId, userId]
        );
        return result.affectedRows > 0;
    },

    //Removes the member (or rejects a pending request). Returns false when they were not in the class.
    async removeMember(classId, userId) {
        const [result] = await db.execute(
            `DELETE FROM class_members WHERE class_id = ? AND user_id = ?`, [classId, userId]
        );
        return result.affectedRows > 0;
    }
};

export default Classroom;
