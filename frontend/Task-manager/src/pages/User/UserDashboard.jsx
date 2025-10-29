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

const COLORS=["#8D51FF","#00B8DB","#7BCE00"];

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
    <>
      <h2 className="text-xl md:text-2xl">{greeting} {name}</h2>
      <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
        {moment(now).format('dddd Do MMM YYYY')} · {moment(now).format('hh:mm:ss A')}
      </p>
    </>
  );
};

const UserDashboard = () => {
  useUserAuth()

  const {user}=useContext(UserContext);
  
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
      { status: "In-Progress", count: Number(taskDistribution?.["In Progress"] || 0) },
      { status: "Completed", count: Number(taskDistribution?.Completed || 0) },
    ];

    setPieChartData(taskDistributionData);

    const PriorityLevelData = [
      { priority:"Low",    count: Number(taskPriorityLevels?.Low    || 0) },
      { priority:"Medium", count: Number(taskPriorityLevels?.Medium || 0) },
      { priority:"High",   count: Number(taskPriorityLevels?.High   || 0) },
    ];
    setBarChartData(PriorityLevelData);    
  };

  const getDashboardData=async()=>
  {
    try{
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );
      if(response.status)
      {
        setDashboardData(response.data);
        prepareChartData(response.data.charts || null);
      }
    }
    catch(error)
    {
      console.error("Error fetching users:",error);
    }
  };

  const onSeeMore=()=>
  {
    
    navigate('/admin/dashboard');
  }

  useEffect(()=>{
    getDashboardData();
    return ()=>{};
  },[]);

  return <DashboardLayout activeMenu="01">
    <div className="card my-5">
      <div>
        <div className="col-span-3">
        <HeaderClock name={user?.name} />
        </div>
      </div>


    

    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
    <InfoCard
        label="Total Tasks"
        value={addThousandsSeparator(
        dashboardData?.charts?.taskDistribution?.All || 0
      )}
    color="bg-gray-500"
    />

    <InfoCard
        label="Pending Tasks"
        value={addThousandsSeparator(
        dashboardData?.charts?.taskDistribution?.Pending || 0
      )}
    color="bg-violet-500"
    />
    <InfoCard
        label="In-Progress Tasks"
        value={addThousandsSeparator(
        dashboardData?.charts?.taskDistribution?.InProgress || 0
      )}
    color="bg-cyan-500"
    />
    <InfoCard
        label="Completed Tasks"
        value={addThousandsSeparator(
        dashboardData?.charts?.taskDistribution?.Completed || 0
      )}
    color="bg-green-500"
    />
    </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
      
      <div>
        <div className="card min-h-[20rem]">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Task Distribution</h5>
            </div>
            <CustomPieChart
            data={pieChartData}
            colors={COLORS}
            />
        </div>
      </div>


      <div>
        <div className="card min-h-[20rem]">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Task Priority Levels</h5>
            </div>
            <CustomBarChart
            data={barChartData}
            
            />
        </div>
      </div>


      <div className="md:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h5 className="text-lg">Recent Tasks</h5>
            <button className="card-btn" onClick={onSeeMore}>
              View All <LuArrowRight className="text-base"/>
              </button>
          </div>
          <TaskListTable tableData={dashboardData?.recentTasks ||[]} />
          <div>
          </div>
        </div>
        
      </div>
      <div>
        
      </div>
    </div>
    

  </DashboardLayout>
  
};
export default UserDashboard
