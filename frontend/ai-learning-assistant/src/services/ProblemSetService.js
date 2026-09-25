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

const getProblemSets = (classId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.PROBLEM_SETS(classId)), "get the problem sets");

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

const addQuestion = (classId, setId) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.PROBLEM_SET_QUESTIONS(classId, setId)), "add the question");

//payload = { title, description, points, options: [{ text, isCorrect }] }
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

const problemSetService = {
    getProblemSets, createProblemSet, getProblemSet, updateTitle, deleteProblemSet, publishProblemSet,
    addQuestion, updateQuestion, deleteQuestion,
    createAchievementDraft, saveAchievement, removeAchievement, uploadQuestionImage
};

export default problemSetService;
