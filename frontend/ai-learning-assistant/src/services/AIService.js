import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';

const generateQuiz = async (documentId, options) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, {documentId, ...options});

        return response.data;

    } catch (error) {
        console.error("Fail to generate the quiz at the frontend due to: " + error);
        throw error;
    }
};

const generateSummary = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_SUMMARY, {documentId});

        return response.data;

    } catch (error) {
        console.error("Fail to generate the summry at the frontend dut to: " + error);
        throw error;
    }
};

const aiChat = async (documentId, mesaage) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.AI_CHAT, { documentId, question: message });
        return response.data;

    } catch (error) {
        console.error("Fail to chat with AI assistant at the frontend due to: " + error);
        throw error;
    }
};

const explainConcept = async (documentId, concept) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.EXPLAIN_CONCEPT, { documentId, concept });
        return response.data?.data;

    } catch (error) {
        console.error("Fail to ask AI to explain the concept at the frontend due to: " + error);
        throw error;
    }
};

const getChatHistory = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.AI.GET_CHAT_HISTORY(documentId));
        return response.data;

    } catch (error) {
        console.error("fail to get the chat hisotry at the frontend due to: " + error);
        throw error;
    }
}

const aiService = {
    generateQuiz, generateSummary, explainConcept, aiChat, getChatHistory
};


export default aiService;