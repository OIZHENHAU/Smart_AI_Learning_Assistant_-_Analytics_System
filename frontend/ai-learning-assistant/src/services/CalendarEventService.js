import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPath";

const getAllEvents = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.CALENDAR_EVENTS.GET_ALL_EVENTS);
        return response.data;

    } catch (error) {
        console.error("Fail to get all the calendar events at the service due to: " + error);
        throw error;
    }
};

const getEventById = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.CALENDAR_EVENTS.GET_EVENT_BY_ID(id));
        return response.data;

    } catch (error) {
        console.error("Fail to get the calendar event by ID at the service due to: " + error);
        throw error;
    }
};

const createEvent = async (event) => {
    try {
        const response = await axiosInstance.post(API_PATHS.CALENDAR_EVENTS.CREATE_EVENT, event);
        return response.data;

    } catch (error) {
        console.error("Fail to create the calendar event at the service due to: " + error);
        throw error;
    }
};

const updateEvent = async (id, event) => {
    try {
        const response = await axiosInstance.put(API_PATHS.CALENDAR_EVENTS.UPDATE_EVENT(id), event);
        return response.data;

    } catch (error) {
        console.error("Fail to update the calendar event at the service due to: " + error);
        throw error;
    }
};

const deleteEvent = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.CALENDAR_EVENTS.DELETE_EVENT(id));
        return response.data;

    } catch (error) {
        console.error("Fail to delete the calendar event at the service due to: " + error);
        throw error;
    }
};

const setReminder = async (id) => {
    try {
        const response = await axiosInstance.post(API_PATHS.CALENDAR_EVENTS.SET_REMINDER(id));
        return response.data;

    } catch (error) {
        console.error("Fail to set the SMS reminder at the service due to: " + error);
        throw error;
    }
}

const cancelReminder = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.CALENDAR_EVENTS.CANCEL_REMINDER(id));
        return response.data;

    } catch (error) {
        console.error("Fail to cancel the SMS reminder at the service due to: " + error);
        throw error;
    }
};

const calendarEventService = {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    setReminder,
    cancelReminder
};

export default calendarEventService;
