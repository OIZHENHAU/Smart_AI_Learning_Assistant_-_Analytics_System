import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/GeminiService.js';
import { findRelevantChunks } from '../utils/TextChunker.js';


//Generate flashcards from the document POST /api/ai/generate-flashcards
export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentId, count = 10 } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        //Get document from MySQL
        const document = await Document.getParticularDocument(documentId);

        //Check if the document is valid
        if (!document || document.user_id !== req.user.id || document.status !== "ready") {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready.",
                statusCode: 404
            });
        } 

        //Generate falshcards using API
        const cards = await geminiService.generateFlashcards(document.extracted_text, parseInt(count));

        if (!cards || !Array.isArray(cards)) {
            return res.status(500).json({
                success: false,
                message: "AI did not return valid flashcards",
                statusCode: 500
            });
        }

        const flashcardId = await Flashcard.createFlashcards({
            userId: req.user.id,
            documentId: document.id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty || 'medium',
                reviewCount: 0,
                isStarted: false
            }))
        });

        res.status(201).json({
            success: true,
            data: {
                flashcardId
            },
            message: 'Flashcard generated successfully.',
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to generate flashcard from AI due to: " + error);
        next(error);
    }
}

//Generate quiz from document POST /api/ai/generate-quiz
export const generateQuiz = async (req, res, next) => {
    try {
        const {documentId, numOfQuestons = 10, title} = req.body;

        //Validate if document is ever exist
        if (!documentId) {
            return res.status(404).json({
                success: false,
                error: "Please provide a valid document ID.",
                statusCode: 404
            });
        }

        //Get document based on ID
        const document = await Document.getParticularDocument(documentId);

        if (!document || document.user_id !== req.user.id || document.status !== "ready") {
            return res.status(404).json({
                success: false,
                error: "Dopcuemnt does not exist or not ready yet.",
                statusCode: 404
            });
        }

        //Generate quiz using Gemini AI
        const questions = await geminiService.generateQuiz(document.extracted_text, parseInt(numOfQuestons));

        //Check if th quiz generated successfully or not
        if (!questions || !Array.isArray(questions)) {
            return res.status(500).json({
                success: false,
                error: "Gemini AI fail to generate quiz questions."
            });
        }

        //Create quiz and storre into the MySQL
        const quizId = await Quiz.createQuiz({
            userId: req.user.id,
            documentId: document.id,
            title: title || `Quiz - ${document.title}`,
            questions
        });

        //Response after successfully create quiz
        res.status(201).json({
            success: true,
            data: { quizId },
            messsage: "Quizes generated successfully!",
            statusCode: 201
        })

    } catch (error) {
        console.error("Fail to generate quizes by AI due to: " + error);
        next(error);
    }
}

//Generate summary from the document by AI POST /api/ai/generate-summary
export const generateSummary = async (req, res, next) => {
    try {


    } catch (error) {
        console.error("Fail to generate a summary from AI due to: " + error);
        next(error);
    }
}

//Ask AI for assistant through chat communication POST /api/ai/chat
export const chat = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to ask AI for assistant through chat due to: " + error);
        next(error);
    }
}

//Explain concept from document POST /api/ai/explain-concept
export const explainConcept = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to explain the concept from the document due to: " + error);
        next(error);
    }
}

//Get chat history for a document GET /api/ai/chat-history/:documentId
export const getChatHistory = async (req, res, next) => {
    try {

    } catch (error) {
        console.error("Fail to get the chat history based on a particular document due to: " + error);
        next(error);
    }
}

