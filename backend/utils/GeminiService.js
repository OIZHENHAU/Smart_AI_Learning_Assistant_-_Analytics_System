import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY was not declared in the environment variables.');
    process.exit(1);
}

/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
    const promptQuestion = `Generate exactly ${count} educational flashcards from the following text.
    Format each flashcards as:
    Q: [Clear, specific questions]
    A: [Concise, accurate answer]
    D: [Difficulty level: easy, medium or hard]
    
    Seperate each flashcards with "---"
    
    Text:
    ${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: promptQuestion,
        });

        const generateText = response.text;

        //Parse the response
        const flashcards = [];
        const cards = generateText.split('---').filter(x => x.trim());

        for (const card of cards) {
            const lines = card.trim().split('\n');
            let question = ''; 
            let answer = '';
            let difficulty = 'medium';

            for (const line of lines) {
                if (line.startsWith('Q:')) {
                    question = line.substring(2).trim();

                } else if (line.startsWith('A:')) {
                    answer = line.substring(2).trim();

                } else if (line.startsWith('D:')) {
                    const diff = line.substring(2).trim().toLowerCase();

                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }

            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }

        return flashcards.slice(0, count);

    } catch (error) {
        console.error("Fail to generate flashcards by AI due to: " + error);

    }
};

/**
 * Generate quiz questions
 * @param {string} text - Docuemnt text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 10) => {
    const promptQuestion = `Generate exactly ${numQuestions} multiple choice questions from the following text.
    Format each queston as:
    Q: [Question]
    Q1: [Option 1]
    Q2: [option 2]
    Q3: [Option 3]
    Q4: [Option 4]
    C: [Correct option - exactly as written above]
    E: [Brief explanation]
    D: [Difficulty: easy, medium, or hard]
    
    Seperate questions with "---"
    
    Text:
    ${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: promptQuestion,
        });

        const generateText = response.text;

        if (!generateText) {
            return [];
        }

        const questions = [];
        const questionBlocks = generateText.split('---').filter(x => x.trim());

        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');
            let question, explanation, correctAnswer = "";
            let options = [];
            let difficulty = "medium";

            for (const line of lines) {
                const line_trim = line.trim();

                if (line_trim.startsWith('Q:')) {
                    question = line_trim.substring(2).trim();

                } else if (line_trim.match(/^Q\d:/)) {
                    options.push(line_trim.substring(3).trim());

                } else if (line_trim.startsWith('C:')) {
                    correctAnswer = line_trim.substring(2).trim();

                } else if (line_trim.startsWith('E:')) {
                    explanation = line_trim.substring(2).trim();

                } else if (line_trim.startsWith('D:')) {
                    const diff = line_trim.substring(2).trim().toLowerCase();

                    if (["easy", "medium", "hard"].includes(diff)) {
                        difficulty = diff;
                    }

                } else if (line_trim.match(/^Q\d:/) || line_trim.match(/^\d+\./) ||
                        line_trim.match(/^[A-D]\)/) || line_trim.toLowerCase().startsWith('option')) {
                            const optionText = line_trim.replace(/^Q\d:/, '').replace(/^\d+\./, '')
                                                        .replace(/^[A-D]\)/, '')
                                                        .replace(/option\s*\d*:/i, '')
                                                        .trim();

                    options.push(optionText);
                }
            }

            if (question && options.length >= 2 && correctAnswer) {
                questions.push({ question, options, correctAnswer, explanation, difficulty});

            }

        }

        return questions;

    } catch (error) {
        console.error("Fail to generate quiz by AI due to: " + error);
    }
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>} - Return a generated text summary from Gemini AI
 */
export const generateSummary = async (text) => {
    const promptQuestion = `Provide a brief summary of the following text, 
    highlighting the key concept, main ideas, and important points. Please keep the summary clear and well structured.

    Text:
    ${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: promptQuestion,
        });

        const generateText = response.text;

        return generateText;

    } catch (error) {
        console.error("Fail to create a clear summary from AI due to: " + error);
    }
};

/**
 * Chat with Gemini AI about the document context
 * @param {string} question - Question ask from the user
 * @param {Array<Object>} chunks - Relevanrt document chunks
 * @return {Promise<string>} - 
 */
export const chatWithContext = async (question, chunks) => {
    const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

    const promptQuestion = `Based on the following context from a document, analyse the context and answer the user's question.
    If the answer is not in the context, say so.
    
    Context:
    ${context}
    
    Question: 
    ${question}
    
    Answer:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: promptQuestion
        });

        const generateText = response.text;
        return generateText;

    } catch (error) {
        console.error("Fail to chat with the document context due to " + error);
    }
}

/**
 * Explain the specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant concept
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
    const promptQuestion = `Explain the concept of ${concept} based on the following context.
    Provide a clear, educational explanation that's easy to make user understand. Include examples if relevant.
    
    Context: ${context.substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: promptQuestion
        });

        const generateText = response.text;
        return generateText;

    } catch (error) {
        console.error("Faul to explain the specific concept due to: " + error);
    }
}