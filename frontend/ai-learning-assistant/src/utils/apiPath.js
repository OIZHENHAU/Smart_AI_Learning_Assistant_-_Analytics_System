export const BASE_URL = 'http://localhost:5528';

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/profile",
        UPDATE_PROFILE: "/api/auth/profile",
        CHANGE_PASSWORD: "/api/auth/change-password",
        DELETE_ACCOUNT: "/api/auth/delete-account",
        ADMIN_GET_USERS: "/api/auth/admin/users",
        ADMIN_APPROVE_USER: (id) => `/api/auth/admin/users/${id}/approve`,
        ADMIN_DEACTIVATE_USER: (id) => `/api/auth/admin/users/${id}/deactivate`,
        ADMIN_DELETE_USER: (id) => `/api/auth/admin/users/${id}`
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
        GET_CHAT_HISTORY: (documentId) => `/api/ai/chat-history/${documentId}`,
        GENERATE_FLASHCARD: "/api/ai/generate-flashcard",
        GENERATE_FILL_IN_BLANK: "/api/ai/generate-fill-in-blank"
    },
    FILL_IN_BLANK: {
        GET_SETS_FOR_DOCUMENT: (documentId) => `/api/fill-in-blank/${documentId}`,
        GET_ALL_SETS: "/api/fill-in-blank/all-sets",
        GET_SET_BY_ID: (id) => `/api/fill-in-blank/set/${id}`,
        SUBMIT_SET: (id) => `/api/fill-in-blank/${id}/submit`,
        GET_SET_RESULT: (id) => `/api/fill-in-blank/${id}/results`,
        DELETE_SET: (id) => `/api/fill-in-blank/${id}`,
        GET_SET_HINT: (setId, questionId) => `/api/fill-in-blank/${setId}/hint/${questionId}`,
        SET_SET_HINT: (setId, questionId) => `/api/fill-in-blank/${setId}/set-hint/${questionId}`,
        GET_SET_SHIELD: (setId, questionId) => `/api/fill-in-blank/${setId}/shield/${questionId}`,
        SET_SET_SHIELD: (setId, questionId) => `/api/fill-in-blank/${setId}/set-shield/${questionId}`
    },
    QUIZZES: {
        GET_QUIZZES_FOR_DOCUMENT: (documentId) => `/api/quizzes/${documentId}`,
        GET_ALL_QUIZZES: "/api/quizzes/all-quizzes",
        GET_QUIZ_BY_ID: (id) => `/api/quizzes/quiz/${id}`,
        SUBMIT_QUIZ: (id) => `/api/quizzes/${id}/submit`,
        GET_QUIZ_RESULT: (id) => `/api/quizzes/${id}/results`,
        DELETE_QUIZ: (id) => `/api/quizzes/${id}`,
        GET_QUIZ_HINT: (quizId, questionId) => `/api/quizzes/${quizId}/hint/${questionId}`,
        SET_QUIZ_HINT: (quizId, questionId) => `/api/quizzes/${quizId}/set-hint/${questionId}`,
        GET_QUIZ_SHIELD: (quizId, questionId) => `/api/quizzes/${quizId}/shield/${questionId}`,
        SET_QUIZ_SHIELD: (quizId, questionId) => `/api/quizzes/${quizId}/set-shield/${questionId}`
    },
    PROGRESS: {
        GET_DASHBOARD: "/api/progress/dashboard",
        GET_TOPIC_ANALYSIS: "/api/progress/topic-analysis",
        GET_START_SESSION: "/api/progress/session/start",
        GET_END_SESSION: (sessionId) => `/api/progress/session/${sessionId}/end`
    },
    DASHBOARD: {
        GET_MAIN_DASHBOARD: "/api/dashboard/main-dashboard"
    },
    ACHIEVEMENT: {
        GET_ACHIEVEMENT_STATISTICS: "/api/achievements/achievement-page",
        GET_ALL_BADGES: "/api/achievements/all-badges",
        GET_ALL_UNLOCK_FEATURES: "/api/achievements/all-unlock-features",
        GET_ALL_USER_XP: "/api/achievements/all-user-xp",
        GET_ALL_DAILY_GOALS: "/api/achievements/all-daily-goals",
        GET_CURRENT_LEVEL_AND_XP: "/api/achievements/current-level-and-xp",
        POST_ALL_DAILY_GOALS: "/api/achievements/daily-goals",
        POST_ALL_BADGES: "/api/achievements/create-badges",
        POST_ALL_UNLOCK_FEATURES: "/api/achievements/create-unlock-features",
        REDEEM_UNLOCK_FEATURE: (id) => `/api/achievements/redeem-unlock-feature/${id}`,
        GET_HINT_FEATURE: "/api/achievements/get-hint-feature",
        GET_FREEZE_FEATURE: "/api/achievements/get-freeze-feature",
        GET_SHIELD_FEATURE: "/api/achievements/get-shield-feature",
        USE_FREEZE_FEATURE: "/api/achievements/use-freeze-feature",
        GET_LEADERBOARD_BY_LEVEL: "/api/achievements/leaderboard-level",
        GET_LEADERBOARD_BY_ACHIEVEMENTS: "/api/achievements/leaderboard-achievements",
        UPDATE_DAILY_GOALS_PROGRESS: "/api/achievements/update-daily-goals"
    },
    CALENDAR_EVENTS: {
        GET_ALL_EVENTS: "/api/calendar-events",
        CREATE_EVENT: "/api/calendar-events",
        GET_EVENT_BY_ID: (id) => `/api/calendar-events/get/${id}`,
        UPDATE_EVENT: (id) => `/api/calendar-events/update/${id}`,
        DELETE_EVENT: (id) => `/api/calendar-events/delete/${id}`,
        SET_REMINDER: (id) => `/api/calendar-events/${id}/remind`,
        CANCEL_REMINDER: (id) => `/api/calendar-events/${id}/remind`
    },
    CLASS: {
        GET_ALL_CLASSES: "/api/classes",
        CREATE_CLASS: "/api/classes",
        GET_CLASS_BY_ID: (id) => `/api/classes/${id}`,
        GET_CLASS_WORKSPACE: (id) => `/api/classes/${id}/workspace`,
        FIND_CLASS_BY_CODE: (code) => `/api/classes/code/${encodeURIComponent(code)}`,
        UPDATE_CLASS: (id) => `/api/classes/${id}`,
        DELETE_CLASS: (id) => `/api/classes/${id}`,
        JOIN_CLASS: (id) => `/api/classes/${id}/join`,
        ANNOUNCEMENTS: (classId) => `/api/classes/${classId}/announcements`,
        ANNOUNCEMENT_BY_ID: (classId, id) => `/api/classes/${classId}/announcements/${id}`,
        ANNOUNCEMENT_IMAGE: (classId) => `/api/classes/${classId}/announcements/images`
    },
    FLASHCARD: {
        GET_ALL_FLASHCARD: "/api/flashcards/all-flashcard",
        GET_FLASHCARD_BY_DOCUMENT: (documentId) => `/api/flashcards/${documentId}`,
        REVIEW_FLASHCARD: (cardId) => `/api/flashcards/${cardId}/review`,
        TOGGLE_STAR_ON_FLASHCARD: (cardId) => `/api/flashcards/${cardId}/star`,
        DELETE_FLASHCARD: (flashcardId) => `/api/flashcards/${flashcardId}`
    }
}