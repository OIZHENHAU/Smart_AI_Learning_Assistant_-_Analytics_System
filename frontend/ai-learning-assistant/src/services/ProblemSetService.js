import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const request = async (call, action) => {
    try {
        const response = await call();
        return response.data;

    } catch (error) {
        console.error(`Fail to ${action} at the service due to: ` + error);
        throw error.response?.data || error;
    }
};

const getProblemSets = (classId, filters = {}) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SETS(classId), { params: filters }), "get the problem sets");

const createProblemSet = (classId, title) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SETS(classId), { title }), "create the problem set");

const getProblemSet = (classId, setId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_BY_ID(classId, setId)), "get the problem set");

const updateTitle = (classId, setId, title) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_BY_ID(classId, setId), { title }), "update the title");

const deleteProblemSet = (classId, setId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_BY_ID(classId, setId)), "delete the problem set");

const publishProblemSet = (classId, setId) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_PUBLISH(classId, setId)), "publish the problem set");

const addQuestion = (classId, setId, type = 'mcq') =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTIONS(classId, setId), { type }), "add the question");

const updateQuestion = (classId, setId, questionId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_QUESTION_BY_ID(classId, setId, questionId), payload), "save the question");

const deleteQuestion = (classId, setId, questionId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_BY_ID(classId, setId, questionId)), "delete the question");

const createAchievementDraft = (classId, setId) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_ACHIEVEMENT(classId, setId)), "start the achievement");

const saveAchievement = (classId, setId, formData) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_ACHIEVEMENT(classId, setId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }), "save the achievement");

const removeAchievement = (classId, setId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_ACHIEVEMENT(classId, setId)), "remove the achievement");

const uploadQuestionImage = (classId, setId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_IMAGE(classId, setId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }), "upload the question image");
};

const uploadQuestionFile = (classId, setId, questionId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTION_FILES(classId, setId, questionId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000
    }), "upload the question file");
};

const deleteQuestionFile = (classId, setId, questionId, fileId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_FILE_BY_ID(classId, setId, questionId, fileId)), "remove the question file");

const getQuestionComments = (classId, setId, questionId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENTS(classId, setId, questionId)), "get the comments");

const createQuestionComment = (classId, setId, questionId, payload) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENTS(classId, setId, questionId), payload), "post the comment");

const updateQuestionComment = (classId, setId, questionId, commentId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENT_BY_ID(classId, setId, questionId, commentId), payload), "update the comment");

const deleteQuestionComment = (classId, setId, questionId, commentId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENT_BY_ID(classId, setId, questionId, commentId)), "delete the comment");

const getAttemptView = (classId, setId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT(classId, setId)), "get the problem set to attempt");

const buildAttemptForm = (answers, files, keepFileIds) => {
    const formData = new FormData();
    formData.append('answers', JSON.stringify(answers));
    formData.append('keepFileIds', JSON.stringify(keepFileIds));
    Object.entries(files).forEach(([questionId, list]) => {
        list.forEach((file) => formData.append(`file_${questionId}`, file));
    });
    return formData;
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 5 * 60 * 1000 };

const submitAttempt = (classId, setId, answers, files = {}, keepFileIds = []) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT(classId, setId),
        buildAttemptForm(answers, files, keepFileIds), MULTIPART), "submit the attempt");

const saveAttemptDraft = (classId, setId, answers, files = {}, keepFileIds = []) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT_DRAFT(classId, setId),
        buildAttemptForm(answers, files, keepFileIds), MULTIPART), "save the attempt");

const getAttemptResult = (classId, setId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT_RESULT(classId, setId)), "get the attempt result");

//The student's earned achievements in a class; unseen = only the ones the popup hasn't shown yet.
const getMyAchievements = (classId, unseen = false) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.MY_ACHIEVEMENTS(classId), { params: unseen ? { unseen: true } : {} }), "get the achievements");

const markAchievementSeen = (classId, setId) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.MY_ACHIEVEMENT_SEEN(classId, setId)), "mark the achievement as seen");

const problemSetService = {
    getProblemSets, createProblemSet, getProblemSet, updateTitle, deleteProblemSet, publishProblemSet,
    addQuestion, updateQuestion, deleteQuestion,
    createAchievementDraft, saveAchievement, removeAchievement, uploadQuestionImage,
    uploadQuestionFile, deleteQuestionFile,
    getQuestionComments, createQuestionComment, updateQuestionComment, deleteQuestionComment,
    getAttemptView, submitAttempt, getAttemptResult, saveAttemptDraft,
    getMyAchievements, markAchievementSeen
};

export default problemSetService;
