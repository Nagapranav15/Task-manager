import React, { useEffect, useState, useContext } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS, { BASE_URL } from '../../utils/apiPaths';
import { LuFileSpreadsheet, LuX, LuInfo, LuCalendar, LuTrendingUp, LuCheck, LuPaperclip, LuSquareArrowOutUpRight } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Cards/TaskCard';
import { UserContext } from '../../context/userContext';
import moment from 'moment';

const MyTasks = () => {
  const { user } = useContext(UserContext);
  const [allTasks,setAllTasks]=useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [tabs,setTabs]=useState([]);

  const [filterStatus,setFilterStatus]=useState("All");

  const navigate=useNavigate();

  const getAllTasks=async()=>{
    try {
      const response=await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS,{
        params:{
          status: filterStatus === "All" ? "" : (filterStatus === "In-Progress" ? "In Progress" : filterStatus),
          page: page,
          limit: 6,
          assignedToMe: true,
        },
      });
        setAllTasks(response.data?.tasks?.length>0?response.data.tasks:[]);
        setTotalPages(response.data?.totalPages || 1);

        const statusSummary=response.data?.statusSummary || {};
        
        const statusArray=[{
          label:"All",
          count:statusSummary.all || 0,
        },{
          label:"Pending",
          count:statusSummary.pendingTasks || 0,
        },{
          label:"In-Progress",
          count:statusSummary.inProgressTasks || 0,
        },{
          label:"Completed",
          count:statusSummary.completedTasks || 0,
        }];

        setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching tasks:",error);
    }
  }

  const [selectedTask, setSelectedTask] = useState(null);

  const handleClick = (task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = async (task, newStatus) => {
    if (!task) return;
    const prevStatus = task.status;
    const prevChecklist = task.todochecklist || [];
    const prevProgress = task.progress || 0;

    let updatedChecklist = prevChecklist;
    let nextProgress = prevProgress;

    if (newStatus === "Completed") {
      updatedChecklist = prevChecklist.map(item => ({ ...item, completed: true }));
      nextProgress = 100;
    } else if (newStatus === "Pending") {
      updatedChecklist = prevChecklist.map(item => ({ ...item, completed: false }));
      nextProgress = 0;
    }

    const updatedTaskLocal = {
      ...task,
      status: newStatus,
      todochecklist: updatedChecklist,
      progress: nextProgress
    };
    setSelectedTask(updatedTaskLocal);
    setAllTasks(prev => prev.map(t => t._id === task._id ? updatedTaskLocal : t));

    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(task._id),
        { status: newStatus }
      );
      if (res?.data?.task) {
        setSelectedTask(res.data.task);
        setAllTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
      }
    } catch (error) {
      console.error('Failed to update status', error);
      setSelectedTask(task);
      setAllTasks(prev => prev.map(t => t._id === task._id ? task : t));
    }
  };

  const updateTodoCheckList = async (task, index) => {
    if (!task) return;
    const prevList = Array.isArray(task.todochecklist) ? task.todochecklist : [];
    const updatedList = prevList.map((item, i) => (
      i === index ? { ...item, completed: !item?.completed } : item
    ));

    const completedCount = updatedList.filter((i) => i.completed).length;
    const total = updatedList.length;
    const nextProgress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const nextStatus = nextProgress === 100 ? 'Completed' : nextProgress > 0 ? 'In Progress' : 'Pending';

    const updatedTaskLocal = {
      ...task,
      todochecklist: updatedList,
      progress: nextProgress,
      status: nextStatus
    };
    setSelectedTask(updatedTaskLocal);
    setAllTasks(prev => prev.map(t => t._id === task._id ? updatedTaskLocal : t));

    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TODO_TASK(task._id),
        { todochecklist: updatedList }
      );
      if (res?.data?.task) {
        setSelectedTask(res.data.task);
        setAllTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
      }
    } catch (error) {
      console.error('Failed to update checklist', error);
      setSelectedTask(task);
      setAllTasks(prev => prev.map(t => t._id === task._id ? task : t));
    }
  };

  const handleLinkClick = (link) => {
    try {
      if (!link) return;
      let finalLink = String(link).trim();
      if (finalLink.startsWith('/')) {
        finalLink = `${BASE_URL}${finalLink}`;
      }
      if (!/^(https?:|blob:|data:)/i.test(finalLink)) {
        finalLink = `https://${finalLink}`;
      }
      window.open(finalLink, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open link', e);
    }
  };


  useEffect(() => {
    setPage(1);
  }, [filterStatus]);

  useEffect(() => {
    getAllTasks();
    return () => {};
  }, [filterStatus, page]);

  // Refresh tasks when tab/window regains focus or becomes visible
  useEffect(() => {
    const handleFocus = () => getAllTasks();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        getAllTasks();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [filterStatus, page]);

  return (
    <DashboardLayout activeMenu={user?.role === 'manager' ? 'my-tasks' : '02'}>
        <div className='my-5'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between'>
            <h2 className="text-xl md:text-xl font-medium">My tasks</h2>
            {tabs?.[0]?.count >= 0 && (
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />  
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
            {allTasks?.map((item, index) => (
              <TaskCard
                key={item._id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                dueDate={item.dueDate}
                assignedTo={item.assignedTo}
                attachmentcount={item.attachments?.length || 0}
                completedTodoCount={item.completedTodoCount || 0}
                todoCheckList={item.todochecklist || []}
                onClick={() => handleClick(item)}
              />
            ))}
          </div>

          {/* Side Information Drawer */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
                onClick={() => setSelectedTask(null)}
              />
              
              {/* Drawer Panel */}
              <div className="relative w-full max-w-md h-full bg-white dark:bg-[#070a13] border-l border-slate-200 dark:border-slate-800/80 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-in z-10">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800/60 mb-5">
                    <div className="max-w-[80%]">
                      <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
                        Task Details
                      </span>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-1 break-words">
                        {selectedTask.title}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <LuX className="text-lg" />
                    </button>
                  </div>

                  {/* Status Updater */}
                  <div className="flex items-center justify-between mb-5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 p-3.5 rounded-xl">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Status:</label>
                    <select
                      value={selectedTask.status || 'Pending'}
                      onChange={(e) => handleStatusChange(selectedTask, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                        selectedTask.status === 'Completed'
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : selectedTask.status === 'In Progress' || selectedTask.status === 'In-Progress'
                          ? 'text-cyan-705 bg-cyan-50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-800'
                          : selectedTask.status === 'Blocked'
                          ? 'text-rose-700 bg-rose-50 dark:bg-rose-955/20 border-rose-300 dark:border-rose-800'
                          : 'text-amber-700 bg-amber-50 dark:bg-amber-955/20 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Content Body */}
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-550 mb-1">Description</h5>
                      <p className="text-xs text-slate-750 dark:text-slate-350 leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800">
                        {selectedTask.description || "No description provided."}
                      </p>
                    </div>

                    {/* Priority & Due Date Info Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                        <LuInfo className="text-xs text-indigo-500 dark:text-indigo-400 mb-1" />
                        <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Priority</span>
                        <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 mt-0.5">{selectedTask.priority}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/35 border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center text-center">
                        <LuCalendar className="text-xs text-indigo-500 dark:text-indigo-400 mb-1" />
                        <span className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">Due Date</span>
                        <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 mt-0.5">
                          {selectedTask.dueDate ? moment(selectedTask.dueDate).format("DD MMM YYYY") : "N/A"}
                        </span>
                      </div>
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
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-300/50 dark:border-slate-700/60 p-0.5">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
                          style={{ width: `${selectedTask.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned To */}
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Assigned To</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                          selectedTask.assignedTo.map((member) => (
                            <span 
                              key={member._id || member.id}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50"
                            >
                              {member.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Checklist */}
                    {selectedTask.todochecklist && selectedTask.todochecklist.length > 0 && (
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                          <LuCheck className="text-indigo-400" /> Checklist Items
                        </h5>
                        <div className="space-y-2">
                          {selectedTask.todochecklist.map((item, index) => (
                            <div key={item._id || index} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-350 text-xs">
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => updateTodoCheckList(selectedTask, index)}
                                className="rounded border-slate-300 dark:border-slate-850 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className={item.completed ? "line-through text-slate-400 dark:text-slate-500 font-semibold" : "font-medium"}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <LuPaperclip className="text-indigo-400" /> Attachments
                        </h5>
                        <div className="space-y-1.5">
                          {selectedTask.attachments.map((att, index) => {
                            const name = att?.name || att?.filename || att?.originalName || (typeof att === 'string' ? att.split('/').pop() : 'Attachment ' + (index + 1));
                            const url = att?.url || att?.fileUrl || att?.link || att?.path || att?.secure_url || (typeof att === 'string' ? att : '');
                            return (
                              <div key={index} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-lg">
                                <p className="text-[11px] text-gray-800 dark:text-slate-300 truncate max-w-[240px]" title={name}>{name}</p>
                                {url ? (
                                  <button
                                    onClick={() => handleLinkClick(url)}
                                    className="inline-flex items-center justify-center text-indigo-650 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                                  >
                                    <LuSquareArrowOutUpRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No link</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Bottom info */}
                {selectedTask.createdBy && (
                  <div className="border-t border-slate-200 dark:border-slate-800/60 pt-3.5 flex items-center justify-between mt-6">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Created By</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-850 dark:text-slate-200">{selectedTask.createdBy.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 px-4 py-3 rounded-2xl">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-950/40 hover:bg-slate-200 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-355 bg-slate-100 dark:bg-slate-950/40 hover:bg-slate-200 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
    </DashboardLayout>
  );
};

export default MyTasks
