import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { LuFileSpreadsheet } from 'react-icons/lu';
import TaskStatusTabs from '../../components/TaskStatusTabs';
import TaskCard from '../../components/Cards/TaskCard';

const ManageTasks = () => {
  const [allTasks,setAllTasks]=useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const [tabs,setTabs]=useState([]);

  const [filterStatus,setFilterStatus]=useState("All");

  const navigate=useNavigate();

  const getAllTasks=async()=>{
    try {
      const response=await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS,{
        params:{
          status: filterStatus==="All"?"":filterStatus,
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

  const handleClick=(taskData)=>{navigate("/admin/create-task",{state:{taskId:taskData?._id}})};

  //Download task report
  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading tasks report:', error);
    } finally {
      setIsDownloading(false);
    }
  }

  useEffect(()=>{
    getAllTasks(filterStatus);
    return ()=>{};
  },[filterStatus]);
  return (
    
      <DashboardLayout activeMenu="02">
          <div className='my-5'>
            <div className='flex flex-col lg:flex-row lg:items-center justify-between'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className="text-xl md:text-xl font-medium">Manage tasks</h2>
                
              </div>
              {tabs?.[0]?.count >= 0 && (
                <div className='flex items-center gap-3'>
                  <TaskStatusTabs
                  tabs={tabs}
                  activeTab={filterStatus}
                  setActiveTab={setFilterStatus}
                  />
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    aria-live="polite"
                  >
                    {isDownloading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    ) : (
                      <LuFileSpreadsheet className="text-base" />
                    )}
                    <span className="text-sm font-medium">{isDownloading ? 'Downloading…' : 'Download Report'}</span>
                  </button>
                </div>
              )

              }
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
                onClick={()=>handleClick(item)}
                />
              ))}
            </div>
          </div>
      </DashboardLayout>
    
  )
}

export default ManageTasks
