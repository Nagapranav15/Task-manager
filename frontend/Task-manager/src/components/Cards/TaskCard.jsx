import React from 'react'
import Progress from '../layouts/Progress'
import AvatarGroup from '../AvatarGroup'
import { LuPaperclip } from 'react-icons/lu';
import moment from 'moment';

const TaskCard = ({
    title,
    description,
    priority,
    status,
    progress,
    createdAt,
    dueDate,
    assignedTo,
    attachmentcount,
    completedTodoCount,
    todoCheckList,
    onClick
}) => {
    const getStatusTagColor = () => {
        switch (status) {
            case "In-Progress":
            case "In Progress":
                return "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25";
            case "Completed":
                return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
            default:
                return "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25";
        }
    };

    const getPriorityTagColor = () => {
        switch (priority) {
            case "Low":
                return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
            case "Medium":
                return "text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/25";
            default:
                return "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25";
        }
    };

    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 shadow-md shadow-slate-100/10 dark:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
            <div>
                {/* Header: Status and Priority */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <span className={`text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ${getStatusTagColor()}`}>
                        {status}
                    </span>
                    <span className={`text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ${getPriorityTagColor()}`}>
                        {priority} Priority
                    </span>
                </div>

                {/* Body Details */}
                <div className={`pl-3.5 border-l-2 ${
                    status === "In-Progress" || status === "In Progress"
                        ? "border-cyan-500"
                        : status === "Completed"
                        ? "border-emerald-500"
                        : "border-amber-500"
                }`}>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                        {title}
                    </h4>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 line-clamp-2 leading-[18px]">
                        {description}
                    </p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/40">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-bold text-slate-650 dark:text-slate-300">
                        Checklist: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{completedTodoCount}/{todoCheckList?.length || 0}</span>
                    </span>
                    <div className="w-24">
                        <Progress progress={progress} status={status} />
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    <div>
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Start Date</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{moment(createdAt).format("DD MMM YYYY")}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Due Date</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{moment(dueDate).format("DD MMM YYYY")}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 max-w-[75%]">
                        {assignedTo && assignedTo.length > 0 ? (
                            assignedTo.map((member) => (
                                <span 
                                    key={member._id || member.id || Math.random()}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold text-slate-750 dark:text-slate-300 border border-slate-200/60 dark:border-slate-850"
                                    title={member.email}
                                >
                                    <span>{member.name}</span>
                                    <span className="text-[7.5px] font-black uppercase text-indigo-600 dark:text-indigo-400">({member.role || 'Member'})</span>
                                </span>
                            ))
                        ) : (
                            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Unassigned</span>
                        )}
                    </div>
                    {attachmentcount > 0 && (
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-650 dark:text-slate-300 font-bold">
                            <LuPaperclip className="text-indigo-600 dark:text-indigo-400 text-xs animate-pulse" />
                            <span>{attachmentcount}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TaskCard

