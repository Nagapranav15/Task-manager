import React from 'react'
import Progress from '../layouts/Progress'
import AvatarGroup from '../AvatarGroup'
import {LuPaperclip, LuFileSpreadsheet} from 'react-icons/lu';
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
    const getStatusTagColor=()=>{
        switch(status){
            
            case "In-Progress":
                return "text-cyan-500 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-500/10 dark:border-cyan-900/40";
            case "Completed":
                return "text-green-500 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-500/10 dark:border-green-900/40";
            default:
                return "text-rose-500 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-500/10 dark:border-rose-900/40";
        }
    };
    const getPriorityTagColor=()=>{
        switch(priority){
            case "Low":
                return "text-emerald-500 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-500/10 dark:border-emerald-900/40";
            case "Medium":
                return "text-amber-500 dark:text-amber-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-500/10 dark:border-blue-900/40";
            default:
                return "text-rose-500 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-500/10 dark:border-rose-900/40";
        }
    };
    return (
        <div
        className="transition-all duration-200 ease-out hover:-translate-y-0.5"
        onClick={onClick}
        >
            <div className="bg-white dark:bg-slate-900 rounded-xl py-4 shadow-md shadow-gray-100/40 dark:shadow-black/20 border border-gray-200/50 dark:border-slate-800 cursor-pointer"
            onClick={onClick}
            >
                <div className="flex-tems-end gap-3 px-4">
                <div
                className={`text-[11px] font-medium ${getStatusTagColor()} px-2 py-1 rounded-full`}
                >
                    {status}
                </div>
                <div
                className={`text-[11px] font-medium ${getPriorityTagColor()} px-4 py-0.5 rounded-full`}
                >
                    {priority}Priority
                </div>
                </div>
            </div>
            <div 
            className={`px-4 border-l-[3px]${
                status === "In Progress"
                ? "border-cyan-500"
                : status === "Completed"
                ? "border-indigo-500"
                : "border-violet-500"
            }`}
            >
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 mt-4 line-clamp-2">
                    {title}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-[18px]">
                    {description}
                </p>
                <p className="text-[13px] text-gray-700/80 dark:text-slate-300 font-medium mt-2 mb-2 leading-[18px]">
                    TaskDone:{""}
                    <span className=" font-semibold text-gray-700 dark:text-slate-200">
                        {completedTodoCount}/{todoCheckList?.length||0}
                    </span>
                </p>
                <Progress
                progress={progress}
                status={status}
                />
            </div>
            <div className="px-4"
            >
                <div className="flex iems-center justify-between my-1 ">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-slate-400">Start Date</label>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-slate-100">
                            {moment(createdAt).format("DD-MM-YYYY")}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-slate-400">Due Date</label>
                        <p className="text-[13px] font-medium text-gray-900 dark:text-slate-100">
                            {moment(dueDate).format("DD-MM-YYYY")}
                        </p>
                    </div>
                </div>  
            </div>
            <div className="flex items-center justify-between mt-3">
                <AvatarGroup
                avatars={assignedTo}
                />
            </div>
            <div className="">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                    <LuPaperclip className="text-primary"/>
                    <p className="text-xs text-gray-900 dark:text-slate-100">
                        {attachmentcount} Attachments
                    </p>
                </div>
            </div>
            
        </div>
    )
}

export default TaskCard
