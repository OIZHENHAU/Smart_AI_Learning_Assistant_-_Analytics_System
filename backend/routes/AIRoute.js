import express from 'express';
import {
    generateFlashcards,
    generateQuiz,
    generateFillInBlank,
    generateSummary,
    geminiAIChat,
    explainConcept,
    getChatHistory
} from '../controller/AIController.js';
import protect from '../middleware/Auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate-flashcard', generateFlashcards);
router.post('/generate-quiz', generateQuiz);
router.post('/generate-fill-in-blank', generateFillInBlank);
router.post('/generate-summary', generateSummary);
router.post('/ai-chat', geminiAIChat);
router.post('/explain-concept', explainConcept);
router.get('/chat-history/:documentId', getChatHistory);

export default router;