import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Cards/TaskCard';

const MyTasks = () => {
  
  const [allTasks,setAllTasks]=useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const [tabs,setTabs]=useState([]);

  const [filterStatus,setFilterStatus]=useState("All");

  const navigate=useNavigate();

  const getAllTasks=async()=>{
    try {
      const response=await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS,{
        params:{
          status: filterStatus === "All" ? "" : (filterStatus === "In-Progress" ? "In Progress" : filterStatus),
        },
        
      });
        setAllTasks(response.data?.tasks?.length>0?response.data.tasks:[]);

        const statusSummary=response.data?.statusSummary;
        
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

  const handleClick=(taskId)=>{navigate(`/user/task-details/${taskId}`)};


  useEffect(()=>{
    getAllTasks(filterStatus);
    return ()=>{};
  },[filterStatus]);

  // Refresh tasks when tab/window regains focus or becomes visible
  useEffect(()=>{
    const handleFocus = () => getAllTasks(filterStatus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        getAllTasks(filterStatus);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [filterStatus]);
  return (
    
      <DashboardLayout activeMenu="02">
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
              {allTasks?.map((item,index)=>(
                <TaskCard
                key={item._id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                dueDate={item.dueDate}
                assignedTo={item.assignedTo?.map((items)=>items.profileImageUrl)}
                attachmentcount={item.attachments?.length || 0}
                completedTodoCount={item.completedTodoCount||0}
                todoCheckList={item.todochecklist||[]}
                onClick={()=>handleClick(item._id)}
                />
              ))}
            </div>
          </div>
      </DashboardLayout>

  )
}

export default MyTasks
