import React, { useEffect, useState, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { LuPlus, LuCalendar, LuCheck, LuX, LuClock, LuFileText } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import moment from 'moment';

const LeaveManagement = () => {
  const { user, socket } = useContext(UserContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Apply modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Admin action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionStatus, setActionStatus] = useState('Approved');
  const [adminComment, setAdminComment] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.LEAVES.GET_LEAVES);
      setLeaves(res.data || []);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleLeaveApplied = (newLeave) => {
      setLeaves((prev) => [newLeave, ...prev.filter((l) => l._id !== newLeave._id)]);
    };

    const handleLeaveUpdated = (updatedLeave) => {
      setLeaves((prev) => prev.map((l) => (l._id === updatedLeave._id ? updatedLeave : l)));
    };

    socket.on('leave_applied', handleLeaveApplied);
    socket.on('leave_status_updated', handleLeaveUpdated);

    return () => {
      socket.off('leave_applied', handleLeaveApplied);
      socket.off('leave_status_updated', handleLeaveUpdated);
    };
  }, [socket]);

  const [proofFile, setProofFile] = useState(null);
  const [proofUploading, setProofUploading] = useState(false);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      setSubmitting(true);

      await axiosInstance.post(API_PATHS.LEAVES.APPLY_LEAVE, {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      toast.success('Leave application submitted successfully!');
      setApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (error) {
      console.error('Failed to submit leave:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (!selectedLeave) return;
    try {
      setSubmitting(true);
      await axiosInstance.put(API_PATHS.LEAVES.UPDATE_STATUS(selectedLeave._id), {
        status: actionStatus,
        adminComment,
      });
      toast.success(`Leave request ${actionStatus.toLowerCase()}!`);
      setActionModalOpen(false);
      setSelectedLeave(null);
      setAdminComment('');
      fetchLeaves();
    } catch (error) {
      console.error('Failed to update leave status:', error);
      toast.error(error.response?.data?.message || 'Failed to update leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAdminAction = (leaveItem, status) => {
    setSelectedLeave(leaveItem);
    setActionStatus(status);
    setAdminComment('');
    setActionModalOpen(true);
  };

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

  return (
    <DashboardLayout activeMenu="leave-requests">
      <div className="mt-4 mb-10 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest">
              Leave & Absences
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-1">
              Leave Requests & Approvals
            </h2>
          </div>
          {user?.role !== 'admin' && (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LuPlus className="text-base" />
              <span>Apply for Leave</span>
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <LuFileText className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{leaves.length} Applications</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
              <LuClock className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pending</p>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{pendingCount} Pending</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <LuCheck className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Approved</p>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{approvedCount} Approved</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
              <LuClock className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">On Hold</p>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{leaves.filter(l => l.status === 'On Hold').length} On Hold</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0">
              <LuX className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Rejected</p>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{rejectedCount} Rejected</h3>
            </div>
          </div>
        </div>

        {/* Leaves List */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4">
            {user?.role === 'admin' ? 'All Team Leave Applications' : 'My Leave Applications'}
          </h3>

          {leaves.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              No leave applications found.
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((item) => {
                return (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {item.leaveType}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : item.status === 'On Hold'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : item.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {item.applicant?.name || 'Applicant'} <span className="text-[10px] text-slate-400 font-medium">({item.applicant?.role})</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-350 font-medium">
                        <strong>Dates:</strong> {moment(item.startDate).format('DD MMM YYYY')} to {moment(item.endDate).format('DD MMM YYYY')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Reason:</strong> {item.reason}
                      </p>
                      {item.proofAttachment?.url && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold pt-1 flex items-center gap-1">
                          📎 <strong>Proof Attachment:</strong> 
                          <a 
                            href={item.proofAttachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline hover:text-indigo-400 cursor-pointer"
                          >
                            {item.proofAttachment.name || "View Document Proof"}
                          </a>
                        </p>
                      )}
                      {item.adminComment && (
                        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold pt-1">
                          💬 <strong>Admin Comment:</strong> {item.adminComment}
                        </p>
                      )}
                    </div>

                    {/* Admin Action Buttons */}
                    {user?.role === 'admin' && (
                      item.status === 'Approved' || item.status === 'Rejected' ? (
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                          🔒 Finalized ({item.status})
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => openAdminAction(item, 'Approved')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openAdminAction(item, 'On Hold')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            On Hold
                          </button>
                          <button
                            onClick={() => openAdminAction(item, 'Rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Reject
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Apply for Leave
              </h3>
              <button onClick={() => setApplyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark] rounded-xl px-3 py-2 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark] rounded-xl px-3 py-2 text-xs outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Reason for Absence
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the reason for leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl p-3 text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {actionStatus} Leave Application
            </h3>
            <p className="text-xs text-slate-500">
              Update application status for <strong>{selectedLeave?.applicant?.name}</strong>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Admin Comment (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add feedback or notes for the applicant..."
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-3 text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdateSubmit}
                disabled={submitting}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer ${
                  actionStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : actionStatus === 'On Hold' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LeaveManagement;
