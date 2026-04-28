import express from 'express';
import {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    geminiAIChat,
    explainConcept,
    getChatHistory
} from '../controller/AIController.js';
import protect from '../middleware/Auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate-flashcards', generateFlashcards);
router.post('/generate-quiz', generateQuiz);
router.post('/generate-summary', generateSummary);
router.post('/ai-chat', geminiAIChat);
router.post('/explain-concept', explainConcept);
router.get('/chat-history/:documentId', getChatHistory);

export default router;