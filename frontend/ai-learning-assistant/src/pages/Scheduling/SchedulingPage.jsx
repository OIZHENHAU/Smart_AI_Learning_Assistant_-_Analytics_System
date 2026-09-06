import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import toast from 'react-hot-toast';
import moment from 'moment';
import { CalendarClockIcon, Plus, Trash2 } from 'lucide-react';
import calendarEventService from '../../services/CalendarEventService';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';

const COLOR_OPTIONS = [
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
];

const EMPTY_FORM = {
    id: null,
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    color: COLOR_OPTIONS[0].value
};

// Format a Date/ISO string into the "YYYY-MM-DDTHH:mm" shape <input type="datetime-local"> expects
const toDatetimeLocal = (value) => moment(value).format('YYYY-MM-DDTHH:mm');

const SchedulingPage = () => {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchEvents = async () => {
        try {
            const response = await calendarEventService.getAllEvents();
            const rawEvents = Array.isArray(response?.data) ? response.data : [];

            setEvents(rawEvents.map((e) => ({
                id: e.id,
                title: e.title,
                start: e.start_time,
                end: e.end_time,
                backgroundColor: e.color,
                borderColor: e.color,
                extendedProps: { description: e.description }
            })));

        } catch (error) {
            toast.error("Failed to load your schedule.");
            console.error(error);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const openCreateModal = (start, end) => {
        setForm({
            ...EMPTY_FORM,
            startTime: start ? toDatetimeLocal(start) : toDatetimeLocal(new Date()),
            endTime: end ? toDatetimeLocal(end) : toDatetimeLocal(moment().add(1, 'hour'))
        });
        setIsModalOpen(true);
    };

    const openEditModal = (event) => {
        setForm({
            id: event.id,
            title: event.title,
            description: event.extendedProps?.description || '',
            startTime: toDatetimeLocal(event.start),
            endTime: toDatetimeLocal(event.end || event.start),
            color: event.backgroundColor || COLOR_OPTIONS[0].value
        });
        setIsModalOpen(true);
    };

    //Handle clicking/dragging an empty slot on the calendar to create an event there
    const handleDateSelect = (selectInfo) => {
        openCreateModal(selectInfo.start, selectInfo.end);
        calendarRef.current?.getApi().unselect();
    };

    //Handle clicking an existing event to edit it
    const handleEventClick = (clickInfo) => {
        openEditModal(clickInfo.event);
    };

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();

        if (!form.title || !form.startTime || !form.endTime) {
            toast.error("Please fill in the title, start time and end time.");
            return;
        }

        if (moment(form.endTime).isSameOrBefore(form.startTime)) {
            toast.error("End time must be after the start time.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: form.title,
                description: form.description,
                startTime: moment(form.startTime).format('YYYY-MM-DD HH:mm:ss'),
                endTime: moment(form.endTime).format('YYYY-MM-DD HH:mm:ss'),
                color: form.color
            };

            if (form.id) {
                await calendarEventService.updateEvent(form.id, payload);
                toast.success("Event updated successfully.");

            } else {
                await calendarEventService.createEvent(payload);
                toast.success("Event created successfully.");
            }

            setIsModalOpen(false);
            fetchEvents();

        } catch (error) {
            toast.error("Failed to save the event.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!form.id) return;
        setSaving(true);

        try {
            await calendarEventService.deleteEvent(form.id);
            toast.success("Event deleted successfully.");
            setIsModalOpen(false);
            fetchEvents();

        } catch (error) {
            toast.error("Failed to delete the event.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    //Handle dragging an event to a new time, or resizing its duration
    const handleEventChange = async (changeInfo) => {
        const { event } = changeInfo;

        try {
            await calendarEventService.updateEvent(event.id, {
                title: event.title,
                description: event.extendedProps?.description || '',
                startTime: moment(event.start).format('YYYY-MM-DD HH:mm:ss'),
                endTime: moment(event.end || event.start).format('YYYY-MM-DD HH:mm:ss'),
                color: event.backgroundColor
            });
            toast.success("Event rescheduled.");

        } catch (error) {
            toast.error("Failed to reschedule the event.");
            console.error(error);
            changeInfo.revert();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                        <CalendarClockIcon className="w-7 h-7 text-purple-600" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
                        <p className="text-sm text-slate-500">Plan your study routine and upcoming events.</p>
                    </div>
                </div>
                <button
                    onClick={() => openCreateModal()}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Create
                </button>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    height="auto"
                    selectable={true}
                    selectMirror={true}
                    editable={true}
                    events={events}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    eventDrop={handleEventChange}
                    eventResize={handleEventChange}
                    nowIndicator={true}
                />
            </div>

            {/* Create / Edit Event Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={form.id ? "Edit Event" : "Create Event"}
            >
                <form onSubmit={handleSaveEvent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleFormChange('title', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. Study for 30 minutes"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="Optional notes"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={(e) => handleFormChange('startTime', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                            <input
                                type="datetime-local"
                                value={form.endTime}
                                onChange={(e) => handleFormChange('endTime', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                        <div className="flex gap-2">
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.name}
                                    onClick={() => handleFormChange('color', c.value)}
                                    className={`w-8 h-8 rounded-full transition-all ${form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        {form.id && (
                            <button
                                type="button"
                                onClick={handleDeleteEvent}
                                disabled={saving}
                                className="flex items-center justify-center gap-1.5 px-4 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SchedulingPage;
