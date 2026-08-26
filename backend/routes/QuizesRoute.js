import express from 'express';
import protect from '../middleware/Auth.js';
import {
    getQuizzes,
    getQuizById,
    getQuizResult,
    submitQuiz,
    deleteQuiz,
    getQuizHintByQuestionId,
    setHintOnQuestion
} from '../controller/QuizesController.js';

const quizRouter = express.Router();

//Protect all router when access quiz
quizRouter.use(protect);

quizRouter.get('/:documentId', getQuizzes);
quizRouter.get('/quiz/:quizId', getQuizById);
quizRouter.post('/:quizId/submit', submitQuiz);
quizRouter.get('/:quizId/results', getQuizResult);
quizRouter.delete('/:quizId', deleteQuiz);
quizRouter.get('/:quizId/hint/:questionId', getQuizHintByQuestionId)
quizRouter.post('/:quizId/set-hint/:questionId', setHintOnQuestion);


export default quizRouter;

