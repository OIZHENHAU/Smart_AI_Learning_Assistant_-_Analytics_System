import express from 'express';
import protect from '../middleware/Auth.js';
import {
    getSetsByDocument,
    getAllSets,
    getSetById,
    getSetResult,
    submitSet,
    deleteSet,
    getSetHintByQuestionId,
    setHintOnQuestion,
    getShieldByQuestionId,
    setShieldOnQuestion
} from '../controller/FillInBlankController.js';

const fillInBlankRouter = express.Router();

//Protect all router when access fill-in-the-blank
fillInBlankRouter.use(protect);

fillInBlankRouter.get('/all-sets', getAllSets);
fillInBlankRouter.get('/:documentId', getSetsByDocument);
fillInBlankRouter.get('/set/:setId', getSetById);
fillInBlankRouter.post('/:setId/submit', submitSet);
fillInBlankRouter.get('/:setId/results', getSetResult);
fillInBlankRouter.delete('/:setId', deleteSet);
fillInBlankRouter.get('/:setId/hint/:questionId', getSetHintByQuestionId);
fillInBlankRouter.post('/:setId/set-hint/:questionId', setHintOnQuestion);
fillInBlankRouter.get('/:setId/shield/:questionId', getShieldByQuestionId);
fillInBlankRouter.post('/:setId/set-shield/:questionId', setShieldOnQuestion);

export default fillInBlankRouter;
