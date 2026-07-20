import React, { useState, useEffect } from 'react';
import { LuX, LuCalendar, LuClock, LuUsers, LuVideo } from 'react-icons/lu';
import axiosInstance from '../utils/axiosInstance';
import API_PATHS from '../utils/apiPaths';
import toast from 'react-hot-toast';

const MeetingFormModal = ({ isOpen, onClose, meetingToEdit, onMeetingSaved }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            if (meetingToEdit) {
                setTitle(meetingToEdit.title || '');
                setDescription(meetingToEdit.description || '');
                
                // Format ISO dates to datetime-local string
                if (meetingToEdit.startTime) {
                    const start = new Date(meetingToEdit.startTime);
                    start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
                    setStartTime(start.toISOString().slice(0, 16));
                }
                if (meetingToEdit.endTime) {
                    const end = new Date(meetingToEdit.endTime);
                    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
                    setEndTime(end.toISOString().slice(0, 16));
                }

                const pIds = (meetingToEdit.participants || []).map(p => typeof p === 'object' ? p._id : p);
                setSelectedParticipants(pIds);
            } else {
                setTitle('');
                setDescription('');
                
                // Default start time: 1 hour from now; default end time: 2 hours from now
                const defaultStart = new Date(Date.now() + 60 * 60 * 1000);
                defaultStart.setMinutes(defaultStart.getMinutes() - defaultStart.getTimezoneOffset());
                setStartTime(defaultStart.toISOString().slice(0, 16));

                const defaultEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
                defaultEnd.setMinutes(defaultEnd.getMinutes() - defaultEnd.getTimezoneOffset());
                setEndTime(defaultEnd.toISOString().slice(0, 16));

                setSelectedParticipants([]);
            }
        }
    }, [isOpen, meetingToEdit]);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
            setAvailableUsers(response.data.users || response.data || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleParticipant = (userId) => {
        if (selectedParticipants.includes(userId)) {
            setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
        } else {
            setSelectedParticipants([...selectedParticipants, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            return toast.error('Please enter a meeting title');
        }
        if (!startTime || !endTime) {
            return toast.error('Please specify start and end times');
        }
        if (new Date(endTime) <= new Date(startTime)) {
            return toast.error('End time must be after start time');
        }

        try {
            setLoading(true);
            const payload = {
                title,
                description,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                participants: selectedParticipants
            };

            if (meetingToEdit) {
                await axiosInstance.put(API_PATHS.MEETINGS.UPDATE_MEETING(meetingToEdit._id), payload);
                toast.success('Meeting updated & synced with Google Calendar!');
            } else {
                await axiosInstance.post(API_PATHS.MEETINGS.CREATE_MEETING, payload);
                toast.success('Meeting scheduled & Google Meet link generated!');
            }

            onMeetingSaved();
            onClose();
        } catch (error) {
            console.error('Meeting Save Error:', error);
            toast.error(error.response?.data?.message || 'Failed to save meeting');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
                            <LuVideo />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                                {meetingToEdit ? 'Edit Meeting' : 'Schedule New Meeting'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Auto-generates Google Meet video link
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <LuX className="text-lg" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Meeting Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Project Sync & Sprint Planning"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Agenda, notes, or discussion points..."
                            rows="2"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <LuCalendar className="text-indigo-500" /> Start Time <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                <LuClock className="text-indigo-500" /> End Time <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                            <LuUsers className="text-indigo-500" /> Invite Participants
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                            {loadingUsers ? (
                                <p className="text-xs text-slate-400 text-center py-3">Loading users...</p>
                            ) : availableUsers.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-3">No other users found.</p>
                            ) : (
                                availableUsers.map((user) => {
                                    const isSelected = selectedParticipants.includes(user._id);
                                    return (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleParticipant(user._id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden text-slate-700 dark:text-slate-300">
                                                    {user.profileImageUrl ? (
                                                        <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                                                    <p className="text-[10px] text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <LuVideo className="text-sm" />
                                    <span>{meetingToEdit ? 'Update Meeting' : 'Schedule & Create Meet Link'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingFormModal;
