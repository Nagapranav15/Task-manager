export const BASE_URL = (import.meta?.env?.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");

const path = (p) => `${BASE_URL}${p}`;

export const API_PATHS = {
  AUTH: {
    REGISTER: path("/api/auth/register"),
    LOGIN: path("/api/auth/login"),
    GET_PROFILE: path("/api/auth/profile"),
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

  REPORTS: {
    EXPORT_TASKS: path("/api/reports/export/tasks"),
    EXPORT_USERS: path("/api/reports/export/users"),
  },
};

export { path };
export default API_PATHS;
