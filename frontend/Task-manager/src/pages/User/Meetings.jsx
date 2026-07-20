import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import MeetingFormModal from '../../components/MeetingFormModal';
import { LuVideo, LuCalendar, LuClock, LuPlus, LuTrash2, LuPencil, LuUsers, LuExternalLink } from 'react-icons/lu';
import toast from 'react-hot-toast';

const Meetings = () => {
    const { user } = useContext(UserContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTab, setFilterTab] = useState('upcoming'); // 'upcoming', 'past', 'all'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeetingToEdit, setSelectedMeetingToEdit] = useState(null);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(API_PATHS.MEETINGS.GET_ALL_MEETINGS);
            setMeetings(response.data || []);
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
            toast.error('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMeeting = async (meetingId, title) => {
        if (!window.confirm(`Are you sure you want to cancel the meeting "${title}"?`)) return;

        try {
            await axiosInstance.delete(API_PATHS.MEETINGS.DELETE_MEETING(meetingId));
            toast.success('Meeting cancelled');
            fetchMeetings();
        } catch (error) {
            console.error('Failed to delete meeting:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel meeting');
        }
    };

    const openEditModal = (meeting) => {
        setSelectedMeetingToEdit(meeting);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedMeetingToEdit(null);
        setIsModalOpen(true);
    };

    // Filter meetings
    const now = new Date();
    const filteredMeetings = meetings.filter((m) => {
        const endTime = new Date(m.endTime);
        if (filterTab === 'upcoming') {
            return endTime >= now;
        } else if (filterTab === 'past') {
            return endTime < now;
        }
        return true;
    });

    return (
        <DashboardLayout activeMenu="meetings">
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/40 p-6 rounded-3xl border border-indigo-500/20 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/10">
                            <LuVideo />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                Meetings & Video Calls
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Schedule video meetings with automatic Google Meet links & Google Calendar sync.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        <LuPlus className="text-base" />
                        <span>Schedule Meeting</span>
                    </button>
                </div>

                {/* Filter Tabs & Count */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                        {[
                            { key: 'upcoming', label: 'Upcoming' },
                            { key: 'past', label: 'Past Meetings' },
                            { key: 'all', label: 'All Meetings' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTab(tab.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filterTab === tab.key
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                        Showing {filteredMeetings.length} meeting(s)
                    </span>
                </div>

                {/* Meetings List / Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold">Loading meetings...</span>
                    </div>
                ) : filteredMeetings.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 p-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl mx-auto mb-3">
                            <LuVideo />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No meetings found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            {filterTab === 'upcoming'
                                ? 'You have no upcoming scheduled meetings.'
                                : 'No meeting records found.'}
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2"
                        >
                            <LuPlus /> Schedule Your First Meeting
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredMeetings.map((meeting) => {
                            const startTime = new Date(meeting.startTime);
                            const endTime = new Date(meeting.endTime);
                            const isLive = now >= startTime && now <= endTime;
                            const isPast = now > endTime;

                            const canManage =
                                user?.role === 'admin' ||
                                user?.role === 'manager' ||
                                (meeting.organizer && (meeting.organizer._id === user?._id || meeting.organizer === user?._id));

                            return (
                                <div
                                    key={meeting._id}
                                    className={`bg-white dark:bg-slate-900/90 border rounded-3xl p-5 shadow-lg transition-all hover:shadow-xl flex flex-col justify-between relative overflow-hidden ${
                                        isLive
                                            ? 'border-emerald-500/50 ring-2 ring-emerald-500/20'
                                            : isPast
                                            ? 'border-slate-200 dark:border-slate-800/80 opacity-80'
                                            : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    {/* Top Status & Actions */}
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                {isLive && (
                                                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30 animate-pulse flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Now
                                                    </span>
                                                )}
                                                {!isLive && !isPast && (
                                                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-500/20">
                                                        Scheduled
                                                    </span>
                                                )}
                                                {isPast && (
                                                    <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-500/20">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>

                                            {canManage && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(meeting)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Edit Meeting"
                                                    >
                                                        <LuPencil className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMeeting(meeting._id, meeting.title)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Cancel Meeting"
                                                    >
                                                        <LuTrash2 className="text-sm" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                                            {meeting.title}
                                        </h3>
                                        {meeting.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                                {meeting.description}
                                            </p>
                                        )}

                                        {/* Date & Time */}
                                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 my-3">
                                            <div className="flex items-center gap-2">
                                                <LuCalendar className="text-indigo-500 text-sm" />
                                                <span className="font-semibold">
                                                    {startTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <LuClock className="text-indigo-500 text-sm" />
                                                <span className="font-medium text-slate-500 dark:text-slate-400">
                                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Participants List */}
                                        <div className="flex flex-col gap-1.5 my-3">
                                            <div className="flex items-center gap-2">
                                                <LuUsers className="text-slate-400 text-xs" />
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    {(meeting.participants?.length || 0) + (meeting.externalParticipants?.length || 0)} Participant(s):
                                                </span>
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {(meeting.participants || []).slice(0, 4).map((p, idx) => (
                                                        <div
                                                            key={p._id || idx}
                                                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center overflow-hidden text-slate-700 dark:text-slate-200"
                                                            title={p.name || p.email}
                                                        >
                                                            {p.profileImageUrl ? (
                                                                <img src={p.profileImageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                p.name ? p.name.charAt(0).toUpperCase() : 'U'
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(meeting.participants?.length || 0) > 4 && (
                                                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500">
                                                            +{(meeting.participants?.length || 0) - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {(meeting.externalParticipants || []).length > 0 && (
                                                <div className="flex flex-wrap gap-1 text-[10px]">
                                                    {meeting.externalParticipants.map((extEmail, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                                            🌐 {extEmail}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Google Meet Button */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                                        {meeting.meetLink ? (
                                            <a
                                                href={meeting.meetLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                    isLive
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 animate-bounce'
                                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                                }`}
                                            >
                                                <LuVideo className="text-sm" />
                                                <span>Join Google Meet</span>
                                                <LuExternalLink className="text-xs opacity-80" />
                                            </a>
                                        ) : (
                                            <div className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-400 font-semibold text-center">
                                                No video link generated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Schedule / Edit Modal */}
            <MeetingFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                meetingToEdit={selectedMeetingToEdit}
                onMeetingSaved={fetchMeetings}
            />
        </DashboardLayout>
    );
};

export default Meetings;
