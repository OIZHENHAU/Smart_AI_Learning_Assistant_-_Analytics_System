import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandling from './middleware/ErrorHandle.js';
import authRoutes from './routes/AuthRoute.js';
import documentRoutes from './routes/DocumentRoute.js';

//Import mysql
import mysql from 'mysql2';
import db from './config/MySQL.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Initialize express
const app = express();

// app.use(
//     cors({
//         origin: "*",
//         methods: ["GET", "POST", "PUT", "DELETE"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//         credentials: true,
//     })
// );

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.get('/', (req, res) => {
    res.send('Server + MySQL is working!');
});

//Routes to connect the backend call
app.use('/api/auth', authRoutes);
app.use('/api/document', documentRoutes);

//Handling error
app.use(errorHandling);

app.use('/uploads', express.static(path.join(__dirname, "uploads")));

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        statusCode: 404
    })
});

//Server Start
const PORT = process.env.PORT || 5528;

app.listen(PORT, () => {
    console.log(`Server running on the port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

process.on('unhandleRejection', (err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});
