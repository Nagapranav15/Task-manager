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
        const response=await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK,{
          ...taskData,
          priority,
          dueDate: new Date(taskData.dueDate).toISOString(),
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
        const response=await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId),{
          ...taskData,
          priority,
          dueDate:new Date(taskData.dueDate).toISOString(), 
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
      <div className="mt-5">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-xl font-medium">
                {taskId ? "Update Task" : "Create Task"}
              </h2>

              {taskId && (
                <button className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border border-rose-100 hover:border-rose-300 cursor pointer"
                onClick={()=>setOpenDeleteAlert(true)}
                >
                  <LuTrash2 className="text-base"/> Delete

                </button>
              )}
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">
                Task Title
              </label>
              <input 
              placeholder="Create App UI"
              className="form-input"
              value={taskData?.title}
              onChange={({ target }) => handleValueChange("title", target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
              placeholder="Describe Task"
              className="form-input"
              rows={4}
              value={taskData.description}
              onChange={({target})=>handleValueChange("description", target.value)}
              />
            </div>

            <div className="grid grid-cols-12 gap-4 mt-2">
              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Priority
                </label>
                <SelectDropdown
                options={PRIORITY_DATA}
                value={taskData.priority}
                onChange={({value})=>handleValueChange("priority",value)}
                placeholder="Select Priority"
                />
              </div>
              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Due Date
                </label>
                <input
                type="date"
                placeholder="Select Due Date"
                className="form-input"
                value={taskData.dueDate || ""}
                onChange={({target})=>handleValueChange("dueDate",target.value)}
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-600">
                  Assigned To
                </label>

                <SelectUsers
                selectedUsers={taskData.assignedTo}
                setSelectedUsers={(value)=>{
                  handleValueChange("assignedTo",value);
                }}
                placeholder="Select Users"
                />
              </div>
              
              
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Todo Check List
              </label>
              <TodoListInput
              todoList={taskData?.todoCheckList}
              setTodoList={(value)=>handleValueChange("todoCheckList",value)}
              />
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Add Attachments
              </label>

              <AddAttachmentsInput
              attachments={taskData.attachments}
              setAttachments={(value)=>handleValueChange("attachments",value)}
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 mt-5">{error}</p>
            )}
            <div className="flex justify-end mt-7">
              <button
              className="add-btn"
              onClick={handleSubmit}
              disabled={loading}
              >
                {taskId ? "UPDATE TASK" : "CREATE TASK"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
      isOpen={openDeleteAlert}
      onClose={()=>setOpenDeleteAlert(false)}
      title="Delete Task"
      >
        <DeleteAlert
        content="Are you sure you want to delete this task?"
        
        
        onDelete={deleteTask}
        />

      </Modal>





    </DashboardLayout>
  )
}

export default CreateTask;
