import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { BASE_URL } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import moment from 'moment';
import AvatarGroup from '../../components/AvatarGroup';
import { LuSquareArrowOutUpRight } from 'react-icons/lu';
 

const ViewTaskDetails = () => {
  const{id}=useParams();
  const [task,setTask]=useState (null);
  
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
        {task ? (
          <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
            <div className="form-card col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-xl font-medium">{task?.title}</h2>
                <div className={`text-[13px] font-medium ${getStatusTagColor(task?.status)} px-4 py-0.5 rounded`}>{task?.status}</div>
              </div>
              <div className="mt-4">
                <InfoBox label="Description" value={task?.description} />
              </div>
              <div className="mt-4">
                <InfoBox label="Priority" value={task?.priority} />
                <div className="h-3"></div>
                <InfoBox label="Due Date" value={task?.dueDate ? moment(task?.dueDate).format("DD MMM YYYY") : "N/A"} />
                <div className="flex items-center justify-between">
                  <label className="">Assigned To</label>
                  <AvatarGroup
                    avatars={task?.assignedTo?.map((item) => item?.profileImageUrl || [])}
                    maxVisible={5}
                  />
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
