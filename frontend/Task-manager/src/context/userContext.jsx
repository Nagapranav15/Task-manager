import React, { createContext, useContext, useState, useEffect } from "react";   
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS, BASE_URL, getSecureUrl } from "../utils/apiPaths";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

export const UserContext = createContext();

const UserProvider = ({children})=>{
    const [user,setUser]=useState(null);
    const [loading,setLoading]=useState(true);
    const [socket, setSocket] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());
    const [userStatus, setUserStatusState] = useState(() => localStorage.getItem("user_status_pref") || "online");
    const [userStatuses, setUserStatuses] = useState({}); // userId -> "online" | "away" | "dnd" | "offline"
    const [notificationPermission, setNotificationPermission] = useState(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }
        return "unsupported";
    });

    // Register Service Worker for HTTPS desktop push notifications
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("[ServiceWorker] Registered successfully:", reg.scope);
                })
                .catch((err) => {
                    console.warn("[ServiceWorker] Registration failed:", err);
                });
        }
    }, []);

    const triggerDesktopNotification = (title, body, iconUrl) => {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const options = {
            body: body || "",
            icon: getSecureUrl(iconUrl) || "https://framerusercontent.com/images/i2onAsJauZNBrRsZ8HunTa80Pk.png",
            badge: "https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg",
            tag: `task-tracker-${Date.now()}`,
            renotify: true,
            vibrate: [200, 100, 200]
        };

        // Strategy 1: Service Worker Notification (Primary for HTTPS Chrome/Mac/Edge/Safari)
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title || "Task Tracker Alert", options);
            }).catch(() => {
                // Strategy 2: Fallback to classic Notification constructor
                try {
                    const n = new Notification(title || "Task Tracker Alert", options);
                    n.onclick = () => { window.focus(); n.close(); };
                } catch (e) { console.error("Classic Notification fallback error:", e); }
            });
        } else {
            // Strategy 2: Classic Notification constructor
            try {
                const n = new Notification(title || "Task Tracker Alert", options);
                n.onclick = () => { window.focus(); n.close(); };
            } catch (e) { console.error("Classic Notification error:", e); }
        }
    };

    const requestNotificationPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            toast.error("Browser notifications are not supported by your browser.");
            return "unsupported";
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === "granted") {
                toast.success("Desktop push alerts enabled!");
                triggerDesktopNotification("Task Tracker 🔔", "Desktop push alerts enabled! You will now receive instant browser notifications for messages and updates.");
            } else if (permission === "denied") {
                toast.error("Notifications blocked in browser settings. Click the lock icon in your browser address bar to allow.", { duration: 6000 });
            }
            return permission;
        } catch (err) {
            console.error("Failed to request notification permission:", err);
            return Notification.permission;
        }
    };

    const setUserStatus = (newStatus) => {
        setUserStatusState(newStatus);
        localStorage.setItem("user_status_pref", newStatus);
        if (socket && user) {
            const userId = user._id || user.id;
            socket.emit("update_my_status", { userId: userId.toString(), status: newStatus });
        }
        const labels = {
            online: "Available 🟢",
            away: "Away 🟡",
            dnd: "Do Not Disturb 🔴",
            offline: "Invisible ⚪"
        };
        toast.success(`Status updated to ${labels[newStatus] || newStatus}`);
    };

    // Silent global 5-second auto-refresh timer
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTick((prev) => prev + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const clearUser = ()=>{
        setUser(null);
        localStorage.removeItem("token");
    };

    const updateUser = (userData)=>{
        setUser(userData);
        if (userData?.token) {
            localStorage.setItem("token",userData.token);
        }
        setLoading(false);
    };

    useEffect(()=>{
        if(user) return;
        
        const accessToken = localStorage.getItem("token");
        if(!accessToken){
            setLoading(false);
            return;
        }   
        const fetchUser = async()=>
        {
            try {
                const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
                const data = response.data || {};
                setUser(data);
            }catch(error)
            {
                console.error("User not authenticated",error);
                clearUser();
            }finally{
                setLoading(false);
            }
        };
        fetchUser();
    },[]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(BASE_URL);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("[Socket] Connected to server");
            const userId = user._id || user.id;
            if (userId) {
                newSocket.emit("user_online", userId.toString());
                newSocket.emit("update_my_status", { userId: userId.toString(), status: userStatus });
            }
        });

        newSocket.on("update_online_users", (data) => {
            if (data && typeof data === "object" && !Array.isArray(data)) {
                setUserStatuses(data.statuses || {});
                setOnlineUserIds(new Set(data.activeIds || []));
            } else if (Array.isArray(data)) {
                setOnlineUserIds(new Set(data));
            }
        });

        newSocket.on("notification", (data) => {
            console.log("[Socket] Received notification:", data);
            
            // Trigger Service Worker / Native browser notification
            triggerDesktopNotification(data.title || "Task Tracker Update", data.message);

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#0e1726]/95 backdrop-blur shadow-2xl rounded-2xl pointer-events-auto flex border border-slate-800/80`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <span className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-xl text-indigo-400 animate-pulse">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </span>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-[11px] font-black text-slate-100 uppercase tracking-wider">{data.title || "Notification"}</p>
                                <p className="mt-1.5 text-xs text-slate-400 font-medium leading-relaxed">{data.message}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-slate-800/80">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-2xl px-4 flex items-center justify-center text-[10px] font-extrabold tracking-wider uppercase text-slate-500 hover:text-slate-200 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ), { duration: 6000 });
        });

        newSocket.on("chat_message", (msg) => {
            const currentUserId = user?._id || user?.id;
            const senderId = msg.sender?._id || msg.sender;

            if (senderId !== currentUserId) {
                const text = msg.text || "";
                const isAutomated = text.includes("New Task Assigned") || 
                                    text.includes("Task Updated") || 
                                    text.includes("Task Deleted") || 
                                    text.includes("Task Completed") ||
                                    text.startsWith("📋") ||
                                    text.startsWith("✏️") ||
                                    text.startsWith("🗑️") ||
                                    text.startsWith("✅");

                if (!isAutomated) {
                    const isGroup = !!msg.group;
                    const title = isGroup ? `Group Chat (${msg.group})` : `New Message from ${msg.sender?.name || "Co-worker"}`;
                    const bodyStr = isGroup 
                        ? `${msg.sender?.name || "Someone"}: ${msg.text || "Sent a file"}`
                        : (msg.text || "Sent a file");

                    toast.success(isGroup ? `[Group] ${msg.sender?.name || "Someone"}: "${msg.text || "Sent a file"}"` : `New message from ${msg.sender?.name || "Co-worker"}: "${msg.text || "Sent a file"}"`, {
                        icon: "💬",
                        duration: 4550
                    });

                    triggerDesktopNotification(title, bodyStr, msg.sender?.profileImageUrl);
                }
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, userStatus]);

    useEffect(() => {
        if (socket && user) {
            const userId = user._id || user.id;
            if (userId) {
                socket.emit("join", userId);
                socket.emit("user_online", userId.toString());
                socket.emit("update_my_status", { userId: userId.toString(), status: userStatus });
            }
        }
    }, [socket, user, userStatus]);

    return(
        <UserContext.Provider value={{
            user,
            loading,
            updateUser,
            clearUser,
            socket,
            refreshTick,
            onlineUserIds,
            userStatus,
            setUserStatus,
            userStatuses,
            notificationPermission,
            requestNotificationPermission,
            triggerDesktopNotification
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
