import React, { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import { UserContext } from '../../context/userContext';
import { LuTrash2, LuX } from 'react-icons/lu';
import SelectDropdown from '../Inputs/SelectDropdown';
import { PRIORITY_DATA } from '../../utils/data';
import SelectUsers from '../Inputs/SelectUsers';
import TodoListInput from '../Inputs/TodoListInput';
import AddAttachmentsInput from '../Inputs/AddAttachmentsInput';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { toast } from 'react-hot-toast';
import DeleteAlert from '../DeleteAlert';

const TaskFormModal = ({ isOpen, onClose, taskId, onSave }) => {
  const { user } = useContext(UserContext);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    dueDate: null,
    assignedTo: [],
    todoCheckList: [],
    attachments: [],
  });
  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState(null);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const clearData = () => {
    setTaskData({
      title: '',
      description: '',
      priority: 'Low',
      dueDate: null,
      assignedTo: [],
      todoCheckList: [],
      attachments: [],
    });
    setCurrentTask(null);
    setError(null);
  };

  const getTaskDetailsByID = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));
      if (response.status) {
        const taskInfo = response.data;
        setCurrentTask(taskInfo);
        setTaskData({
          title: taskInfo.title || '',
          description: taskInfo.description || '',
          priority: (taskInfo.priority || 'Low').toLowerCase(),
          dueDate: taskInfo.dueDate ? moment(taskInfo.dueDate).format('YYYY-MM-DD') : null,
          assignedTo: taskInfo?.assignedTo?.map((item) => item?._id || item) || [],
          todoCheckList: taskInfo?.todochecklist?.map((item) => item?.text) || [],
          attachments: taskInfo.attachments || [],
        });
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (taskId) {
        getTaskDetailsByID();
      } else {
        clearData();
      }
    }
  }, [taskId, isOpen]);

  const createTask = async () => {
    setCurrentLoading(true);
    try {
      const todoList = taskData.todoCheckList?.map((item) => ({
        text: item,
        completed: false,
      }));
      const priorityMap = { low: 'Low', medium: 'Medium', high: 'High' };
      const priority = priorityMap[taskData.priority] || taskData.priority;
      const dueDateIso = (taskData.dueDate && !isNaN(new Date(taskData.dueDate).getTime()))
        ? new Date(taskData.dueDate).toISOString()
        : new Date().toISOString();
      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        priority,
        dueDate: dueDateIso,
        todoCheckList: todoList,
      });
      toast.success('Task created successfully.');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task.');
    } finally {
      setCurrentLoading(false);
    }
  };

  const updateTask = async () => {
    setCurrentLoading(true);
    try {
      const todoList = taskData.todoCheckList?.map((item) => {
        const prevTodoCheckList = currentTask?.todochecklist || [];
        const matchedTask = prevTodoCheckList.find((task) => task.text === item);
        return {
          text: item,
          completed: matchedTask?.completed || false,
        };
      });
      const priorityMap = { low: 'Low', medium: 'Medium', high: 'High' };
      const priority = priorityMap[taskData.priority] || taskData.priority;
      const dueDateIso = (taskData.dueDate && !isNaN(new Date(taskData.dueDate).getTime()))
        ? new Date(taskData.dueDate).toISOString()
        : new Date().toISOString();
      await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), {
        ...taskData,
        priority,
        dueDate: dueDateIso,
        todoCheckList: todoList,
      });
      toast.success('Task updated successfully.');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.response?.data?.message || 'Failed to update task.');
    } finally {
      setCurrentLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!taskData.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!taskData.description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!taskData.dueDate) {
      setError('Due Date is required.');
      return;
    }
    if (!taskData.assignedTo || taskData.assignedTo.length === 0) {
      setError('Assigned To is required.');
      return;
    }
    if (!taskData.todoCheckList || taskData.todoCheckList.length === 0) {
      setError('Todo Check List is required.');
      return;
    }

    if (taskId) {
      updateTask();
    } else {
      createTask();
    }
  };

  const deleteTask = async () => {
    try {
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
      setOpenDeleteAlert(false);
      toast.success('Task deleted successfully.');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
            {taskId ? 'Update Task' : 'Create Task'}
          </h3>
          <div className="flex items-center gap-3">
            {taskId && (
              <button
                type="button"
                onClick={() => setOpenDeleteAlert(true)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 border border-rose-500/20 rounded-xl transition-all cursor-pointer animate-in duration-200"
              >
                <LuTrash2 className="text-sm" /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 dark:text-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Task Title
            </label>
            <input
              placeholder="Create App UI"
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-slate-50/50 dark:bg-slate-950/20"
              value={taskData.title}
              onChange={({ target }) => handleValueChange('title', target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Description
            </label>
            <textarea
              placeholder="Describe Task"
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-slate-50/50 dark:bg-slate-950/20"
              rows={4}
              value={taskData.description}
              onChange={({ target }) => handleValueChange('description', target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Priority
              </label>
              <SelectDropdown
                options={PRIORITY_DATA}
                value={taskData.priority}
                onChange={({ value }) => handleValueChange('priority', value)}
                placeholder="Select Priority"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Due Date
              </label>
              <input
                type="date"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                value={taskData.dueDate || ''}
                onChange={({ target }) => handleValueChange('dueDate', target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Assigned To
              </label>
              <SelectUsers
                selectedUsers={taskData.assignedTo}
                setSelectedUsers={(value) => handleValueChange('assignedTo', value)}
                placeholder="Select Users"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Todo Check List
            </label>
            <TodoListInput
              todoList={taskData.todoCheckList}
              setTodoList={(value) => handleValueChange('todoCheckList', value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Add Attachments
            </label>
            <AddAttachmentsInput
              attachments={taskData.attachments}
              setAttachments={(value) => handleValueChange('attachments', value)}
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-500 mt-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-750 disabled:opacity-60 rounded-xl transition-all cursor-pointer"
            onClick={handleSubmit}
            disabled={currentLoading}
          >
            {taskId ? 'UPDATE TASK' : 'CREATE TASK'}
          </button>
        </div>
      </div>

      {/* Delete Alert Modal */}
      {openDeleteAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <DeleteAlert
              content="Are you sure you want to delete this task?"
              onDelete={deleteTask}
              onClose={() => setOpenDeleteAlert(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFormModal;
