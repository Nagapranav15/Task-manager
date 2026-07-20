import React, { useEffect, useState } from 'react'
import moment from 'moment'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useLocation, useNavigate } from 'react-router-dom'
import { LuTrash, LuTrash2 } from 'react-icons/lu'
import SelectDropdown from '../../components/Inputs/SelectDropdown'
import { PRIORITY_DATA } from '../../utils/data'
import SelectUsers from '../../components/Inputs/SelectUsers'
import TodoListInput from '../../components/Inputs/TodoListInput'
import AddAttachmentsInput from '../../components/Inputs/AddAttachmentsInput'
import axiosInstance from '../../utils/axiosInstance'
import API_PATHS from '../../utils/apiPaths'
import { toast } from 'react-hot-toast'
import Modal from '../../components/Modal'
import DeleteAlert from '../../components/DeleteAlert'

const CreateTask = () => {

  const location = useLocation();
  const {taskId}=location.state || {};
  const navigate=useNavigate();

  const[taskData,setTaskData]=useState(
    {
      title:"",
      description:"",
      priority:"Low",
      dueDate:null,
      assignedTo:[],
      todoCheckList:[],
      attachments:[],
    });
    const [currentTask, setCurrentTask]=useState(null);

    const [error, setError] = useState(null);

    const[loading,setLoading]=useState(false);

    const[openDeleteAlert,setOpenDeleteAlert]=useState(false);

    const handleValueChange=(key,value)=>
    {
      setTaskData((prevData)=>({
        ...prevData,
        [key]:value,
      }));
    };

    const clearData=()=>{
      setTaskData({
        title:"",
        description:"",
        priority:"Low",
        dueDate:null,
        assignedTo:[],
        todoCheckList:[],
        attachments:[],
      });
    };


    const createTask = async()=>{
      setLoading(true);
      try {
        const todoList = taskData.todoCheckList?.map((item)=>({
          text:item,
          completed:false
          
        }));
        const priorityMap = { low: 'Low', medium: 'Medium', high: 'High' };
        const priority = priorityMap[taskData.priority] || taskData.priority;
        const dueDateIso = (taskData.dueDate && !isNaN(new Date(taskData.dueDate).getTime()))
          ? new Date(taskData.dueDate).toISOString()
          : new Date().toISOString();
        const response=await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK,{
          ...taskData,
          priority,
          dueDate: dueDateIso,
          todoCheckList:todoList,
        });
        toast.success("Task created successfully.");
        clearData();
      } catch (error) {
        console.error("Error creating task:",error);
        setLoading(false);
      }finally{
        setLoading(false);
      }
    };

    const updateTask = async()=>{
      setLoading(true);
      try {
        const todoList = taskData.todoCheckList?.map((item)=>{
          const prevTodoCheckList = currentTask?.todochecklist || [];
          const matchedTask = prevTodoCheckList.find((task)=>task.text===item);
          return{
            text:item,
            completed:matchedTask?.completed||false,
          }
          
        });
        const priorityMap = { low: 'Low', medium: 'Medium', high: 'High' };
        const priority = priorityMap[taskData.priority] || taskData.priority;
        const updateDueDateIso = (taskData.dueDate && !isNaN(new Date(taskData.dueDate).getTime()))
          ? new Date(taskData.dueDate).toISOString()
          : new Date().toISOString();
        const response=await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId),{
          ...taskData,
          priority,
          dueDate: updateDueDateIso, 
          todoCheckList:todoList,
        });
        toast.success("Task updated successfully.");
      } catch (error) {
        console.error("Error updating task:",error);
        setLoading(false);
      }finally{
        setLoading(false);
      }
    };

    const handleSubmit = async()=>{
      setError(null);

      if(!taskData.title.trim()){
        setError("Title is required.");
        return;
      }
      if (!taskData.description.trim()) {
        setError("Description is required.");
        return;
      }
      if (!taskData.dueDate) {
        setError("Due Date is required.");
        return;
      }
      if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
        setError("Assigned To is required.");
        return;
      }
      if (!taskData.todoCheckList || taskData.todoCheckList.length === 0) {
        setError("Todo Check List is required.");
        return;
      }
      if(taskId)
      {
        updateTask();
        return;
      }
      createTask();
    };

    const getTaskDetailsByID = async()=>{
      try{
        const response=await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));
        if(response.status){
          const taskInfo=response.data;
          setCurrentTask(taskInfo);

          setTaskData((prevState)=>({
            title:taskInfo.title,
            description:taskInfo.description,
            priority:(taskInfo.priority || '').toLowerCase(),
            dueDate:taskInfo.dueDate
              ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
              : null,
            assignedTo:taskInfo?.assignedTo?.map((item)=>item?._id) || [],
            // Map backend todochecklist objects to a simple string list for editor
            todoCheckList:taskInfo?.todochecklist?.map((item)=>item?.text) || [],
            attachments:taskInfo.attachments,
          }));
        }
        
      }
      catch(error){
        console.error("Error fetching task details:",error);
      }
    };

    const deleteTask = async()=>{
      try{
        await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
        setOpenDeleteAlert(false);
        toast.success("Task deleted successfully.");
        navigate("/admin/tasks");
      }catch(error){
        console.error("Error deleting task:",error);
      }
    };

    useEffect(()=>{
      if(taskId)
      {
        getTaskDetailsByID();
      }
    },[taskId]);


  return (
    <DashboardLayout activeMenu="03">
      <div className="my-6 max-w-4xl mx-auto">
        {/* Header Title */}
        <div className="pb-5 border-b border-slate-200 dark:border-slate-800 mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-widest">
              Task Creator
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-1.5 flex items-center gap-2">
              {taskId ? "Update Assigned Task" : "Create New Task"}
            </h2>
          </div>
          {taskId && (
            <button 
              onClick={() => setOpenDeleteAlert(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 border border-rose-500/20 rounded-xl cursor-pointer transition-all duration-200"
            >
              <LuTrash2 className="text-sm" /> Delete Task
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xl shadow-slate-100/10 dark:shadow-slate-950/20 space-y-6">
          
          {/* Task Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Task Title
            </label>
            <input 
              placeholder="Create App UI mockups..."
              className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={taskData?.title}
              onChange={({ target }) => handleValueChange("title", target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe the goals and instructions for this task..."
              className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              rows={4}
              value={taskData.description}
              onChange={({ target }) => handleValueChange("description", target.value)}
            />
          </div>

          {/* Priority, Due Date, Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Priority Level
              </label>
              <SelectDropdown
                options={PRIORITY_DATA}
                value={taskData.priority}
                onChange={({ value }) => handleValueChange("priority", value)}
                placeholder="Select Priority"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                value={taskData.dueDate || ""}
                onChange={({ target }) => handleValueChange("dueDate", target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Assignees
              </label>
              <SelectUsers
                selectedUsers={taskData.assignedTo}
                setSelectedUsers={(value) => handleValueChange("assignedTo", value)}
                placeholder="Select Users"
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Todo Checklist
            </label>
            <TodoListInput
              todoList={taskData?.todoCheckList}
              setTodoList={(value) => handleValueChange("todoCheckList", value)}
            />
          </div>

          {/* Attachments */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Attachments
            </label>
            <AddAttachmentsInput
              attachments={taskData.attachments}
              setAttachments={(value) => handleValueChange("attachments", value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/60">
            <button
              onClick={() => navigate(user?.role === 'manager' ? "/manager/tasks" : "/admin/tasks")}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 disabled:opacity-60 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {taskId ? "UPDATE TASK" : "CREATE TASK"}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure you want to delete this task?"
          onDelete={deleteTask}
          onClose={() => setOpenDeleteAlert(false)}
        />
      </Modal>
    </DashboardLayout>
  )
}

export default CreateTask;
