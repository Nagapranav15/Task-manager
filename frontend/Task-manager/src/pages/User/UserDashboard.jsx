import React, { useContext, useEffect, useState } from 'react'
import useUserAuth from '../../hooks/useUserAuth'
import { UserContext } from '../../context/userContext'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import API_PATHS from '../../utils/apiPaths'
import moment from 'moment'
import { addThousandsSeparator } from '../../utils/helper'
import InfoCard from '../../components/Cards/InfoCard'
import { LuArrowRight } from 'react-icons/lu'
import TaskListTable from '../../components/TaskListTable'
import CustomPieChart from '../../components/Charts/CustomPieChart'
import CustomBarChart from '../../components/Charts/CustomBarChart'
import RecentActivities from '../../components/Cards/RecentActivities'

const COLORS = ["#f59e0b", "#06b6d4", "#10b981", "#f43f5e"]; // Pending (Amber), In Progress (Cyan), Completed (Emerald), Blocked (Rose)

const HeaderClock = ({ name }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-2 border-b border-slate-200 dark:border-slate-900">
      <div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>{greeting},</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400 font-extrabold">{name}</span>
        </h2>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-semibold">Here is an overview of your assigned tasks today.</p>
      </div>
      <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-inner max-w-fit">
        <span>{moment(now).format('ddd, D MMM YYYY')}</span>
        <span className="text-slate-400 dark:text-slate-700">•</span>
        <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{moment(now).format('hh:mm:ss A')}</span>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  useUserAuth()

  const { user, refreshTick } = useContext(UserContext);
  
  const navigate=useNavigate();

  const[dashboardData, setDashboardData]=useState(null);
  const [pieChartData, setPieChartData]=useState([]);
  const [barChartData, setBarChartData]=useState([]);

  //Prepare chart Data
  const prepareChartData=(data)=>{
    const taskDistribution = data?.taskDistribution || {};
    const taskPriorityLevels = data?.taskPriorityLevels || {};

    const taskDistributionData = [
      { status: "Pending", count: Number(taskDistribution?.Pending || 0) },
      { status: "In Progress", count: Number(taskDistribution?.["In Progress"] || taskDistribution?.InProgress || taskDistribution?.["In-Progress"] || 0) },
      { status: "Completed", count: Number(taskDistribution?.Completed || 0) },
      { status: "Blocked", count: Number(taskDistribution?.Blocked || 0) },
    ];

    const PriorityLevelsData = [
      { priority: "Low", count: Number(taskPriorityLevels?.Low || 0) },
      { priority: "Medium", count: Number(taskPriorityLevels?.Medium || 0) },
      { priority: "High", count: Number(taskPriorityLevels?.High || 0) },
    ];

    setPieChartData(taskDistributionData);
    setBarChartData(PriorityLevelsData);    
  };

  const getDashboardData=async()=>
  {
    try{
      const response=await axiosInstance.get(API_PATHS.TASKS.GET_USER_DASHBOARD_DATA);

      if(response.data)
      {
        setDashboardData(response.data);
        prepareChartData(response.data.charts || null);
      }
    }
    catch(error)
    {
      console.error("Error fetching user dashboard:",error);
    }
  };

  const onSeeMore=()=>
  {
    navigate('/user/my-tasks');
  }

  useEffect(()=>{
    getDashboardData();
    const interval = setInterval(getDashboardData, 5000);
    return () => clearInterval(interval);
  },[refreshTick]);

  return (
    <DashboardLayout activeMenu="01">
      <div className="mb-6">
        <HeaderClock name={user?.name} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard
          label="Total Tasks"
          value={addThousandsSeparator(dashboardData?.charts?.taskDistribution?.All || 0)}
          color="bg-slate-500"
        />
        <InfoCard
          label="Pending Tasks"
          value={addThousandsSeparator(dashboardData?.charts?.taskDistribution?.Pending || 0)}
          color="bg-indigo-500"
        />
        <InfoCard
          label="In-Progress"
          value={addThousandsSeparator(dashboardData?.charts?.taskDistribution?.InProgress || 0)}
          color="bg-cyan-500"
        />
        <InfoCard
          label="Completed Tasks"
          value={addThousandsSeparator(dashboardData?.charts?.taskDistribution?.Completed || 0)}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Task Distribution</h5>
          <CustomPieChart data={pieChartData} colors={COLORS} />
        </div>

        <div className="card">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Task Priority Levels</h5>
          <CustomBarChart data={barChartData} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Tasks</h5>
          <button className="card-btn" onClick={onSeeMore}>
            View All My Tasks <LuArrowRight className="text-sm" />
          </button>
        </div>
        <TaskListTable tableData={dashboardData?.recentTasks || []} />
      </div>
    </DashboardLayout>
  )
};

export default UserDashboard;

