import React, { useEffect, useState, useContext } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import UserCard from '../../components/Cards/UserCard';
import { LuFileSpreadsheet, LuSearch, LuFilter, LuUsers, LuShieldAlert, LuCheck } from 'react-icons/lu';
import Modal from '../../components/Modal';
import DeleteAlert from '../../components/DeleteAlert';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../context/userContext';

const ManageUsers = () => {
  const { user } = useContext(UserContext);
  const [allUsers, setAllUsers] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if (response.data) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  const requestDeleteUser = (userId, name) => {
    setUserPendingDelete({ userId, name });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userPendingDelete) return;
    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(userPendingDelete.userId));
      setAllUsers((prev) => prev.filter((u) => u._id !== userPendingDelete.userId));
      toast.success("User account deleted successfully.");
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error("Failed to delete user account.");
    } finally {
      setDeleteModalOpen(false);
      setUserPendingDelete(null);
    }
  };

  const handlePromoteUser = async (userId, targetRole) => {
    try {
      const confirmAction = window.confirm(`Are you sure you want to change this user's role to ${targetRole.toUpperCase()}?`);
      if (!confirmAction) return;

      const res = await axiosInstance.put(`/api/users/${userId}/role`, { role: targetRole });
      toast.success(res.data.message || "User role updated successfully.");
      getAllUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error(error.response?.data?.message || "Failed to update role.");
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_task_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error("Failed to download report.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    getAllUsers();
    return () => {};
  }, []);

  // Filtered users lists
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || 
                          u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate top bar metrics
  const totalMembersCount = allUsers.length;
  const totalAdminsCount = allUsers.filter(u => u.role === "admin").length;
  const totalAssignedTasks = allUsers.reduce((sum, u) => 
    sum + (Number(u.pendingTasks) || 0) + (Number(u.inProgressTasks) || 0) + (Number(u.completedTasks) || 0), 0
  );

  return (
    <DashboardLayout activeMenu="04">
      <div className="mt-4 mb-10 space-y-6">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-900">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
              Team Members
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              Manage roles, monitor task assignments, and review team performance metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all font-semibold text-xs shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-[0.98]"
          >
            {isDownloading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <LuFileSpreadsheet className="text-sm" />
            )}
            <span>{isDownloading ? 'Exporting…' : 'Export Team Report'}</span>
          </button>
        </div>

        {/* Stats Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-250/70 dark:border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 flex-shrink-0">
              <LuUsers className="text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Members</p>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalMembersCount} Users</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-250/70 dark:border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <LuShieldAlert className="text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Administrators</p>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalAdminsCount} Admins</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-250/70 dark:border-slate-800/85 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
              <LuCheck className="text-lg" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Assignments</p>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalAssignedTasks} Tasks</h3>
            </div>
          </div>
        </div>

        {/* Search and Filters Panel */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3 shadow-md shadow-slate-100/10 dark:shadow-none">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search team members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500/50"
            />
            <LuSearch className="absolute left-3 top-3 text-slate-400 text-sm" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              <LuFilter className="text-xs" /> Filter Role:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full md:w-44 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-250 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="manager">Managers Only</option>
              <option value="member">Members Only</option>
            </select>
          </div>
        </div>

        {/* Grid list of cards */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/25 border border-slate-200 dark:border-slate-800/50 rounded-2xl text-slate-500 text-xs font-semibold">
            No team members matched your search or filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => (
              <UserCard 
                key={u._id} 
                userInfo={u} 
                onDelete={user?.role === "admin" ? requestDeleteUser : null} 
                onPromote={user?.role === "admin" ? handlePromoteUser : null} 
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete User"
        >
          <DeleteAlert
            content={`Are you sure you want to delete ${userPendingDelete?.name || 'this user'}? This action is permanent.`}
            onDelete={confirmDeleteUser}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ManageUsers;
