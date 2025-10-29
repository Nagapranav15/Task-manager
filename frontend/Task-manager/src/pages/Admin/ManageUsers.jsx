import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import UserCard from '../../components/Cards/UserCard';
import { LuFileSpreadsheet } from 'react-icons/lu';
import Modal from '../../components/Modal';
import DeleteAlert from '../../components/DeleteAlert';

const ManageUsers = () => {
  const [allUsers,setAllUsers]=useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState(null);

  const getAllUsers=async()=>{
    try {
      const response=await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if(response.data?.length>0)
      {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:",error);
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
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleteModalOpen(false);
      setUserPendingDelete(null);
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
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(()=>{
    getAllUsers();

    return ()=>{};
  },[]);

  return (
    <DashboardLayout activeMenu="04">

      <div className="mt-5 mb-10">
        <div className="flex md:flex-row md:items-center justify-between">
          <h2 className=" text-xl md:text-xl font-medium">Team Members</h2>
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
            <span className="text-sm font-medium">{isDownloading ? 'Downloading…' : 'Download'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {allUsers.map((user) => (
            <UserCard key={user._id} userInfo={user} onDelete={requestDeleteUser} />
          ))}
        </div>

        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete User"
        >
          <DeleteAlert
            content={`Are you sure you want to delete ${userPendingDelete?.name || 'this user'}?`}
            onDelete={confirmDeleteUser}
          />
        </Modal>
      </div>
    </DashboardLayout>
  )
}

export default ManageUsers
