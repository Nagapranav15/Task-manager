import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { LuX, LuCalendar, LuInfo, LuUserCheck, LuCheck, LuTrendingUp } from 'react-icons/lu';

const TaskListTable = ({ tableData = [] }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    // Escape key listener to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setSelectedTask(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const getStatusBadgeColor = (status) => {
        const s = String(status || '').toLowerCase().replace(/[_\s]+/g, '-');
        switch (s) {
            case "pending":
                return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
            case "in-progress":
                return "bg-cyan-500/10 text-cyan-750 dark:text-cyan-400 border-cyan-500/20";
            case "completed":
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
            case "blocked":
                return "bg-rose-500/10 text-rose-700 dark:text-rose-450 border-rose-500/20";
            default:
                return "bg-slate-550/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
        }
    };

    const getPriorityBadgeColor = (priority) => {
        const p = String(priority || '').toLowerCase().trim();
        switch (p) {
            case "low":
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
            case "medium":
                return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
            case "high":
                return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
            default:
                return "bg-slate-550/10 text-slate-650 dark:text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/20 backdrop-blur-md mt-4 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/60">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/30 text-left">
                        <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Name</th>
                        <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Status</th>
                        <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Priority</th>
                        <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Created on</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                    {tableData.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">
                                No recent tasks found
                            </td>
                        </tr>
                    ) : (
                        tableData.map((task) => (
                            <tr 
                                key={task._id} 
                                onClick={() => setSelectedTask(task)}
                                className="hover:bg-slate-100/50 dark:hover:bg-slate-900/25 cursor-pointer transition-colors"
                            >
                                <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 text-xs font-semibold max-w-[200px] truncate" title={task.title}>
                                    {task.title}
                                </td>
                                <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadgeColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getPriorityBadgeColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                                    {task.createdAt ? moment(task.createdAt).format("DD MMM YYYY") : "N/A"}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Task Detail Modal Pop-up */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
                        onClick={() => setSelectedTask(null)}
                    />

                    {/* Modal container */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-[#070a13] border border-slate-200 dark:border-slate-900 shadow-2xl p-6 rounded-2xl flex flex-col z-10 animate-fade-in transition-all">
                        {/* Header details */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-900 mb-4">
                            <div>
                                <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
                                    Task Preview
                                </span>
                                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-1">
                                    {selectedTask.title}
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[8px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded-md">
                                    Esc to close
                                </span>
                                <button 
                                    onClick={() => setSelectedTask(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                    <LuX className="text-base" />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                            {/* Badges Info Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-900 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                                    <LuInfo className="text-xs text-indigo-500 dark:text-indigo-400 mb-1" />
                                    <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Priority</span>
                                    <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 mt-0.5">{selectedTask.priority}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-900 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                                    <LuUserCheck className="text-xs text-indigo-500 dark:text-indigo-400 mb-1" />
                                    <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Status</span>
                                    <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 mt-0.5">{selectedTask.status}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-900 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                                    <LuCalendar className="text-xs text-indigo-500 dark:text-indigo-400 mb-1" />
                                    <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Due Date</span>
                                    <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 mt-0.5">
                                        {selectedTask.dueDate ? moment(selectedTask.dueDate).format("DD MMM YYYY") : "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Description</h5>
                                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/40 dark:border-slate-900">
                                    {selectedTask.description || "No description provided."}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <LuTrendingUp className="text-indigo-400" /> Progress
                                    </h5>
                                    <span className="text-[10px] font-extrabold text-indigo-550 dark:text-indigo-400">
                                        {selectedTask.progress || 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 border border-slate-200/40 dark:border-slate-800">
                                    <div 
                                        className="bg-indigo-650 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${selectedTask.progress || 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Todo checklist */}
                            {selectedTask.todochecklist && selectedTask.todochecklist.length > 0 && (
                                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/40 dark:border-slate-900">
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                                        <LuCheck className="text-indigo-400" /> Checklist Items
                                    </h5>
                                    <div className="space-y-2">
                                        {selectedTask.todochecklist.map((item) => (
                                            <div key={item._id} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-xs">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.completed} 
                                                    disabled 
                                                    className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 pointer-events-none"
                                                />
                                                <span className={item.completed ? "line-through text-slate-400 dark:text-slate-500 font-semibold" : "font-medium"}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Assigned members list */}
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Assigned To</h5>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                                        selectedTask.assignedTo.map((member) => (
                                            <div key={member._id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/35 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-900">
                                                <img 
                                                    src={member.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.name.toLowerCase())}`} 
                                                    alt={member.name} 
                                                    className="w-5.5 h-5.5 rounded-full object-cover"
                                                />
                                                <div className="text-left">
                                                    <p className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{member.name}</p>
                                                    <p className="text-[8px] text-slate-500 leading-none">{member.email}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">No members assigned.</p>
                                    )}
                                </div>
                            </div>

                            {/* Created by */}
                            {selectedTask.createdBy && (
                                <div className="border-t border-slate-200 dark:border-slate-900 pt-3.5 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-550 dark:text-slate-450 uppercase tracking-widest">Created By</span>
                                    <div className="flex items-center gap-2">
                                        <img 
                                            src={selectedTask.createdBy.profileImageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedTask.createdBy.name.toLowerCase())}`} 
                                            alt={selectedTask.createdBy.name} 
                                            className="w-5.5 h-5.5 rounded-full object-cover"
                                        />
                                        <span className="text-[10px] font-extrabold text-slate-850 dark:text-slate-200">{selectedTask.createdBy.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskListTable;
