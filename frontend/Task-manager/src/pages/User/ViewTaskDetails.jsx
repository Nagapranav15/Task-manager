import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { BASE_URL } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import moment from 'moment';
import AvatarGroup from '../../components/AvatarGroup';
import { LuSquareArrowOutUpRight, LuArrowLeft, LuLayoutDashboard } from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import { toast } from 'react-hot-toast';

const ViewTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const { user } = useContext(UserContext);

  const handleVerificationChange = async (newVerificationStatus) => {
    if (!task) return;
    const prevVerification = task.verificationStatus;
    
    setTask(prev => ({
      ...prev,
      verificationStatus: newVerificationStatus
    }));

    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(task._id || id),
        { verificationStatus: newVerificationStatus }
      );
      if (res?.data?.task) {
        setTask(res.data.task);
        toast.success(`Verification status updated to: ${newVerificationStatus}`);
      }
    } catch (error) {
      console.error('Failed to update verification status', error);
      setTask(prev => ({
        ...prev,
        verificationStatus: prevVerification
      }));
      toast.error('Failed to update verification status.');
    }
  };

  const getStatusTagColor=(status)=>{
    switch(status){
      case "Pending":
        return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
      case "In-Progress":
        return "text-lime-500 bg-lime-50 border border-lime-500/10";
      case "In Progress":
        return "text-lime-500 bg-lime-50 border border-lime-500/10";
      case "Completed":
        return "text-violet-500 bg-violet-50 border border-violet-500/10";
      default:
        return "bg-gray-500";
    }
  };

  // removed done action per request

  const getTaskDetailsById=async()=>{
    try {
        const response=await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));
        if(response.status)
        {
          const taskInfo = response.data;
          setTask(taskInfo);
        }
    } catch (error) {
      
    }
  };  

  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    
    if (newStatus === "Completed") {
      const confirmCompletion = window.confirm("Are you sure you want to mark this task as completed? This will notify the task creator/admin.");
      if (!confirmCompletion) return;
    }

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

    setTask((prev) => ({ 
      ...prev, 
      status: newStatus,
      todochecklist: updatedChecklist,
      progress: nextProgress
    }));

    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(task._id || id),
        { status: newStatus }
      );
      if (res?.data?.task) {
        setTask(res.data.task);
      }
    } catch (error) {
      console.error('Failed to update status', error);
      setTask((prev) => ({ 
        ...prev, 
        status: prevStatus,
        todochecklist: prevChecklist,
        progress: prevProgress
      }));
    }
  };

  const updateTodoCheckList = async (index) => {
    if (!task) return;
    const prevList = Array.isArray(task.todochecklist) ? task.todochecklist : [];
    const updatedList = prevList.map((item, i) => (
      i === index ? { ...item, completed: !item?.completed } : item
    ));

    // Compute progress/status locally for immediate feedback
    const completedCount = updatedList.filter((i) => i.completed).length;
    const total = updatedList.length;
    const nextProgress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const nextStatus = nextProgress === 100 ? 'Completed' : nextProgress > 0 ? 'In Progress' : 'Pending';

    // Optimistic update
    setTask((prev) => ({ ...prev, todochecklist: updatedList, progress: nextProgress, status: nextStatus }));

    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TODO_TASK(task?._id || id),
        { todochecklist: updatedList }
      );
      if (res?.data?.task) {
        setTask(res.data.task);
      }
    } catch (error) {
      console.error('Failed to update checklist', error);
      // Revert on failure
      setTask((prev) => ({ ...prev, todochecklist: prevList }));
    }
  };

  const handleLinkClick = (link) => {
    try {
      if (!link) return;
      let finalLink = String(link).trim();

      // If relative path, prefix with API base URL
      if (finalLink.startsWith('/')) {
        finalLink = `${BASE_URL}${finalLink}`;
      }

      // Allow http(s), blob, data schemes; otherwise default to https
      if (!/^(https?:|blob:|data:)/i.test(finalLink)) {
        finalLink = `https://${finalLink}`; // Default to HTTPS
      }

      window.open(finalLink, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open link', e);
    }
  };

  useEffect(()=>{
    if(id)
    {
    getTaskDetailsById(id);
    }
    return ()=>{};
  },[id]);








  return (
    <DashboardLayout activeMenu="02">
      <div className="mt-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            aria-label="Go Back to Previous Page"
          >
            <LuArrowLeft className="text-sm" /> Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer shadow-sm"
            aria-label="Go to Dashboard"
          >
            <LuLayoutDashboard className="text-sm" /> Dashboard
          </button>
        </div>

        {task ? (
          <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
            <div className="form-card col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-xl font-medium flex items-center gap-2 flex-wrap">
                  <span>{task?.title}</span>
                  {task?.verificationStatus === 'Verified' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                      Verified ✅
                    </span>
                  )}
                  {task?.verificationStatus === 'Verification In Progress' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-450 border border-blue-500/20 animate-pulse">
                      Verification In Progress ⏸️
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Status:</label>
                  <select
                    value={task?.status || 'Pending'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                      task?.status === 'Completed'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : task?.status === 'In Progress' || task?.status === 'In-Progress'
                        ? 'text-cyan-705 bg-cyan-50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-800'
                        : task?.status === 'Blocked'
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
              </div>
              <div className="mt-4">
                <InfoBox label="Description" value={task?.description} />
              </div>
              <div className="mt-4">
                <InfoBox label="Priority" value={task?.priority} />
                <div className="h-3"></div>
                <InfoBox label="Due Date" value={task?.dueDate ? moment(task?.dueDate).format("DD MMM YYYY") : "N/A"} />
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Assigned To</label>
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-[70%]">
                    {task?.assignedTo && task.assignedTo.length > 0 ? (
                      task.assignedTo.map((item) => (
                        <span 
                          key={item?._id || item?.id} 
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50"
                        >
                          {item?.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className='mt-2'>
                <label className='text-xs font-medium text-slate-500'>
                  ToDoCheckList
                </label>
                {task?.todochecklist?.map((item, index) => (
                  <TodoCheckList
                    key={`todo_${index}`}
                    text={item.text}
                    isChecked={item?.completed}
                    onChange={() => updateTodoCheckList(index)}
                  />
                ))}
              </div>
              <div className='mt-2'>
                <label className='text-xs font-medium text-slate-500'>
                  Attachments
                </label>
                {(task?.attachments || []).map((att, index) => (
                  <AttachmentRow
                    key={`att_${index}`}
                    name={(att?.name || att?.filename || att?.originalName || (typeof att === 'string' ? att.split('/').pop() : 'Attachment ' + (index + 1)))}
                    url={(att?.url || att?.fileUrl || att?.link || att?.path || att?.secure_url || (typeof att === 'string' ? att : ''))}
                    onOpen={handleLinkClick}
                  />
                ))}
              </div>
              
              {user?.role !== 'admin' && task?.status !== 'Completed' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleStatusChange("Completed")}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Mark Task as Completed
                  </button>
                </div>
              )}

              {(user?.role === 'admin' || (user?.role === 'manager' && task?.createdBy?.role === 'manager')) && (
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest block font-bold">
                    Admin Verification Panel
                  </span>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={task?.verificationStatus === 'Verification In Progress'}
                        onChange={async (e) => {
                          const statusVal = e.target.checked ? 'Verification In Progress' : 'Unverified';
                          await handleVerificationChange(statusVal);
                        }}
                        className="w-4 h-4 text-indigo-650 border-slate-300 dark:border-slate-850 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Verification In Progress</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={task?.verificationStatus === 'Verified'}
                        onChange={async (e) => {
                          const statusVal = e.target.checked ? 'Verified' : 'Unverified';
                          await handleVerificationChange(statusVal);
                        }}
                        className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-850 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Mark as Fully Verified</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

      </div>
    </DashboardLayout>
  )
}

export default ViewTaskDetails


const InfoBox=({label,value})=>{
  return(
    <div className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] md:text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-[12px] md:text-[13px] font-medium text-slate-800 mt-1.5 break-words leading-relaxed">{value || '—'}</p>
    </div>
  )
}


const TodoCheckList=({text,isChecked,onChange})=>{
  return (
    <div className="flex items-center justify-between py-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
      />
      <p className="text-[13px] text-gray-800 ml-3 flex-1">{text}</p>
    </div>
  )
}

const AttachmentRow = ({ name, url, onOpen }) => {
  const resolveLink = (raw) => {
    if (!raw) return '';
    let finalLink = String(raw).trim();
    if (finalLink.startsWith('/')) {
      finalLink = `${BASE_URL}${finalLink}`;
    }
    if (!/^(https?:|blob:|data:)/i.test(finalLink)) {
      finalLink = `https://${finalLink}`;
    }
    return finalLink;
  };

  const href = resolveLink(url);

  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-[13px] text-gray-800 flex-1 truncate" title={name}>{name || 'Attachment'}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 inline-flex items-center justify-center text-indigo-600 hover:text-indigo-700"
          aria-label="Open attachment"
          title="Open attachment"
        >
          <LuSquareArrowOutUpRight className="w-4 h-4" />
        </a>
      ) : (
        <span className="text-[12px] text-slate-400 ml-3">No link</span>
      )}
    </div>
  )
}
