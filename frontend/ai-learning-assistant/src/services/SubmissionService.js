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

//filters = { assessment, name, startDate, endDate }
const getSubmissions = (classId, filters = {}) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.SUBMISSIONS(classId), { params: filters }), "get the submissions");

const getSubmission = (classId, attemptId) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.SUBMISSION_BY_ID(classId, attemptId)), "get the submission");

//payload = { marks: [{ questionId, points }], comments: [{ questionId, content }] }
const gradeSubmission = (classId, attemptId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.SUBMISSION_GRADE(classId, attemptId), payload), "save the marks");

//Same payload as gradeSubmission; marks may be left empty. Returns the saved draft.
const saveGradingDraft = (classId, attemptId, payload) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.SUBMISSION_DRAFT(classId, attemptId), payload), "save the draft");

const submissionService = { getSubmissions, getSubmission, gradeSubmission, saveGradingDraft };

export default submissionService;
