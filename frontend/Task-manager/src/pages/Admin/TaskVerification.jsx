import React, { useEffect, useState, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS, getSecureUrl } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import { toast } from 'react-hot-toast';
import { LuShieldCheck, LuShieldAlert, LuSearch, LuCalendar, LuUser, LuClock, LuCheck, LuX } from 'react-icons/lu';

const TaskVerification = () => {
  const { user } = useContext(UserContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerification, setFilterVerification] = useState('All');
  const [selectedTaskForVerify, setSelectedTaskForVerify] = useState(null);
  const [checklistVerification, setChecklistVerification] = useState({});
  const navigate = useNavigate();

  const openVerificationModal = (task) => {
    setSelectedTaskForVerify(task);
    const initialChecklist = {};
    if (task.todochecklist) {
      task.todochecklist.forEach(item => {
        initialChecklist[item._id || item.id] = false;
      });
    }
    setChecklistVerification(initialChecklist);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.TASKS.GET_VERIFICATION_TASKS);
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks for verification:', error);
      toast.error('Failed to load tasks for verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleVerificationUpdate = async (taskId, newStatus) => {
    try {
      const res = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK_STATUS(taskId),
        { verificationStatus: newStatus }
      );
      if (res?.data?.task) {
        toast.success(`Task verification status updated to: ${newStatus}`);
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update verification status:', error);
      toast.error(error.response?.data?.message || 'Failed to update verification status');
    }
  };

  // Filter and search logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const vStatus = task.verificationStatus || 'Unverified';
    const matchesVerification = 
      filterVerification === 'All' || 
      vStatus === filterVerification;

    return matchesSearch && matchesVerification;
  });

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
            <LuShieldCheck className="text-sm" /> Verified
          </span>
        );
      case 'Verification In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse shadow-sm shadow-amber-500/5">
            <LuClock className="text-sm" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
            <LuShieldAlert className="text-sm" /> Unverified
          </span>
        );
    }
  };

  return (
    <DashboardLayout activeMenu="verifications">
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0c1222]/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Task Verification Control
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              {user?.role === 'admin' 
                ? 'Review and verify all completed tasks in the system.' 
                : 'Review and verify completed tasks assigned/created by you.'
              }
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {['All', 'Verified', 'Verification In Progress', 'Unverified'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterVerification(opt)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  filterVerification === opt
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt === 'Verification In Progress' ? 'In Progress' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <LuSearch className="absolute left-4 top-3.5 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search completed tasks by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0c1222]/20 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 transition-all shadow-sm"
          />
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">Loading Tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#0c1222]/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto text-2xl mb-4">
              🎉
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">No Completed Tasks Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
              There are no completed tasks matching your current search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTasks.map((task) => {
              const formattedDate = new Date(task.updatedAt || task.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
              });

              return (
                <div 
                  key={task._id} 
                  className="bg-white dark:bg-[#0c1222]/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-4">
                    {/* Badge and Title */}
                    <div className="flex items-center justify-between gap-3">
                      {getVerificationBadge(task.verificationStatus)}
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <LuCalendar /> Completed on {formattedDate}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed font-medium">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Assigned Members */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Team:</span>
                      <div className="flex items-center gap-2">
                        {task.assignedTo && task.assignedTo.length > 0 ? (
                          task.assignedTo.map((member) => (
                            <div key={member._id} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                              {member.profileImageUrl ? (
                                <img
                                  src={getSecureUrl(member.profileImageUrl)}
                                  alt={member.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {member.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No assignees</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-900">
                    <button
                      onClick={() => navigate(user?.role === 'manager' ? `/manager/tasks/${task._id}` : `/admin/tasks/${task._id}`)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl transition-all cursor-pointer mr-auto"
                    >
                      View Details
                    </button>

                    {task.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => openVerificationModal(task)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <LuCheck className="text-sm" /> Verify
                      </button>
                    )}

                    {task.verificationStatus !== 'Verification In Progress' && (
                      <button
                        onClick={() => handleVerificationUpdate(task._id, 'Verification In Progress')}
                        className="px-3.5 py-2 text-xs font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-550/15 border border-amber-500/20 rounded-xl transition-all cursor-pointer"
                      >
                        In Progress
                      </button>
                    )}

                    {task.verificationStatus && task.verificationStatus !== 'Unverified' && (
                      <button
                        onClick={() => handleVerificationUpdate(task._id, 'Unverified')}
                        className="px-3.5 py-2 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-550/15 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Checklist Verification Modal */}
      {selectedTaskForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <LuShieldCheck className="text-emerald-500 text-xl" />
                Verify Checklist Items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                Please manually review and tick each checkbox to confirm that the sub-tasks are fully completed.
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {selectedTaskForVerify.todochecklist && selectedTaskForVerify.todochecklist.length > 0 ? (
                selectedTaskForVerify.todochecklist.map((item) => {
                  const itemId = item._id || item.id;
                  const isItemChecked = !!checklistVerification[itemId];

                  return (
                    <label
                      key={itemId}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isItemChecked
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isItemChecked}
                        onChange={() => {
                          setChecklistVerification(prev => ({
                            ...prev,
                            [itemId]: !prev[itemId]
                          }));
                        }}
                        className="w-4.5 h-4.5 accent-emerald-500 cursor-pointer rounded-md"
                      />
                      <span className="text-xs font-bold leading-none">{item.text}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-450 font-bold">
                  No checklist items registered for this task.
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {selectedTaskForVerify.todochecklist && selectedTaskForVerify.todochecklist.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                  <span>Verification Progress</span>
                  <span>
                    {Object.values(checklistVerification).filter(Boolean).length} / {selectedTaskForVerify.todochecklist.length} Checked
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ 
                      width: `${(Object.values(checklistVerification).filter(Boolean).length / selectedTaskForVerify.todochecklist.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedTaskForVerify(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-355 bg-slate-100 dark:bg-slate-900 hover:bg-slate-205 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleVerificationUpdate(selectedTaskForVerify._id, 'Verified');
                  setSelectedTaskForVerify(null);
                }}
                disabled={
                  selectedTaskForVerify.todochecklist && 
                  selectedTaskForVerify.todochecklist.length > 0 &&
                  !Object.values(checklistVerification).every(Boolean)
                }
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
                  !(selectedTaskForVerify.todochecklist && selectedTaskForVerify.todochecklist.length > 0) || Object.values(checklistVerification).every(Boolean)
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Complete Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TaskVerification;
