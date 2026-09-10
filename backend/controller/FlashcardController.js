import Flashcard from '../models/Flashcard.js';

//Get all falshcards from a document GET /api/flashcards/:documentId
export const getFlashcardsDocument = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const documentId = req.params.documentId;

        const data = await Flashcard.getFlashcardsDocument(userId, documentId);

        res.status(200).json({
            success: true,
            message: "Flashcard for the document retrieved successfully.",
            data: data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the flashcards of the document due to: " + error);
        next(error);
    }
};

//GET get particular flashcards based on ID GET /api/flashcards/:flashcardId
export const getParticularFlashcard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const flashcardId = req.params.cardId;

        const data = await Flashcard.getParticularFlashcards(flashcardId, userId);

        if (!data) {
            return res.status(400).json({
                success: false,
                message: "No such particular flashcards was found.",
                statusCode: 400
            });
        }

        res.status(200).json({
            success: true,
            message: "The particular flashcard was retrieved successfully.",
            data: data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the particular flashcards due to: " + error);
        next(error);
    }
}

//GET get all flashcards list GET /api/flashcards/all-flashcard
export const getAllFlashcards = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await Flashcard.getAllFlashcards(userId);

        if (!data) {
            return res.status(404).json({
                sucess: false,
                error: "No falshcards set was found in the document.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully get all flashcards`,
            data: data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all sets of the flashcards due to: " + error);
        next(error);
    }
};

//POST review the flashcard daetails POST /api/flashcards/:cardId/review
export const reviewFlashcard = async (req, res, next) => {
    const cardId = req.params.cardId;
    try {
        const userId = req.user.id;

        const data = await Flashcard.reviewFlashcard(cardId, userId);

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Flashcard was not found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: "Flashcard review successfully!",
            statusCode: 200
        });

    } catch (error) {
        console.error(`Failed to review the flashcard with id: ${cardId} due to: ` + error);
        next(error);
    }
};

//PUT Toggle a star to the flashcard PUT /api/flashcards/:cardId/star 
export const toggleStarFlashcard = async (req, res, next) => {
    const cardId = req.params.cardId;
    try {
        const userId = req.user.id;

        const data = await Flashcard.getFlashCardItem(userId, cardId);

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Flashcard with card id: ${cardId} not found.`,
                statusCode: 404
            });
        }

        const newStarValue = !data[0].is_started;

        await Flashcard.toggleStarFlashcard(cardId, newStarValue);

        res.status(200).json({
            success: true,
            message: `Flashcard with id ${cardId} has ${newStarValue ? "started" : "not starred"}`,
            statusCode: 200
        });

    } catch (error) {
        console.error(`Fail to toggle a star on the falshcard item with card id: ${cardId} due to: ` + error);
        next(error);
    }
};

//DELETE delete the particular flashcards DELETE /api/flashcards/:id
export const deleteFlashcardsSet = async (req, res, next) => {
    const flashcardId = req.params.cardId;
    try {
        const userId = req.user.id;

        const result = await Flashcard.getParticularFlashcards(flashcardId, userId);

        if (result.length == 0) {
            return res.status(404).json({
                status: false,
                error: 'Flashcard set wad not found when try to delete.',
                statusCode: 404
            });
        }

        await Flashcard.deleteFlashcard(flashcardId);

        res.status(200).json({
            success: true,
            message: "Flashcard set was deleted successfully!",
            statusCode: 200
        });

    } catch (error) {
        console.error(`Fail to delete flashcard with card id: ${flashcardId} due to: ` + error);
        next(error);
    }
};
