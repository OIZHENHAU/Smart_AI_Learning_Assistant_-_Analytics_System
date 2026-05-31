export const BASE_URL = 'http://localhost:5528';

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/profile",
        UPDATE_PROFILE: "/api/auth/profile",
        CHANGE_PASSWORD: "/api/auth/change-password"
    },
    DOCUMENT: {
        UPLOAD: "/api/documents/upload",
        GET_ALL_DOCUMENT: "/api/documents/all-document",
        GET_DOCUMENT_BY_ID: (id) => `/api/documents/${id}`,
        DELETE_DOCUMENT: (id) => `/api/documents/${id}`
    },
    AI: {
        GENERATE_QUIZ: "/api/ai/generate-quiz",
        GENERATE_SUMMARY: "/api/ai/generate-summary",
        AI_CHAT: "/api/ai/ai-chat",
        EXPLAIN_CONCEPT: "/api/ai/explain-concept",
        GET_CHAT_HISTORY: (documentId) => `/api/ai/chat-history/${documentId}`
    },
    QUIZZES: {
        GET_QUIZZES_FOR_DOCUMENT: (documentId) => `/api/quizzes/${documentId}`,
        GET_QUIZ_BY_ID: (id) => `/api/quizzes/quiz/${id}`,
        SUBMIT_QUIZ: (id) => `/api/quizzes/${id}/submit`,
        GET_QUIZ_RESULT: (id) => `/api/quizzes/${id}/results`,
        DELETE_QUIZ: (id) => `/api/quizzes/${id}`
    },
    PROGRESS: {
        GET_DASHBOARD: "/api/progress/dashboard",
        GET_START_SESSION: "/api/progress/session/start",
        GET_END_SESSION: (sessionId) => `/api/progress/session/${sessionId}/end`
    }
}