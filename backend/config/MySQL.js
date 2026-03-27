import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

//Test the MySQL connection
db.connect((err) => {
    if (err) {
        console.error("Database connection failed due to: " + err);

    } else {
        console.log("MySQL database connected successfully!");
    }
});

export default db;