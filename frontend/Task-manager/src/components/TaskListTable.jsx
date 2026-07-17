import React from 'react';
import moment from 'moment';

const TaskListTable = ({ tableData = [] }) => {
    const getStatusBadgeColor = (status) => {
        const s = String(status || '').toLowerCase().replace(/[_\s]+/g, '-');
        switch (s) {
            case "pending":
                return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
            case "in-progress":
                return "bg-cyan-500/10 text-cyan-750 dark:text-cyan-400 border-cyan-500/20";
            case "completed":
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
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
                            <tr key={task._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
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
        </div>
    );
};

export default TaskListTable;

