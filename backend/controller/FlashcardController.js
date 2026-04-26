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

export const reviewFlashcard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const cardId = req.params.cardId;

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

export const toggleStarFlashcard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const cardId = req.params.cardId;

        const data = await Flashcard.getFlashCardItem(userId, cardId);

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Flashcard with card id: ${crardId} not found.`,
                statusCode: 404
            });
        }

        const newStarValue = !rows[0].is_started;

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

export const deleteFlashcardsSet = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const flashcardId = req.params.cardId;

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
