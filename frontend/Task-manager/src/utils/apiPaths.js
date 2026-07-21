const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://task-manager-backend-fpwb.onrender.com";
    }
  }
  return "http://localhost:8080";
};

export const BASE_URL = getBaseUrl();

const path = (p) => `${BASE_URL}${p}`;

export const getSecureUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl) return "";

  const isHttpsSite = typeof window !== "undefined" && window.location.protocol === "https:";
  const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

  if (isProduction || isHttpsSite) {
    if (cleanUrl.includes("localhost:8080") || cleanUrl.includes("127.0.0.1")) {
      cleanUrl = cleanUrl.replace(/^http:\/\/(localhost:8080|127\.0\.0\.1:\d+)/i, "https://task-manager-backend-fpwb.onrender.com");
    }
    cleanUrl = cleanUrl.replace(/^http:\/\/task-manager-backend-fpwb\.onrender\.com/i, "https://task-manager-backend-fpwb.onrender.com");
    if (cleanUrl.startsWith("http://") && !cleanUrl.includes("localhost")) {
      cleanUrl = cleanUrl.replace(/^http:\/\//i, "https://");
    }
  }

  if (cleanUrl.startsWith("/")) {
    cleanUrl = `${BASE_URL}${cleanUrl}`;
  }

  return cleanUrl;
};

export const API_PATHS = {
  AUTH: {
    REGISTER: path("/api/auth/register"),
    LOGIN: path("/api/auth/login"),
    GOOGLE: path("/api/auth/google"),
    GET_PROFILE: path("/api/auth/profile"),
    UPDATE_PROFILE: path("/api/auth/profile"),
    GET_ACTIVITIES: path("/api/activity"),
    UPLOAD_IMAGE: path("/api/auth/upload-image"),
  },

  USERS: {
    GET_ALL_USERS: path("/api/users"),
    GET_USER_BY_ID: (userId) => path(`/api/users/${userId}`),
    CREATE_USER: path("/api/users"),
    UPDATE_USER: (userId) => path(`/api/users/${userId}`),
    DELETE_USER: (userId) => path(`/api/users/${userId}`),
  },

  TASKS: {
    GET_DASHBOARD_DATA: path("/api/tasks/dashboard-data"),
    GET_USER_DASHBOARD_DATA: path("/api/tasks/user-dashboard-data"),
    GET_ALL_TASKS: path("/api/tasks"),
    GET_TASK_BY_ID: (taskId) => path(`/api/tasks/${taskId}`),
    CREATE_TASK: path("/api/tasks"),
    UPDATE_TASK: (taskId) => path(`/api/tasks/${taskId}`),
    DELETE_TASK: (taskId) => path(`/api/tasks/${taskId}`),

    UPDATE_TASK_STATUS: (taskId) => path(`/api/tasks/${taskId}/status`),
    UPDATE_TODO_TASK: (taskId) => path(`/api/tasks/${taskId}/todo`),
  },

  ATTENDANCE: {
    CLOCK_IN: path("/api/attendance/clock-in"),
    CLOCK_OUT: path("/api/attendance/clock-out"),
    GET_MY_LOGS: path("/api/attendance/my-logs"),
    GET_ALL_LOGS: path("/api/attendance/admin/all-logs"),
    UPDATE_LOG: (logId) => path(`/api/attendance/admin/log/${logId}`),
  },

  REPORTS: {
    EXPORT_TASKS: path("/api/reports/export/tasks"),
    EXPORT_USERS: path("/api/reports/export/users"),
  },
  CHAT: {
    GET_MESSAGES: (target) => {
      if (!target || target === "group" || target === "general") return path("/api/chat/messages?group=general");
      if (target === "all") return path("/api/chat/messages?all=true");
      return path(`/api/chat/messages?group=${encodeURIComponent(target)}`);
    },
  },
  MEETINGS: {
    GET_ALL_MEETINGS: path("/api/meetings"),
    CREATE_MEETING: path("/api/meetings"),
    UPDATE_MEETING: (id) => path(`/api/meetings/${id}`),
    DELETE_MEETING: (id) => path(`/api/meetings/${id}`),
  },
  LEAVES: {
    GET_LEAVES: path("/api/leaves"),
    APPLY_LEAVE: path("/api/leaves"),
    UPDATE_STATUS: (id) => path(`/api/leaves/${id}/status`),
  },
  HOLIDAYS: {
    GET_HOLIDAYS: path("/api/holidays"),
    CREATE_HOLIDAY: path("/api/holidays"),
    UPDATE_HOLIDAY: (id) => path(`/api/holidays/${id}`),
    DELETE_HOLIDAY: (id) => path(`/api/holidays/${id}`),
  },
};

export { path };
export default API_PATHS;
