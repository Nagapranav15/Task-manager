import axios from "axios";
import { BASE_URL } from "./apiPaths";
import { toast } from "react-hot-toast";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.code === "ECONNABORTED" || (error.message && error.message.includes("timeout"))) {
            toast.error("The server is waking up, this can take up to a minute.", { id: "server-waking-up" });
            if (originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                return axiosInstance(originalRequest);
            }
        }

        if (error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem("token");
                if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
