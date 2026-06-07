import db from '../config/MySQL.js';

import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/GeminiService.js';
import { chunkText, findRelevantChunks } from '../utils/TextChunker.js';


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
        const cards = await geminiService.generateFlashcards(document.extracted_text, parseInt(count), document.language || 'en');

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
        const {documentId, numOfQuestions = 10, title} = req.body;

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
        const questions = await geminiService.generateQuiz(document.extracted_text, parseInt(numOfQuestions), document.langugae || 'en');

        //Check if th quiz generated successfully or not
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            console.error("Quiz generation failed: AI returned 0 questions.");
            return res.status(500).json({
                success: false,
                error: "AI failed to generate quiz questions. The response format may not have matched. Please try again."
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
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Document not found when generate summary, please provide a correct document ID.",
                statusCode: 400
            });
        }

        const document = await Document.getParticularDocument(documentId);

        if (!document || document.user_id !== req.user.id || document.status !== "ready") {
            return res.status(404).json({
                success: false,
                error: "Docuemnt is not found or not ready when try to generate summary.",
                statusCode: 404
            });
        }

        const summary = await geminiService.generateSummary(document.extracted_text, document.language || 'en');

        res.status(200).json({
            success: true,
            data: {
                documentId: document.id,
                title: document.title,
                summary: summary
            },
            message: "Summary was generated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to generate a summary from AI due to: " + error);
        next(error);
    }
}

//Ask Gemini AI for assistant through chat communication POST /api/ai/chat
export const geminiAIChat = async (req, res, next) => {
    try {
        const { documentId, question } = req.body;

        if (!documentId || !question) {
            return res.status(404).json({
                success: false,
                error: "Invalid document ID or questions during chat, please provide a valid document ID or questions.",
                statusCode: 404
            });
        }

        const document = await Document.getParticularDocument(documentId);

        if (!document || document.user_id !== req.user.id || document.status !== "ready") {
            return res.status(404).json({
                success: false,
                error: "Document not found or not ready what chatting with AI Assistant.",
                statusCode: 404
            });
        }

        const currentChunk = chunkText(document.extracted_text);
        //console.log("The current chunk is: " + currentChunk);

        const relevantChunks = findRelevantChunks(currentChunk, question, 3);

        const chunkIndices = relevantChunks.map(c => c.chunkIndex).filter(x => x !== undefined);

        const language = req.body.language || document.language || 'en';
        const answer = await geminiService.chatWithContext(question, relevantChunks, language);

        const chatId = await ChatHistory.createChatHistory({
            userId: req.user.id,
            documentId: document.id,
            messages: [
                { role: 'user', content: question }, { role: 'assistant', content: answer }
            ],
            relevantChunks: chunkIndices
        });

        res.status(200).json({
            success: true,
            data: {
                question,
                answer,
                relevantChunks: chunkIndices,
                chatHistoryId: chatId
            },
            message: "Gemini AI generated response successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to ask AI for assistant through chat due to: " + error);
        next(error);
    }
}

//Explain concept from document POST /api/ai/explain-concept
export const explainConcept = async (req, res, next) => {
    try {
        const { documentId, concept } = req.body;

        if (!documentId || !concept) {
            return res.status(400).json({
                success: false,
                error: "Invalid document ID and concept dutring explanation. Please provide a valid document ID or concept.",
                statusCode: 400
            });
        }

        const document = await Document.getParticularDocument(documentId);

        if (!document || document.user_id !== req.user.id || document.status !== "ready") {
            return res.status(404).json({
                success: false,
                error: "Document is not found or not ready yet during explanation."
            })
        }

        const chunks = await Document.getDocumentChunks(documentId);

        if (!chunks || chunks.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No text chunk was found for this document during explanation.",
                statusCode: 404
            });
        }

        const relevantChunks = findRelevantChunks(chunks, concept, 3);

        const context = relevantChunks.map(c => c.content).join('\n\n');

        const explanation = await geminiService.explainConcept(concept, context, document.language || 'en');

        res.status(200).json({
            success: true,
            data: {
                concept: concept,
                explanation: explanation,
                relevantChunks: relevantChunks.map(c => c.chunkIndex)
            },
            message: "Explanation of concept was successfully.",
            ststusCode: 200
        });

    } catch (error) {
        console.error("Fail to explain the concept from the document due to: " + error);
        next(error);
    }
}

//Get chat history for a document GET /api/ai/chat-history/:documentId
export const getChatHistory = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        //Check is the document exist based on the ID
        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "The document is not exist when get chat history, please provide a valid ID.",
                statusCode: 400
            });
        }

        //Find chat history
        const [chatRows] = await db.execute(
            `
            SELECT id
            FROM chat_histories
            WHERE user_id = ? AND document_id = ?
            ORDER BY created_at ASC
            `,
            [req.user.id, documentId]
        );

        if (chatRows.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No chat history found for this document."
            });
        }

        //Get all chat histories
        const allChatHistories = [];

        //Get all message based on the documentId
        for (const row of chatRows) {
            const chat = await ChatHistory.getChatHistory(row.id);

            if (chat) {
                allChatHistories.push(chat);
            }
        }

        res.status(200).json({
            success: true,
            data: allChatHistories,
            message: "Chat history retrieved successfully."
        });

    } catch (error) {
        console.error("Fail to get the chat history based on a particular document due to: " + error);
        next(error);
    }
}

