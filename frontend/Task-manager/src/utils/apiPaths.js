export const BASE_URL = "http://localhost:8080";

const path = (p) => `${BASE_URL}${p}`;

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
    GET_MESSAGES: path("/api/chat/messages"),
  },
};

export { path };
export default API_PATHS;

