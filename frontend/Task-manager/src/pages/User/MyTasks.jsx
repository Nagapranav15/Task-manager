import React, { useEffect, useState, useContext } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Cards/TaskCard';
import { UserContext } from '../../context/userContext';

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

  const handleClick = (taskId) => {
    navigate(`/user/task-details/${taskId}`);
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
                onClick={() => handleClick(item._id)}
              />
            ))}
          </div>

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
