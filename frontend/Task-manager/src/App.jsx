import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './routes/PrivateRoute';
import './index.css';
import UserProvider from './context/userContext';
import { Toaster } from 'react-hot-toast';

const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/SignUp'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const ManageTasks = lazy(() => import('./pages/Admin/ManageTasks'));
const CreateTask = lazy(() => import('./pages/Admin/CreateTask'));
const ManageUsers = lazy(() => import('./pages/Admin/ManageUsers'));
const UserDashboard = lazy(() => import('./pages/User/UserDashboard'));
const MyTasks = lazy(() => import('./pages/User/MyTasks'));
const ViewTaskDetails = lazy(() => import('./pages/User/ViewTaskDetails'));
const Attendance = lazy(() => import('./pages/User/Attendance'));
const ManageAttendance = lazy(() => import('./pages/Admin/ManageAttendance'));
const ProfileSettings = lazy(() => import('./pages/User/ProfileSettings'));
const Chat = lazy(() => import('./pages/User/Chat'));
const Meetings = lazy(() => import('./pages/User/Meetings'));
const LeaveManagement = lazy(() => import('./pages/User/LeaveManagement'));
const HolidayCalendar = lazy(() => import('./pages/User/HolidayCalendar'));

const LoadingOverlay = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070a13] text-slate-400">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Loading Workspace...</span>
    </div>
  </div>
);

const MobileBlocker = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070a13] px-6 text-center">
    <div className="max-w-md w-full bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-8 rounded-3xl shadow-xl flex flex-col items-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 text-3xl animate-bounce">
        💻
      </div>
      <div>
        <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Desktop Only Access</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3.5 leading-relaxed font-semibold">
          For security reasons and to ensure an optimal experience, the Task Manager dashboard is restricted to desktop and laptop devices. Please log in from a computer.
        </p>
      </div>
    </div>
  </div>
);

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return <MobileBlocker />;
  }

  return (
    <UserProvider>
    <div>
    <Router>
      <Suspense fallback={<LoadingOverlay />}>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace/>} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/attendance" element={<ManageAttendance />} />
            <Route path="/admin/clock-in-out" element={<Attendance />} />
            <Route path="/admin/profile" element={<ProfileSettings />} />
            <Route path="/admin/chat" element={<Chat />} />
            <Route path="/admin/meetings" element={<Meetings />} />
            <Route path="/admin/leaves" element={<LeaveManagement />} />
            <Route path="/admin/holidays" element={<HolidayCalendar />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<PrivateRoute allowedRoles={['manager']} />}>
            <Route path="/manager/dashboard" element={<Dashboard />} />
            <Route path="/manager/tasks" element={<ManageTasks />} />
            <Route path="/manager/my-tasks" element={<MyTasks />} />
            <Route path="/manager/create-task" element={<CreateTask />} />
            <Route path="/manager/users" element={<ManageUsers />} />
            <Route path="/manager/attendance" element={<Attendance />} />
            <Route path="/manager/profile" element={<ProfileSettings />} />
            <Route path="/manager/chat" element={<Chat />} />
            <Route path="/manager/meetings" element={<Meetings />} />
            <Route path="/manager/leaves" element={<LeaveManagement />} />
            <Route path="/manager/holidays" element={<HolidayCalendar />} />
          </Route>

          {/* User Routes */}
          <Route element={<PrivateRoute allowedRoles={['member']} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/my-tasks" element={<MyTasks />} />
            <Route path="/user/attendance" element={<Attendance />} />
            <Route path="/user/profile" element={<ProfileSettings />} />
            <Route path="/user/chat" element={<Chat />} />
            <Route path="/user/meetings" element={<Meetings />} />
            <Route path="/user/leaves" element={<LeaveManagement />} />
            <Route path="/user/holidays" element={<HolidayCalendar />} />
          </Route>

          {/* Shared Authenticated Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'manager', 'member']} />}>
            <Route path="/task-details/:id" element={<ViewTaskDetails />} />
          </Route>
          
        </Routes>
      </Suspense>
    </Router>
    </div>
    <Toaster
    toastOptions={{
      className:"",
      style:{
        fontSize:"13px",
      }
    }}
    />
    </UserProvider>
  )
}

export default App;


