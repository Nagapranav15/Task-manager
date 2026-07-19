import React, { useState, useEffect, useContext } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";
import { toast } from "react-hot-toast";
import moment from "moment";
import { LuClock, LuMapPin, LuPlay, LuSquare, LuHistory } from "react-icons/lu";

const Attendance = () => {
  const { user } = useContext(UserContext);
  const [logs, setLogs] = useState([]);
  const [activeLog, setActiveLog] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // Fetch user logs & determine active check-in
  const getLogsAndStatus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.ATTENDANCE.GET_MY_LOGS);
      setLogs(res.data || []);
      
      // Find if there is an active session
      const active = res.data.find(log => log.status === "Checked-In");
      setActiveLog(active || null);
    } catch (error) {
      console.error("Failed to load logs", error);
      toast.error("Failed to load attendance history.");
    } finally {
      setLoading(false);
    }
  };

  // Get current GPS location and geocode it
  const getGPSLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, address: "Geolocation not supported" });
        return;
      }
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let address = "Unknown Address";
          try {
            // Free OpenStreetMap Reverse Geocoding
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const geoData = await geoRes.json();
            address = geoData.display_name || address;
          } catch (e) {
            console.error("Address lookup failed", e);
          }
          setIsLocating(false);
          resolve({ latitude, longitude, address });
        },
        (error) => {
          console.warn("Geolocation permission error", error);
          setIsLocating(false);
          resolve({ latitude: null, longitude: null, address: "Location permission denied" });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      toast.loading("Acquiring GPS location...", { id: "gps" });
      const geo = await getGPSLocation();
      if (geo.latitude === null || geo.longitude === null) {
        toast.error("Location access is required to clock in. Please enable location services in your browser.", { id: "gps" });
        return;
      }
      toast.success("Location acquired!", { id: "gps" });

      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CLOCK_IN, geo);
      toast.success("Clocked in successfully!");
      getLogsAndStatus();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to clock in.");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      toast.loading("Acquiring GPS location...", { id: "gps" });
      const geo = await getGPSLocation();
      if (geo.latitude === null || geo.longitude === null) {
        toast.error("Location access is required to clock out. Please enable location services in your browser.", { id: "gps" });
        return;
      }
      toast.success("Location acquired!", { id: "gps" });

      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.ATTENDANCE.CLOCK_OUT, geo);
      toast.success("Clocked out successfully!");
      getLogsAndStatus();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to clock out.");
    } finally {
      setLoading(false);
    }
  };


  // Run elapsed timer if checked in
  useEffect(() => {
    let interval;
    if (activeLog && activeLog.clockInTime) {
      const calculateElapsed = () => {
        const diff = moment().diff(moment(activeLog.clockInTime));
        const duration = moment.duration(diff);
        const hours = String(Math.floor(duration.asHours())).padStart(2, "0");
        const minutes = String(duration.minutes()).padStart(2, "0");
        const seconds = String(duration.seconds()).padStart(2, "0");
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      };
      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  useEffect(() => {
    getLogsAndStatus();
  }, []);

  return (
    <DashboardLayout activeMenu={user?.role === "admin" ? "clock-in-out" : "attendance"}>
      <div className="mt-5 space-y-6">
        {/* Header Title */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-900">
          <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <LuClock className="text-indigo-650 dark:text-indigo-400 animate-pulse" />
            <span>Attendance Tracker</span>
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-semibold">
            Log your daily clock-in / clock-out timesheets with secure geocoding.
          </p>
        </div>

        {/* Action Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card left: Clock actions */}
          <div className="card md:col-span-5 flex flex-col justify-between items-center text-center p-8 space-y-6 min-h-[300px]">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                activeLog 
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                  : "text-slate-650 dark:text-slate-400 bg-slate-500/10 border-slate-500/25"
              }`}>
                {activeLog ? "Active Shift" : "Shift Inactive"}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-wider">
                {elapsedTime}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activeLog 
                  ? `Clocked in at: ${moment(activeLog.clockInTime).format("hh:mm A")}`
                  : "Clock in to start recording work hours"
                }
              </p>
            </div>

            <div className="w-full flex items-center gap-4">
              {!activeLog ? (
                <button
                  onClick={handleClockIn}
                  disabled={loading || isLocating}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <LuPlay className="text-lg" />
                  <span>Clock In</span>
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  disabled={loading || isLocating}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-50 hover:to-orange-500 text-white font-bold py-3.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-rose-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <LuSquare className="text-lg" />
                  <span>Clock Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Card right: Current location logs */}
          <div className="card md:col-span-7 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LuMapPin className="text-indigo-650 dark:text-indigo-400" />
                <span>GPS Location Verification</span>
              </h4>

              {isLocating ? (
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm py-4">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Resolving coordinates and address...</span>
                </div>
              ) : activeLog ? (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-inner">
                  <div className="text-xs">
                    <span className="block text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">Clock-In Location</span>
                    <span className="text-slate-850 dark:text-slate-200 font-semibold leading-relaxed">
                      {activeLog.clockInLocation?.address || "Address unresolved"}
                    </span>
                    <span className="block text-slate-400 dark:text-slate-500 text-[10px] mt-1">
                      Coordinates: {activeLog.clockInLocation?.latitude?.toFixed(4)}, {activeLog.clockInLocation?.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-550 dark:text-slate-400 text-xs py-4 leading-relaxed font-medium">
                  Your browser will request GPS permission on Clock-In and Clock-Out to log the geographical location details of your check-in.
                </p>
              )}
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800/40 pt-4 text-[10px] text-slate-500 leading-relaxed font-semibold">
              * Note: Attendance logs are secure. Team members cannot edit their own records. Contact administrator for any adjustments.
            </div>
          </div>
        </div>

        {/* History logs table */}
        <div className="card">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <LuHistory className="text-indigo-650 dark:text-indigo-400" />
            <span>Timesheet History</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/20 shadow-sm">
            <table className="min-w-full divide-y divide-slate-250 dark:divide-slate-800/60">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30 text-left">
                  <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Clock In</th>
                  <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Clock Out</th>
                  <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Duration</th>
                  <th className="py-3 px-4 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500 text-xs">
                      No timesheet history found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const inTime = moment(log.clockInTime);
                    const outTime = log.clockOutTime ? moment(log.clockOutTime) : null;
                    const duration = outTime
                      ? moment.utc(outTime.diff(inTime)).format("HH:mm:ss")
                      : "—";

                    return (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                          {inTime.format("DD MMM YYYY")}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                          {inTime.format("hh:mm:ss A")}
                          <span className="block text-[10px] text-slate-500 truncate max-w-[200px]" title={log.clockInLocation?.address}>
                            {log.clockInLocation?.address?.split(",")[0] || "No location"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs">
                          {outTime ? outTime.format("hh:mm:ss A") : "—"}
                          {log.clockOutTime && (
                            <span className="block text-[10px] text-slate-500 truncate max-w-[200px]" title={log.clockOutLocation?.address}>
                              {log.clockOutLocation?.address?.split(",")[0] || "No location"}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs font-mono">
                          {duration}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                            log.status === "Checked-In"
                              ? "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25"
                              : "text-slate-650 dark:text-slate-400 bg-slate-500/10 border-slate-500/25"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
