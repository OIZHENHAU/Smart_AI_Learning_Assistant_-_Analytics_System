import express from 'express';
import {
    getFlashcardsDocument,
    getAllFlashcards,
    reviewFlashcard,
    toggleStarFlashcard,
    deleteFlashcardsSet,
} from '../controller/FlashcardController.js';
import protect from '../middleware/Auth.js';

const router = express.Router();

router.use(protect);

//Get all falshcards
router.get('/all-flashcard', getAllFlashcards);
//Get particukar flashcard based on document id
router.get('/:documentId', getFlashcardsDocument);
//View on a flashcards
router.post('/:cardId/review', reviewFlashcard);
//Star the flAshcards
router.put('/:cardId/star', toggleStarFlashcard);
//Delete a particular falshcards
router.delete('/:id', deleteFlashcardsSet);

export default router;