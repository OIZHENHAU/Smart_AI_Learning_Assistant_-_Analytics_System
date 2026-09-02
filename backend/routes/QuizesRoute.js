import express from 'express';
import protect from '../middleware/Auth.js';
import {
    getQuizzesByDocument,
    getAllQuizzes,
    getQuizById,
    getQuizResult,
    submitQuiz,
    deleteQuiz,
    getQuizHintByQuestionId,
    setHintOnQuestion,
    getShieldByQuestionId,
    setShieldOnQuestion
} from '../controller/QuizesController.js';

const quizRouter = express.Router();

//Protect all router when access quiz
quizRouter.use(protect);

quizRouter.get('/all-quizzes', getAllQuizzes);
quizRouter.get('/:documentId', getQuizzesByDocument);
quizRouter.get('/quiz/:quizId', getQuizById);
quizRouter.post('/:quizId/submit', submitQuiz);
quizRouter.get('/:quizId/results', getQuizResult);
quizRouter.delete('/:quizId', deleteQuiz);
quizRouter.get('/:quizId/hint/:questionId', getQuizHintByQuestionId);
quizRouter.post('/:quizId/set-hint/:questionId', setHintOnQuestion);
quizRouter.get('/:quizId/shield/:questionId', getShieldByQuestionId);
quizRouter.post('/:quizId/set-shield/:questionId', setShieldOnQuestion);


export default quizRouter;

