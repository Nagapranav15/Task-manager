import React, { createContext, useContext, useState, useEffect, useCallback } from "react";   
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS, BASE_URL, getSecureUrl } from "../utils/apiPaths";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { decryptMessage } from "../utils/crypto";

export const UserContext = createContext();

const UserProvider = ({children})=>{
    const [user,setUser]=useState(null);
    const [loading,setLoading]=useState(true);
    const [socket, setSocket] = useState(null);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());
    const [userStatus, setUserStatusState] = useState(() => localStorage.getItem("user_status_pref") || "online");
    const [userStatuses, setUserStatuses] = useState({}); // userId -> "online" | "away" | "dnd" | "offline"
    const [unreadCount, setUnreadCount] = useState(0);
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

        const cleanTitle = title || "Task Tracker Alert";
        const cleanBody = body || "";

        const options = {
            body: cleanBody,
            tag: `tt-${Date.now()}`,
            renotify: true,
            silent: false,
        };

        let directSuccess = false;
        // Strategy 1: Direct Notification Constructor (Instant on Chrome/macOS/Windows)
        try {
            const instance = new Notification(cleanTitle, options);
            instance.onclick = () => {
                window.focus();
                instance.close();
            };
            directSuccess = true;
        } catch (e) {
            console.warn("Direct Notification constructor warning:", e);
        }

        // Strategy 2: Service Worker Registration Fallback (only if Strategy 1 failed)
        if (!directSuccess && "serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                if (reg && reg.showNotification) {
                    reg.showNotification(cleanTitle, options);
                }
            }).catch((err) => {
                console.warn("Service Worker showNotification error:", err);
            });
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
                toast.success("Desktop notifications enabled!");
            } else if (permission === "denied") {
                toast.error("Notifications blocked in browser settings. Click the lock icon in your browser address bar to allow.", { duration: 6000 });
            }
            return permission;
        } catch (err) {
            console.error("Failed to request notification permission:", err);
            return Notification.permission;
        }
    };

    // Auto-request notification permissions silently when user is authenticated
    useEffect(() => {
        if (user && typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission()
                    .then((permission) => {
                        setNotificationPermission(permission);
                    })
                    .catch((err) => {
                        console.error("Auto request notification permission error:", err);
                    });
            }
        }
    }, [user]);

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

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const response = await axiosInstance.get("/api/chat/messages?all=true");
            if (response && Array.isArray(response.data)) {
                const currentUserId = (user._id || user.id || "").toString();
                const count = response.data.filter(msg => {
                    const rId = (msg.receiver?._id || msg.receiver || "").toString();
                    return rId === currentUserId && msg.status === "sent";
                }).length;
                setUnreadCount(count);
            }
        } catch (err) {
            console.error("Failed to fetch unread count", err);
        }
    }, [user]);

    // Sync unread messages count on user change or silent refresh tick
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
        } else {
            setUnreadCount(0);
        }
    }, [user, refreshTick, fetchUnreadCount]);

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

        newSocket.on("chat_message", async (msg) => {
            if (!msg) return;
            const currentUserId = (user?._id || user?.id || "").toString();
            const senderId = (msg.sender?._id || msg.sender || "").toString();

            if (senderId && currentUserId && senderId !== currentUserId) {
                // Ignore private direct messages not intended for the logged-in user
                if (msg.receiver) {
                    const rId = (msg.receiver?._id || msg.receiver || "").toString();
                    if (rId && rId !== currentUserId) {
                        return;
                    }
                }

                let decryptedText = msg.text || "";
                let seed = "";
                if (msg.receiver) {
                    const rId = (msg.receiver?._id || msg.receiver || "").toString();
                    const sId = (msg.sender?._id || msg.sender || "").toString();
                    seed = [sId, rId].sort().join("_");
                } else {
                    seed = `group_${msg.group || "general"}`;
                }
                try {
                    decryptedText = await decryptMessage(msg.text, seed);
                } catch (e) {
                    console.warn("Failed to decrypt message for notification:", e);
                }

                const isAutomated = decryptedText.includes("New Task Assigned") || 
                                    decryptedText.includes("Task Updated") || 
                                    decryptedText.includes("Task Deleted") || 
                                    decryptedText.includes("Task Completed") ||
                                    decryptedText.startsWith("📋") ||
                                    decryptedText.startsWith("✏️") ||
                                    decryptedText.startsWith("🗑️") ||
                                    decryptedText.startsWith("✅");

                if (!isAutomated) {
                    const isGroup = !!msg.group;
                    const title = isGroup ? `Group Chat (${msg.group})` : `New Message from ${msg.sender?.name || "Co-worker"}`;
                    const bodyStr = isGroup 
                        ? `${msg.sender?.name || "Someone"}: ${decryptedText}`
                        : decryptedText;

                    toast.success(isGroup ? `[Group] ${msg.sender?.name || "Someone"}: "${decryptedText}"` : `New message from ${msg.sender?.name || "Co-worker"}: "${decryptedText}"`, {
                        icon: "💬",
                        duration: 4550
                    });

                    triggerDesktopNotification(title, bodyStr, msg.sender?.profileImageUrl);
                }
                fetchUnreadCount();
            }
        });

        newSocket.on("messages_read", ({ readerId, senderId }) => {
            const currentUserId = (user?._id || user?.id || "").toString();
            if (readerId === currentUserId || senderId === currentUserId) {
                fetchUnreadCount();
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, userStatus, fetchUnreadCount]);

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

    // Check active clock-in session when user changes
    useEffect(() => {
        if (!user) {
            setIsClockedIn(false);
            return;
        }
        const checkActiveCheckIn = async () => {
            try {
                const res = await axiosInstance.get(API_PATHS.ATTENDANCE.GET_MY_LOGS);
                const active = res.data?.find(log => log.status === "Checked-In");
                setIsClockedIn(!!active);
            } catch (e) {
                console.error("Check active checkin failed", e);
            }
        };
        checkActiveCheckIn();
    }, [user, refreshTick]);

    // Prevent closing the tab/window when clocked in
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isClockedIn) {
                event.preventDefault();
                event.returnValue = "You have an active clock-in session. Are you sure you want to close?";
                return event.returnValue;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isClockedIn]);

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
            triggerDesktopNotification,
            isClockedIn,
            setIsClockedIn,
            unreadCount,
            fetchUnreadCount
        }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
