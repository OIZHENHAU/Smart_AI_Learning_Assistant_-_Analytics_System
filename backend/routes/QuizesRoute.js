import express from 'express';
import protect from '../middleware/Auth.js';
import {
    getQuizzes,
    getQuizById,
    getQuizResult,
    submitQuiz,
    deleteQuiz
} from '../controller/QuizesController.js';

const quizRouter = express.Router();

//Protect all router when access quiz
quizRouter.use(protect);

quizRouter.get('/:documentId', getQuizzes);
quizRouter.get('/quiz/:quizId', getQuizById);
quizRouter.post('/:quizId/submit', submitQuiz);
quizRouter.get('/:quizId/results', getQuizResult);
quizRouter.delete('/:quizId', deleteQuiz);


export default quizRouter;

