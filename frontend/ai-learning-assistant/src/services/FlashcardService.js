import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getFlashcardDocument = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.FLASHCARD.GET_FLASHCARD_BY_DOCUMENT(id));
        return response.data;

    } catch (error) {
        console.error("Fail to get the flashcard document at the service due to: " + error);
        throw error;
    }
};

const getAllFlashcards = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.FLASHCARD.GET_ALL_FLASHCARD);
        return response.data;

    } catch (error) {
        console.error("Fail to get all flashcards at the service due to: " + error);
        throw error;
    }
};

const reviewFlashcard = async (cardId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.FLASHCARD.REVIEW_FLASHCARD(cardId));
        return response.data;

    } catch (error) {
        console.error("Fail to review the flashcard at the service due to: " + error);
        throw error;
    }
};

const toggleStarOnFlashcard = async (cardId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.FLASHCARD.TOGGLE_STAR_ON_FLASHCARD(cardId));
        return response.data;

    } catch (error) {
        console.error("Fail to toggle a star at the flashcard at the service due to: " + error);
        throw error;
    }
};

const deleteFlashcard = async (flashcardId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.FLASHCARD.DELETE_FLASHCARD(flashcardId));
        return response.data;

    } catch (error) {
        console.error("Fail to delete the flashcard at the service due to: " + error);
        throw error;
    }
};

const flashcardService = {
    getFlashcardDocument,
    getAllFlashcards,
    reviewFlashcard,
    toggleStarOnFlashcard,
    deleteFlashcard,
};

export default flashcardService;