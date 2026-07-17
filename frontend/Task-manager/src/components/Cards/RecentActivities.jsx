import React, { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import moment from 'moment';
import { 
    LuActivity, LuClock, LuBriefcase, LuCheck, LuTrash2, 
    LuUserPlus, LuLogIn, LuUser, LuShield, LuUserMinus 
} from 'react-icons/lu';
import { UserContext } from '../../context/userContext';

const RecentActivities = () => {
    const { user, socket } = useContext(UserContext);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState("All");

    const fetchActivities = async () => {
        try {
            const res = await axiosInstance.get(API_PATHS.AUTH.GET_ACTIVITIES);
            setActivities(res.data || []);
        } catch (error) {
            console.error("Failed to load activities", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        return () => {};
    }, []);

    // Listen to real-time socket events to update log feed automatically
    useEffect(() => {
        if (!socket) return;
        
        const handleNotification = () => {
            fetchActivities();
        };

        socket.on("notification", handleNotification);

        return () => {
            socket.off("notification", handleNotification);
        };
    }, [socket]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'Clock In':
                return <LuClock className="text-emerald-500 dark:text-emerald-400" />;
            case 'Clock Out':
                return <LuClock className="text-rose-500 dark:text-rose-400" />;
            case 'Task Created':
                return <LuBriefcase className="text-indigo-500 dark:text-indigo-400" />;
            case 'Task Updated':
                return <LuBriefcase className="text-violet-500 dark:text-violet-400" />;
            case 'Task Deleted':
                return <LuTrash2 className="text-rose-500 dark:text-rose-400" />;
            case 'Status Updated':
            case 'Checklist Updated':
                return <LuCheck className="text-cyan-500 dark:text-cyan-400" />;
            case 'User Registered':
                return <LuUserPlus className="text-emerald-500 dark:text-emerald-400" />;
            case 'Login':
                return <LuLogIn className="text-indigo-500 dark:text-indigo-400" />;
            case 'Profile Updated':
                return <LuUser className="text-blue-500 dark:text-blue-400" />;
            case 'Role Updated':
                return <LuShield className="text-amber-500 dark:text-amber-400" />;
            case 'Attendance Updated':
                return <LuClock className="text-amber-500 dark:text-amber-400" />;
            case 'User Deleted':
                return <LuUserMinus className="text-rose-500 dark:text-rose-400" />;
            default:
                return <LuActivity className="text-slate-500 dark:text-slate-400" />;
        }
    };

    const getActionBg = (action) => {
        switch (action) {
            case 'Clock In':
            case 'User Registered':
                return 'bg-emerald-500/10 border-emerald-500/20';
            case 'Clock Out':
            case 'Task Deleted':
            case 'User Deleted':
                return 'bg-rose-500/10 border-rose-500/20';
            case 'Task Created':
            case 'Login':
                return 'bg-indigo-500/10 border-indigo-500/20';
            case 'Task Updated':
                return 'bg-violet-500/10 border-violet-500/20';
            case 'Status Updated':
            case 'Checklist Updated':
                return 'bg-cyan-500/10 border-cyan-500/20';
            case 'Profile Updated':
                return 'bg-blue-500/10 border-blue-500/20';
            case 'Role Updated':
            case 'Attendance Updated':
                return 'bg-amber-500/10 border-amber-500/20';
            default:
                return 'bg-slate-500/10 border-slate-500/20';
        }
    };

    const getFilteredActivities = () => {
        if (filterCategory === "All") return activities;
        return activities.filter((log) => {
            const action = (log.action || "").toLowerCase();
            const details = (log.details || "").toLowerCase();
            
            if (filterCategory === "Creation") {
                return action.includes("created") || action.includes("register");
            }
            if (filterCategory === "Updation") {
                return action.includes("update") || action.includes("edit") || action.includes("role");
            }
            if (filterCategory === "Completion") {
                return details.includes("completed") || action.includes("completed");
            }
            if (filterCategory === "Clock In/Out") {
                return action.includes("clock");
            }
            return true;
        });
    };

    const filtered = getFilteredActivities();

    console.log("[RecentActivities] Render state:", JSON.stringify({ loading, userRole: user?.role, activitiesCount: activities?.length, filteredCount: filtered.length }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <span className="animate-spin h-5 w-5 text-indigo-500 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Loading activity log...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 pr-1">
            <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {user?.role === "admin" || user?.role === "manager" ? "🌐 Global Workspace Feed" : "👤 My Personal Logs"}
                </span>
                <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                    {filtered.length} logs
                </span>
            </div>

            {/* Filter Categories pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-900/50">
                {["All", "Creation", "Updation", "Completion", "Clock In/Out"].map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={`text-[8.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                            filterCategory === cat
                                ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950/20 text-slate-550 dark:text-slate-400 border-slate-200 dark:border-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-950/30"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-semibold">
                    No matching activities found.
                </div>
            ) : (
                filtered.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-950/30 border border-slate-200 dark:border-slate-900/65 rounded-2xl transition-all">
                        {/* Action Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${getActionBg(log.action)}`}>
                            {getActionIcon(log.action)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-600 dark:text-slate-350 font-medium leading-relaxed">
                                <span className="font-bold text-slate-800 dark:text-slate-100">{log.user?.name || "Someone"}</span> {log.details}
                            </p>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-1 block">
                                {moment(log.createdAt).fromNow()}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RecentActivities;
