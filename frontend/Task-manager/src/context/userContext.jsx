import React, { createContext, useContext, useState, useEffect } from "react";   
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS, BASE_URL } from "../utils/apiPaths";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

export const UserContext = createContext();

const UserProvider = ({children})=>{
    const [user,setUser]=useState(null);
    const [loading,setLoading]=useState(true);
    const [socket, setSocket] = useState(null);

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

        // Request browser notification permissions immediately at browser level
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        toast.success("Desktop push alerts enabled!");
                    }
                });
            }
        }

        const newSocket = io(BASE_URL);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("[Socket] Connected to server");
        });

        newSocket.on("notification", (data) => {
            console.log("[Socket] Received notification:", data);
            
            // Trigger browser notification (WhatsApp Web style)
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(data.title || "Task Manager Update", {
                        body: data.message,
                        icon: "https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg?width=206&height=96"
                    });
                } catch (err) {
                    console.error("Failed to trigger browser notification", err);
                }
            }

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

            // Trigger alert if message is from someone else (direct message or group chat)
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

                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                        try {
                            new Notification(title, {
                                body: bodyStr,
                                icon: msg.sender?.profileImageUrl || undefined
                            });
                        } catch (err) {
                            console.error("Failed to trigger native browser notification", err);
                        }
                    }
                }
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (socket && user) {
            const userId = user._id || user.id;
            if (userId) {
                socket.emit("join", userId);
            }
        }
    }, [socket, user]);

    return(
        <UserContext.Provider value={{user,loading,updateUser,clearUser,socket}}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
