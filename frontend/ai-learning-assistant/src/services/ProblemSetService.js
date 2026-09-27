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

//type = 'mcq' (default) | 'fill_blank' | 'open_ended'
const addQuestion = (classId, setId, type = 'mcq') =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTIONS(classId, setId), { type }), "add the question");

//payload = { type, title, description, points, options: [{ text, isCorrect }] }
const updateQuestion = (classId, setId, questionId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_QUESTION_BY_ID(classId, setId, questionId), payload), "save the question");

const deleteQuestion = (classId, setId, questionId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_BY_ID(classId, setId, questionId)), "delete the question");

//Creates the blank achievement row the moment the toggle is switched on.
const createAchievementDraft = (classId, setId) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_ACHIEVEMENT(classId, setId)), "start the achievement");

//formData: badgeImage (File, optional), title, description, minPoints, expiryDate. Nothing here needs to be complete.
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

//Attaches a file (PDF, .ipynb or ZIP, up to 50MB) to an open-ended question straight away.
const uploadQuestionFile = (classId, setId, questionId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTION_FILES(classId, setId, questionId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000 //up to 50MB, so don't let the default timeout cut it off
    }), "upload the question file");
};

const deleteQuestionFile = (classId, setId, questionId, fileId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_FILE_BY_ID(classId, setId, questionId, fileId)), "remove the question file");

//Private lecturer–student conversation on one question. The server only returns what the caller may see.
const getQuestionComments = (classId, setId, questionId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENTS(classId, setId, questionId)), "get the comments");

//payload = { content, parentId? }
const createQuestionComment = (classId, setId, questionId, payload) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENTS(classId, setId, questionId), payload), "post the comment");

const updateQuestionComment = (classId, setId, questionId, commentId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENT_BY_ID(classId, setId, questionId, commentId), payload), "update the comment");

const deleteQuestionComment = (classId, setId, questionId, commentId) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.PROBLEM_SET_QUESTION_COMMENT_BY_ID(classId, setId, questionId, commentId)), "delete the comment");

const getAttemptView = (classId, setId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT(classId, setId)), "get the problem set to attempt");

//answers = [{ questionId, optionId?, blanks?, text? }]
//files = { [questionId]: File[] } for open-ended answers; everything goes up together in one request.
const submitAttempt = (classId, setId, answers, files = {}) => {
    const formData = new FormData();
    formData.append('answers', JSON.stringify(answers));
    Object.entries(files).forEach(([questionId, list]) => {
        list.forEach((file) => formData.append(`file_${questionId}`, file));
    });

    return request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT(classId, setId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000 //may carry several large files
    }), "submit the attempt");
};

const getAttemptResult = (classId, setId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SET_ATTEMPT_RESULT(classId, setId)), "get the attempt result");

const problemSetService = {
    getProblemSets, createProblemSet, getProblemSet, updateTitle, deleteProblemSet, publishProblemSet,
    addQuestion, updateQuestion, deleteQuestion,
    createAchievementDraft, saveAchievement, removeAchievement, uploadQuestionImage,
    uploadQuestionFile, deleteQuestionFile,
    getQuestionComments, createQuestionComment, updateQuestionComment, deleteQuestionComment,
    getAttemptView, submitAttempt, getAttemptResult
};

export default problemSetService;
