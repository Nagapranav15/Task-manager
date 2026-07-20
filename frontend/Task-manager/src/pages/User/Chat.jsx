import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";
import { LuSend, LuUsers, LuUser, LuSearch, LuPaperclip, LuLoader, LuFile } from "react-icons/lu";
import moment from "moment";
import { toast } from "react-hot-toast";

const Chat = () => {
  const { user, socket } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // null if General Group Chat
  const [selectedGroup, setSelectedGroup] = useState("general"); // default to general group chat
  const [messages, setMessages] = useState([]);
  const [allDMs, setAllDMs] = useState([]);
  const [text, setText] = useState("");
  const [customGroups, setCustomGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("custom_chat_groups");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupTitleInput, setGroupTitleInput] = useState("");
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const messagesEndRef = useRef(null);

  const handleCreateGroupSubmit = () => {
    if (!groupTitleInput.trim()) {
      toast.error("Group title is required.");
      return;
    }
    const newGroup = {
      id: "group_" + Date.now(),
      name: groupTitleInput.trim(),
      members: selectedGroupMemberIds,
      createdBy: user?._id
    };
    const updatedGroups = [...customGroups, newGroup];
    setCustomGroups(updatedGroups);
    localStorage.setItem("custom_chat_groups", JSON.stringify(updatedGroups));
    toast.success(`Group "${newGroup.name}" created successfully!`);
    
    setSelectedUser(null);
    setSelectedGroup(newGroup.id);
    setIsGroupModalOpen(false);
    setGroupTitleInput("");
    setSelectedGroupMemberIds([]);
  };

  // Fetch all users to display in sidebar list
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      // Filter out current logged in user
      const filtered = (res.data || []).filter((u) => u._id !== user?._id && u._id !== user?.id);
      setUsers(filtered);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // Fetch all direct messages for unread and recent conversations computation
  const fetchAllDMs = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.CHAT.GET_MESSAGES);
      setAllDMs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch all direct messages", err);
    }
  };

  // Fetch chat history for selected user or general group
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = selectedGroup
        ? { group: selectedGroup }
        : { receiverId: selectedUser?._id };

      const res = await axiosInstance.get(API_PATHS.CHAT.GET_MESSAGES, { params });
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages", err);
      toast.error("Failed to load conversation history.");
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom of message lists
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch users list and all DMs once on mount
  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchAllDMs();
    }
  }, [user]);

  // Fetch messages whenever conversation selection changes
  useEffect(() => {
    fetchMessages();
    if (selectedUser?._id) {
      localStorage.setItem(`chat_last_read_${selectedUser._id}`, new Date().toISOString());
      // Refresh direct messages state to recalculate counts
      setAllDMs((prev) => [...prev]);
    }
  }, [selectedUser, selectedGroup]);

  // Scroll down on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket listener for live chat messages
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      console.log("[Socket] Incoming chat message:", msg);
      
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const currentUserId = user?._id || user?.id;

      // Update DMs real-time state for direct messages
      if (!msg.group) {
        setAllDMs((prev) => [...prev, msg]);
      }

      const isCurrentConversation =
        (selectedGroup && msg.group === selectedGroup) ||
        (selectedUser?._id && !msg.group && (
          senderId === selectedUser._id ||
          (senderId === currentUserId && receiverId === selectedUser._id)
        ));

      if (isCurrentConversation) {
        setMessages((prev) => [...prev, msg]);
        if (selectedUser?._id) {
          localStorage.setItem(`chat_last_read_${selectedUser._id}`, new Date().toISOString());
        }
      } else {
        // Direct message notifications from other users (WhatsApp style)
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
            toast(`New message from ${msg.sender?.name || "Co-worker"}: "${(msg.text || "").slice(0, 30)}..."`, {
              icon: "💬",
              duration: 4000,
            });
          }
        }
      }
    };

    socket.on("chat_message", handleIncomingMessage);

    return () => {
      socket.off("chat_message", handleIncomingMessage);
    };
  }, [socket, selectedUser, selectedGroup, user]);

  // Compute active chats and unread counts
  const { recentChats, unreadCounts } = useMemo(() => {
    const counts = {};
    const latestMessageTime = {};
    const currentUserId = user?._id || user?.id;

    allDMs.forEach((msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      
      if (!msg.group) {
        const otherUserId = senderId === currentUserId ? receiverId : senderId;
        if (!otherUserId) return;

        const msgTime = new Date(msg.createdAt).getTime();
        if (!latestMessageTime[otherUserId] || msgTime > latestMessageTime[otherUserId]) {
          latestMessageTime[otherUserId] = msgTime;
        }

        if (senderId !== currentUserId) {
          const lastReadStr = localStorage.getItem(`chat_last_read_${senderId}`);
          const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0;
          if (msgTime > lastReadTime) {
            counts[senderId] = (counts[senderId] || 0) + 1;
          }
        }
      }
    });

    const recentList = users
      .filter((u) => latestMessageTime[u._id])
      .sort((a, b) => latestMessageTime[b._id] - latestMessageTime[a._id]);

    return { recentChats: recentList, unreadCounts: counts };
  }, [allDMs, users, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    const senderId = user?._id || user?.id;
    const msgData = {
      senderId,
      text: text.trim(),
    };

    if (selectedGroup) {
      msgData.group = selectedGroup;
    } else {
      msgData.receiverId = selectedUser._id;
    }

    // Emit live message event to the server
    socket.emit("chat_message", msgData);
    setText("");
  };

  const uploadFile = async (file) => {
    if (!file || !socket) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Invalid file type. Only PDFs and images are allowed.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosInstance.post("/api/chat/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const senderId = user?._id || user?.id;
      const msgData = {
        senderId,
        text: "",
        fileUrl: res.data.fileUrl,
        fileName: res.data.fileName,
        fileType: res.data.fileType
      };

      if (selectedGroup) {
        msgData.group = selectedGroup;
      } else {
        msgData.receiverId = selectedUser._id;
      }

      socket.emit("chat_message", msgData);
    } catch (err) {
      console.error("Failed to upload file:", err);
      toast.error(err.response?.data?.message || "File upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault(); // Stop normal text pasting behavior of image metadata
          await uploadFile(file);
        }
      }
    }
  };

  const renderMessageContent = (text) => {
    if (!text) return null;

    const isNew = text.includes("New Task Assigned");
    const isUpdate = text.includes("Task Updated");
    const isDelete = text.includes("Task Deleted");
    const isComplete = text.includes("Task Completed");

    if (isNew || isUpdate || isDelete || isComplete) {
      let cardBg = "bg-indigo-500/10 border-indigo-500/20 text-indigo-900 dark:text-indigo-200";
      let icon = "📋";
      let title = "Task Assignment";
      
      if (isUpdate) {
        cardBg = "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200";
        icon = "✏️";
        title = "Task Updated";
      } else if (isDelete) {
        cardBg = "bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-205";
        icon = "🗑️";
        title = "Task Deleted";
      } else if (isComplete) {
        cardBg = "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200";
        icon = "✅";
        title = "Task Completed";
      }

      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

      return (
        <div className={`p-4.5 rounded-2xl border ${cardBg} max-w-sm space-y-2 text-xs shadow-sm`}>
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px]">
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          <div className="space-y-1 font-semibold leading-relaxed">
            {lines.map((line, idx) => {
              if (
                line.includes("Task Completed") || 
                line.includes("Task Updated") || 
                line.includes("Task Deleted") || 
                line.includes("New Task Assigned")
              ) {
                return null;
              }
              const cleanLine = line.replace(/\*\*/g, "").replace(/\*/g, "");
              return <p key={idx}>{cleanLine}</p>;
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="whitespace-pre-line leading-relaxed">
        {text.split("\n").map((line, idx) => {
          const parts = line.split(/\*\*([^*]+)\*\*/g);
          return (
            <p key={idx}>
              {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold">{part}</strong> : part)}
            </p>
          );
        })}
      </div>
    );
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const adminsList = filteredUsers.filter((u) => u.role === "admin");
  const membersList = filteredUsers.filter((u) => u.role !== "admin");

  return (
    <DashboardLayout activeMenu="chat">
      <div onPaste={handlePaste} className="flex h-[calc(100vh-120px)] border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden bg-white/50 dark:bg-[#0f172a]/20 backdrop-blur-md">
        
        {/* Sidebar Panel: User list */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-900 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          
          {/* Sidebar Search & Group Creator */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chat Channels</span>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                + New Group
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500/50"
              />
              <LuSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
            </div>
          </div>

          {/* Users Feed List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {/* General Group Option */}
            <button
              onClick={() => {
                setSelectedUser(null);
                setSelectedGroup("general");
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                selectedGroup === "general"
                  ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <LuUsers className="text-lg" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs truncate">General Group Chat</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5">Company Channel</p>
              </div>
            </button>

            {/* Custom Groups */}
            {customGroups.length > 0 && (
              <div className="space-y-1 mt-2">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 block my-1">
                  Custom Groups ({customGroups.length})
                </span>
                {customGroups.map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedGroup(grp.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                      selectedGroup === grp.id
                        ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="w-8.5 h-8.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 font-bold text-xs flex-shrink-0">
                      👥
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs truncate font-bold text-slate-800 dark:text-slate-200">{grp.name}</h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">
                        {grp.members?.length || 0} Member(s)
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <hr className="border-slate-200 dark:border-slate-900 my-2" />
            
            {/* Recent Chats Section */}
            {recentChats.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 block mt-3 mb-1.5">Recent Chats</span>
                {recentChats.map((u) => {
                  const unread = unreadCounts[u._id] || 0;
                  return (
                    <button
                      key={u._id}
                      onClick={() => {
                        setSelectedGroup("");
                        setSelectedUser(u);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                        selectedUser?._id === u._id
                          ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {u.profileImageUrl ? (
                          <img
                            src={u.profileImageUrl}
                            alt={u.name}
                            className="w-8.5 h-8.5 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 shadow-inner">
                            {(u.name || '').trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs truncate font-bold text-slate-800 dark:text-slate-200">{u.name}</h4>
                          <p className="text-[9px] text-slate-400 dark:text-slate-550 truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="flex-shrink-0 ml-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <hr className="border-slate-200 dark:border-slate-900 my-2" />

            {/* Rest of feed: Flat for admin panel, Grouped for user panel */}
            {user?.role === "admin" ? (
              /* Flat Members List for Admin Panel */
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 block mt-3 mb-1.5">All Members</span>
                {filteredUsers.length === 0 ? (
                  <p className="text-center py-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No members found</p>
                ) : (
                  filteredUsers.map((u) => {
                    const unread = unreadCounts[u._id] || 0;
                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          setSelectedGroup("");
                          setSelectedUser(u);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                          selectedUser?._id === u._id
                            ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {u.profileImageUrl ? (
                            <img
                              src={u.profileImageUrl}
                              alt={u.name}
                              className="w-8.5 h-8.5 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 shadow-inner">
                              {(u.name || '').trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs truncate font-bold text-slate-800 dark:text-slate-200">{u.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-405 font-bold uppercase tracking-wider mt-1 inline-block">
                              {u.role}
                            </span>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="flex-shrink-0 ml-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              /* Grouped Sections for User Panel (Members) */
              <>
                {/* Administrators Section */}
                {adminsList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 block mt-3 mb-1.5">Administrators</span>
                    {adminsList.map((u) => {
                      const unread = unreadCounts[u._id] || 0;
                      return (
                        <button
                          key={u._id}
                          onClick={() => {
                            setSelectedGroup("");
                            setSelectedUser(u);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                            selectedUser?._id === u._id
                              ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {u.profileImageUrl ? (
                              <img
                                src={u.profileImageUrl}
                                alt={u.name}
                                className="w-8.5 h-8.5 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 shadow-inner">
                                {(u.name || '').trim().charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs truncate font-bold text-slate-800 dark:text-slate-200">{u.name}</h4>
                              <p className="text-[9px] text-slate-400 dark:text-slate-550 truncate mt-0.5">{u.email}</p>
                            </div>
                          </div>
                          {unread > 0 && (
                            <span className="flex-shrink-0 ml-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Co-Workers Section */}
                {membersList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 block mt-4 mb-1.5">Co-Workers</span>
                    {membersList.map((u) => {
                      const unread = unreadCounts[u._id] || 0;
                      return (
                        <button
                          key={u._id}
                          onClick={() => {
                            setSelectedGroup("");
                            setSelectedUser(u);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                            selectedUser?._id === u._id
                              ? "bg-indigo-500/10 border-r-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {u.profileImageUrl ? (
                              <img
                                src={u.profileImageUrl}
                                alt={u.name}
                                className="w-8.5 h-8.5 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 shadow-inner">
                                {(u.name || '').trim().charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs truncate font-bold text-slate-800 dark:text-slate-200">{u.name}</h4>
                              <p className="text-[9px] text-slate-400 dark:text-slate-550 truncate mt-0.5">{u.email}</p>
                            </div>
                          </div>
                          {unread > 0 && (
                            <span className="flex-shrink-0 ml-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredUsers.length === 0 && (
                  <p className="text-center py-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No members found</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Conversation window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#070a13]/30">
          
          {/* Header info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
            {selectedGroup ? (
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <LuUsers className="text-lg" />
              </div>
            ) : selectedUser?.profileImageUrl ? (
              <img
                src={selectedUser.profileImageUrl}
                alt={selectedUser.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-inner">
                {(selectedUser?.name || '').trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                {selectedGroup ? "General Group Chat" : selectedUser?.name}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                {selectedGroup ? "All Workspace Members" : `${selectedUser?.role} • ${selectedUser?.email}`}
              </p>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <span className="animate-spin h-5 w-5 text-indigo-500 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 text-slate-550 text-xs font-semibold">
                No messages yet. Send a message to start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id === user?._id || msg.sender?._id === user?.id || msg.sender === user?._id || msg.sender === user?.id;
                
                return (
                  <div key={msg._id} className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      msg.sender?.profileImageUrl ? (
                        <img
                          src={msg.sender.profileImageUrl}
                          alt={msg.sender.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0 mb-1 shadow-inner">
                          {(msg.sender?.name || '').trim().charAt(0).toUpperCase()}
                        </div>
                      )
                    )}
                    <div className="max-w-[70%] flex flex-col">
                      {!isMe && selectedGroup && (
                        <span className="text-[9px] text-slate-500 font-bold ml-2 mb-0.5">{msg.sender?.name}</span>
                      )}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                      }`}>
                        {msg.fileUrl ? (
                          msg.fileType?.startsWith("image/") ? (
                            <div className="flex flex-col gap-2 max-w-sm">
                              <img
                                src={`${msg.fileUrl}?token=${localStorage.getItem("token")}`}
                                alt={msg.fileName}
                                className="max-w-full max-h-60 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(`${msg.fileUrl}?token=${localStorage.getItem("token")}`, "_blank")}
                              />
                              {msg.text && <p className="mt-1">{msg.text}</p>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-2 bg-slate-950/20 dark:bg-slate-950/40 rounded-xl border border-slate-200/20 max-w-sm">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
                                PDF
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate text-[11px] text-slate-800 dark:text-slate-100">{msg.fileName}</p>
                                <p className="text-[9px] text-slate-500">PDF Document</p>
                              </div>
                              <button
                                onClick={() => window.open(`${msg.fileUrl}?token=${localStorage.getItem("token")}`, "_blank")}
                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                              >
                                View
                              </button>
                            </div>
                          )
                        ) : (
                          renderMessageContent(msg.text)
                        )}
                      </div>
                      <span className={`text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1 ml-1 ${isMe ? "text-right mr-1" : ""}`}>
                        {moment(msg.createdAt).format("hh:mm A")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-900 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf,image/*"
              className="hidden"
            />
            
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Upload PDF or Image"
            >
              {uploading ? (
                <LuLoader className="text-sm animate-spin" />
              ) : (
                <LuPaperclip className="text-sm" />
              )}
            </button>

            <input
              type="text"
              placeholder={selectedGroup ? "Message General Group..." : `Message ${selectedUser?.name}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              disabled={uploading}
              className="flex-1 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!text.trim() || uploading}
              className="p-3 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
            >
              <LuSend className="text-sm" />
            </button>
          </form>

        </div>

      </div>

      {/* Create Custom Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Create Chat Group
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Group Title
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Devs, Design Sync..."
                value={groupTitleInput}
                onChange={(e) => setGroupTitleInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Select Members ({selectedGroupMemberIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2">
                {users.map((u) => (
                  <label key={u._id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedGroupMemberIds.includes(u._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroupMemberIds([...selectedGroupMemberIds, u._id]);
                        } else {
                          setSelectedGroupMemberIds(selectedGroupMemberIds.filter((id) => id !== u._id));
                        }
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{u.name}</span>
                    <span className="text-[10px] text-slate-400">({u.role})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroupSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Chat;
