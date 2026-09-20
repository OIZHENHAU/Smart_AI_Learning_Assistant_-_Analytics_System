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

const getAnnouncements = (classId, filters = {}) =>
    request(() => axiosInstance.get(API_PATHS.CLASS.ANNOUNCEMENTS(classId), { params: filters }), "get the announcements");

const createAnnouncement = (classId, title, content) =>
    request(() => axiosInstance.post(API_PATHS.CLASS.ANNOUNCEMENTS(classId), { title, content }), "create the announcement");

const updateAnnouncement = (classId, id, title, content) =>
    request(() => axiosInstance.put(API_PATHS.CLASS.ANNOUNCEMENT_BY_ID(classId, id), { title, content }), "update the announcement");

const deleteAnnouncement = (classId, id) =>
    request(() => axiosInstance.delete(API_PATHS.CLASS.ANNOUNCEMENT_BY_ID(classId, id)), "delete the announcement");

const uploadImage = (classId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request(() => axiosInstance.post(API_PATHS.CLASS.ANNOUNCEMENT_IMAGE(classId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }), "upload the announcement image");
};

const announcementService = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadImage };

export default announcementService;
