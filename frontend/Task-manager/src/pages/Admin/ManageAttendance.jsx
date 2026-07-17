import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";
import { toast } from "react-hot-toast";
import moment from "moment";
import Modal from "../../components/Modal";
import { LuCalendar, LuMapPin, LuPencil, LuSearch, LuUsers } from "react-icons/lu";

const ManageAttendance = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLog, setEditingLog] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Modal Form State
  const [clockInInput, setClockInInput] = useState("");
  const [clockOutInput, setClockOutInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAllLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.ATTENDANCE.GET_ALL_LOGS);
      setLogs(res.data || []);
      setFilteredLogs(res.data || []);
    } catch (error) {
      console.error("Failed to load admin logs", error);
      toast.error("Failed to retrieve attendance logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    // Format to datetime-local inputs (YYYY-MM-DDTHH:MM)
    setClockInInput(moment(log.clockInTime).format("YYYY-MM-DDTHH:mm"));
    setClockOutInput(log.clockOutTime ? moment(log.clockOutTime).format("YYYY-MM-DDTHH:mm") : "");
    setIsEditModalOpen(true);
  };

  const handleUpdateLog = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      setLoading(true);
      const payload = {
        clockInTime: clockInInput ? new Date(clockInInput).toISOString() : undefined,
        clockOutTime: clockOutInput ? new Date(clockOutInput).toISOString() : null
      };

      await axiosInstance.put(
        API_PATHS.ATTENDANCE.UPDATE_LOG(editingLog._id),
        payload
      );
      
      toast.success("Attendance log updated successfully.");
      setIsEditModalOpen(false);
      fetchAllLogs();
    } catch (error) {
      console.error("Update log error", error);
      toast.error(error.response?.data?.message || "Failed to update attendance log.");
    } finally {
      setLoading(false);
    }
  };

  // Run filter logic when search query changes
  useEffect(() => {
    const query = searchTerm.toLowerCase().trim();
    if (query === "") {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(log => 
        log.user?.name?.toLowerCase().includes(query) ||
        log.user?.email?.toLowerCase().includes(query)
      );
      setFilteredLogs(filtered);
    }
  }, [searchTerm, logs]);

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const handleExportExcel = async () => {
    try {
      toast.loading("Generating Excel sheet...", { id: "export-logs" });
      const res = await axiosInstance.get("/api/attendance/admin/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance_logs_${moment().format("YYYY-MM-DD")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel sheet downloaded successfully!", { id: "export-logs" });
    } catch (error) {
      console.error("Export logs failed", error);
      toast.error("Failed to download Excel report.", { id: "export-logs" });
    }
  };

  const handleCleanupOldLogs = async () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you sure you want to permanently delete all attendance logs older than 1 month? Make sure you have exported them to Excel first."
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const res = await axiosInstance.delete("/api/attendance/admin/delete-old");
      toast.success(res.data?.message || "Successfully cleaned up old attendance records.");
      fetchAllLogs();
    } catch (error) {
      console.error("Failed to clean up old logs", error);
      toast.error(error.response?.data?.message || "Failed to delete old records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="attendance">
      <div className="mt-5 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-900">
          <div>
            <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <LuUsers className="text-indigo-650 dark:text-indigo-400" />
              <span>Team Timesheets</span>
            </h2>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-semibold">
              Monitor, verify geolocation coordinates, and edit team attendance logs.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search box */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550 pointer-events-none">
                <LuSearch className="text-sm" />
              </span>
              <input
                type="text"
                placeholder="Search member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500/50 outline-none rounded-xl pl-9 pr-4 py-2.5 transition-all"
              />
            </div>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
            >
              Export Excel
            </button>

            {/* Cleanup button */}
            <button
              onClick={handleCleanupOldLogs}
              className="px-4 py-2.5 bg-rose-650 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-rose-500/10 active:scale-[0.98]"
            >
              Delete &gt; 1 Mon Logs
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/20">
            <table className="min-w-full divide-y divide-slate-250 dark:divide-slate-800/60">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30 text-left">
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Member</th>
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Date</th>
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Clock In</th>
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Clock Out</th>
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Work</th>
                  <th className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                      No timesheet records matching query
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const inTime = moment(log.clockInTime);
                    const outTime = log.clockOutTime ? moment(log.clockOutTime) : null;
                    const duration = outTime
                      ? moment.utc(outTime.diff(inTime)).format("HH:mm:ss")
                      : "Active Shift";

                    const initials = log.user?.name
                      ? log.user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                      : "U";

                    return (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                        {/* Member Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {log.user?.profileImageUrl ? (
                              <img
                                src={log.user.profileImageUrl}
                                alt={log.user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] border border-slate-200 dark:border-slate-800">
                                {initials}
                              </div>
                            )}
                            <div>
                              <span className="block text-slate-800 dark:text-slate-200 text-xs font-semibold">{log.user?.name || "Unknown"}</span>
                              <span className="block text-[10px] text-slate-500">{log.user?.email || ""}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                          {inTime.format("DD MMM YYYY")}
                        </td>

                        {/* Clock In */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                          {inTime.format("hh:mm:ss A")}
                          <span className="block text-[9px] text-slate-500 truncate max-w-[150px] mt-0.5" title={log.clockInLocation?.address}>
                            <LuMapPin className="inline mr-0.5 text-indigo-650 dark:text-indigo-400" />
                            {log.clockInLocation?.address?.split(",")[0] || "No location"}
                          </span>
                        </td>

                        {/* Clock Out */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                          {outTime ? outTime.format("hh:mm:ss A") : "—"}
                          {log.clockOutTime && (
                            <span className="block text-[9px] text-slate-500 truncate max-w-[150px] mt-0.5" title={log.clockOutLocation?.address}>
                              <LuMapPin className="inline mr-0.5 text-indigo-650 dark:text-indigo-400" />
                              {log.clockOutLocation?.address?.split(",")[0] || "No location"}
                            </span>
                          )}
                        </td>

                        {/* Work Duration */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs font-mono">
                          <span className={log.status === "Checked-In" ? "text-cyan-700 dark:text-cyan-400 font-semibold animate-pulse" : ""}>
                            {duration}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleEditClick(log)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/15 hover:bg-indigo-500/20 cursor-pointer transition-all"
                            title="Edit Record"
                          >
                            <LuPencil className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Timesheet Record"
        >
          <form onSubmit={handleUpdateLog} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Member</label>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{editingLog?.user?.name}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[11px] text-slate-500">{editingLog?.user?.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Clock In Timestamp</label>
              <input
                type="datetime-local"
                value={clockInInput}
                onChange={(e) => setClockInInput(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 outline-none rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Clock Out Timestamp</label>
              <input
                type="datetime-local"
                value={clockOutInput}
                onChange={(e) => setClockOutInput(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 outline-none rounded-xl px-4 py-3"
              />
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">* Leave blank if user is currently active/checked-in.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/20 hover:bg-slate-200 dark:hover:bg-slate-950/50 border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ManageAttendance;
