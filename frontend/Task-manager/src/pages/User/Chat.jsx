import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";
import { 
  LuSend, LuUsers, LuUser, LuSearch, LuPaperclip, LuLoader, LuFile, 
  LuInfo, LuImage, LuFileText, LuExternalLink, LuX, LuLink, LuUserPlus, LuUserMinus, LuTrash2 
} from "react-icons/lu";
import moment from "moment";
import { toast } from "react-hot-toast";

const Chat = () => {
  const { user, socket, onlineUserIds, userStatuses, refreshTick } = useContext(UserContext);
  const [users, setUsers] = useState([]);

  const getTeamsStatusInfo = (userId) => {
    const isOnline = onlineUserIds?.has(userId);
    if (!isOnline) return { color: "bg-slate-400", title: "Offline" };
    const st = userStatuses[userId] || "online";
    if (st === "away") return { color: "bg-amber-500", title: "Away" };
    if (st === "dnd") return { color: "bg-rose-500", title: "Do Not Disturb" };
    if (st === "offline") return { color: "bg-slate-400", title: "Invisible" };
    return { color: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]", title: "Available (Teams)" };
  };
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
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [groupTitleInput, setGroupTitleInput] = useState("");
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const [addMembersSelectedIds, setAddMembersSelectedIds] = useState([]);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [infoTab, setInfoTab] = useState("members"); // "members", "media", "docs", "links"
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleCreateGroupSubmit = () => {
    if (!groupTitleInput.trim()) {
      toast.error("Please enter a group title");
      return;
    }
    const newGroup = {
      id: `group_${Date.now()}`,
      name: groupTitleInput.trim(),
      createdBy: user?._id || user?.id,
      members: Array.from(new Set([user?._id || user?.id, ...selectedGroupMemberIds])),
    };
    const updated = [...customGroups, newGroup];
    setCustomGroups(updated);
    localStorage.setItem("custom_chat_groups", JSON.stringify(updated));
    setSelectedGroup(newGroup.id);
    setSelectedUser(null);
    setGroupTitleInput("");
    setSelectedGroupMemberIds([]);
    setIsGroupModalOpen(false);
    toast.success(`Group "${newGroup.name}" created!`);
  };

  const handleAddMembersToGroup = () => {
    if (!selectedGroup || selectedGroup === "general") return;
    const updated = customGroups.map((g) => {
      if (g.id === selectedGroup) {
        const uniqueMembers = Array.from(new Set([...(g.members || []), ...addMembersSelectedIds]));
        return { ...g, members: uniqueMembers };
      }
      return g;
    });
    setCustomGroups(updated);
    localStorage.setItem("custom_chat_groups", JSON.stringify(updated));
    setIsAddMemberModalOpen(false);
    setAddMembersSelectedIds([]);
    toast.success("Added members to group!");
  };

  const handleRemoveMemberFromGroup = (memberId) => {
    if (!selectedGroup || selectedGroup === "general") return;
    const updated = customGroups.map((g) => {
      if (g.id === selectedGroup) {
        const filtered = (g.members || []).filter((id) => id !== memberId);
        return { ...g, members: filtered };
      }
      return g;
    });
    setCustomGroups(updated);
    localStorage.setItem("custom_chat_groups", JSON.stringify(updated));
    toast.success("Removed member from group!");
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup || selectedGroup === "general") return;
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    const updated = customGroups.filter((g) => g.id !== selectedGroup);
    setCustomGroups(updated);
    localStorage.setItem("custom_chat_groups", JSON.stringify(updated));
    setSelectedGroup("general");
    setShowInfoDrawer(false);
    toast.success("Group deleted successfully!");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        const list = Array.isArray(response.data) ? response.data : response.data.users || [];
        setUsers(list.filter((u) => u._id !== user?._id && u._id !== user?.id));
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, [user, refreshTick]);

  useEffect(() => {
    const fetchAllDMs = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.CHAT.GET_MESSAGES("all"));
        setAllDMs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch DM summary", error);
      }
    };
    fetchAllDMs();
  }, [messages, refreshTick]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (selectedGroup) {
          const endpoint = selectedGroup === "general" 
            ? API_PATHS.CHAT.GET_MESSAGES("group") 
            : API_PATHS.CHAT.GET_MESSAGES(`group_${selectedGroup}`);
          const response = await axiosInstance.get(endpoint);
          setMessages(Array.isArray(response.data) ? response.data : []);
        } else if (selectedUser) {
          const response = await axiosInstance.get(API_PATHS.CHAT.GET_MESSAGES(selectedUser._id));
          setMessages(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, selectedGroup, refreshTick]);

  useEffect(() => {
    if (!socket) return;

    if (selectedGroup) {
      const room = selectedGroup === "general" ? "general_group" : `custom_${selectedGroup}`;
      socket.emit("join_group_chat", room);
    } else if (selectedUser) {
      socket.emit("join_chat", { targetUserId: selectedUser._id });
    }

    const handleReceiveMessage = (message) => {
      if (selectedGroup) {
        const expectedRoom = selectedGroup === "general" ? "general_group" : `custom_${selectedGroup}`;
        if (message.groupChatId === expectedRoom || message.isGroupChat) {
          setMessages((prev) => [...prev, message]);
        }
      } else if (selectedUser) {
        const senderId = message.sender?._id || message.sender;
        if (senderId === selectedUser._id || senderId === user?._id) {
          setMessages((prev) => [...prev, message]);
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedUser, selectedGroup, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      const currentUserId = user?._id || user?.id;
      localStorage.setItem(`chat_last_read_${selectedUser._id}`, new Date().toISOString());
    }
  }, [selectedUser, messages, user]);

  const { recentChats, unreadCounts } = useMemo(() => {
    const counts = {};
    const latestMessageTime = {};

    const currentUserId = user?._id || user?.id;

    (allDMs || []).forEach((msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const recipientId = msg.recipient?._id || msg.recipient;
      const otherUserId = senderId === currentUserId ? recipientId : senderId;

      if (otherUserId) {
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

  const activeConversationInfo = useMemo(() => {
    let title = "General Group Chat";
    let sub = "All Workspace Members";
    let memberList = [user, ...(users || [])].filter(Boolean);

    if (selectedGroup && selectedGroup !== "general") {
      const grp = customGroups.find((g) => g.id === selectedGroup);
      if (grp) {
        title = grp.name;
        sub = `${grp.members?.length || 0} Member(s)`;
        memberList = [user, ...(users || [])].filter((u) => u && (u._id === user?._id || grp.members?.includes(u._id)));
      }
    } else if (selectedUser) {
      title = selectedUser.name;
      sub = `${selectedUser.role} • ${selectedUser.email}`;
      memberList = [user, selectedUser].filter(Boolean);
    }

    const mediaList = (messages || []).filter(
      (m) => m.fileUrl && (m.fileType?.startsWith("image/") || m.fileUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i))
    );
    const docsList = (messages || []).filter(
      (m) => m.fileUrl && !m.fileType?.startsWith("image/") && !m.fileUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i)
    );

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const linksList = [];
    (messages || []).forEach((m) => {
      if (m.text) {
        const matches = m.text.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            const formatted = url.startsWith("http") ? url : `https://${url}`;
            linksList.push({
              id: `${m._id}-${url}`,
              url: formatted,
              sender: m.sender?.name || "Member",
              createdAt: m.createdAt,
            });
          });
        }
      }
    });

    return { title, sub, memberList, mediaList, docsList, linksList };
  }, [selectedGroup, selectedUser, customGroups, users, user, messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    const senderId = user?._id || user?.id;

    if (selectedGroup) {
      const room = selectedGroup === "general" ? "general_group" : `custom_${selectedGroup}`;
      const payload = {
        senderId,
        text: text.trim(),
        group: selectedGroup,
        groupChatId: room,
      };
      socket.emit("send_group_message", payload);
      socket.emit("chat_message", payload);
    } else if (selectedUser) {
      const payload = {
        senderId,
        targetUserId: selectedUser._id,
        receiverId: selectedUser._id,
        text: text.trim(),
      };
      socket.emit("send_message", payload);
      socket.emit("chat_message", payload);
    }

    setText("");
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await axiosInstance.post(API_PATHS.AUTH.UPLOAD_IMAGE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = res.data?.imageUrl;
      if (!fileUrl) throw new Error("Upload failed");

      const senderId = user?._id || user?.id;

      if (selectedGroup) {
        const room = selectedGroup === "general" ? "general_group" : `custom_${selectedGroup}`;
        const payload = {
          senderId,
          text: `[Attachment: ${file.name}]`,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
          group: selectedGroup,
          groupChatId: room,
        };
        socket.emit("send_group_message", payload);
        socket.emit("chat_message", payload);
      } else if (selectedUser) {
        const payload = {
          senderId,
          targetUserId: selectedUser._id,
          receiverId: selectedUser._id,
          text: `[Attachment: ${file.name}]`,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
        };
        socket.emit("send_message", payload);
        socket.emit("chat_message", payload);
      }

      toast.success("File shared successfully!");
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleFileUpload(blob);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout activeMenu="chat">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      <div className="flex h-[calc(100vh-110px)] bg-white dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
        
        {/* Left Sidebar: Workspace Groups & Direct Messages */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-900 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                Chat Workspace
              </h2>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                title="Create Custom Group"
              >
                <span>+ Group</span>
              </button>
            </div>

            <div className="relative">
              <LuSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
                Workspace Channels
              </span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    setSelectedGroup("general");
                    setSelectedUser(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    selectedGroup === "general"
                      ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                      : "text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedGroup === "general" ? "bg-white/20" : "bg-indigo-500/10 text-indigo-400"}`}>
                      <LuUsers className="text-sm" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">General Group</p>
                      <p className={`text-[9px] leading-tight mt-0.5 ${selectedGroup === "general" ? "text-indigo-100" : "text-slate-400"}`}>
                        Company Channel
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${selectedGroup === "general" ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-400"}`}>
                    ALL
                  </span>
                </button>

                {customGroups.map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => {
                      setSelectedGroup(grp.id);
                      setSelectedUser(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      selectedGroup === grp.id
                        ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                        : "text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedGroup === grp.id ? "bg-white/20" : "bg-cyan-500/10 text-cyan-400"}`}>
                        <LuUsers className="text-sm" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold leading-tight">{grp.name}</p>
                        <p className={`text-[9px] leading-tight mt-0.5 ${selectedGroup === grp.id ? "text-indigo-100" : "text-slate-400"}`}>
                          {grp.members?.length || 0} Members
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${selectedGroup === grp.id ? "bg-white/20 text-white" : "bg-cyan-500/10 text-cyan-400"}`}>
                      GRP
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {recentChats.length > 0 && !search && (
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 px-2 flex items-center gap-1">
                  <span>Recent DMs</span>
                </span>
                <div className="mt-1 space-y-1">
                  {recentChats.map((u) => {
                    const isSelected = !selectedGroup && selectedUser?._id === u._id;
                    const unread = unreadCounts[u._id] || 0;
                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u);
                          setSelectedGroup(null);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                            : "text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            {u.profileImageUrl ? (
                              <img
                                src={u.profileImageUrl}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400"}`}>
                                {(u.name || "").trim().charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isSelected ? "border-indigo-650" : "border-white dark:border-slate-900"} ${getTeamsStatusInfo(u._id).color}`}
                              title={`Teams Status: ${getTeamsStatusInfo(u._id).title}`}
                            />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{u.name}</p>
                            <p className={`text-[9px] leading-tight mt-0.5 truncate ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                              {u.role}
                            </p>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full shadow-md animate-pulse">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
                All Direct Messages
              </span>
              <div className="mt-1 space-y-1">
                {filteredUsers.map((u) => {
                  const isSelected = !selectedGroup && selectedUser?._id === u._id;
                  const unread = unreadCounts[u._id] || 0;
                  const stInfo = getTeamsStatusInfo(u._id);
                  return (
                    <button
                      key={u._id}
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedGroup(null);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                          : "text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          {u.profileImageUrl ? (
                            <img
                              src={u.profileImageUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400"}`}>
                              {(u.name || "").trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span 
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isSelected ? "border-indigo-650" : "border-white dark:border-slate-900"} ${stInfo.color}`}
                            title={`Teams Status: ${stInfo.title}`}
                          />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold leading-tight truncate">{u.name}</p>
                          <p className={`text-[9px] leading-tight mt-0.5 truncate ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                            {u.email}
                          </p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full shadow-md animate-pulse">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-center py-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No members found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#070a13]/30 min-w-0">
          
          {/* Header info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-3 min-w-0">
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
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest truncate">
                  {activeConversationInfo.title}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold truncate">
                  {activeConversationInfo.sub}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoDrawer((prev) => !prev)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                showInfoDrawer
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
              }`}
              title="Toggle WhatsApp Group / Contact Info"
            >
              <LuInfo className="text-base text-indigo-500" />
              <span className="hidden sm:inline">Info & Media</span>
            </button>
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
                const senderName = isMe ? "You" : msg.sender?.name || "Member";
                const senderAvatar = msg.sender?.profileImageUrl;

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-end gap-2 max-w-[75%]">
                      {!isMe && (
                        senderAvatar ? (
                          <img
                            src={senderAvatar}
                            alt={senderName}
                            className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold uppercase mb-1 flex-shrink-0">
                            {senderName.charAt(0)}
                          </div>
                        )
                      )}

                      <div
                        className={`rounded-2xl p-3 text-xs shadow-md ${
                          isMe
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none"
                            : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none"
                        }`}
                      >
                        {!isMe && selectedGroup && (
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">
                            {senderName}
                          </p>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.fileUrl && (
                          <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-800">
                            {msg.fileType?.startsWith("image/") ? (
                              <a
                                href={`${msg.fileUrl}?token=${localStorage.getItem("token")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl overflow-hidden max-w-xs border border-white/20 hover:opacity-95 transition-opacity"
                              >
                                <img
                                  src={`${msg.fileUrl}?token=${localStorage.getItem("token")}`}
                                  alt={msg.fileName || "Attachment"}
                                  className="w-full h-auto max-h-60 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={`${msg.fileUrl}?token=${localStorage.getItem("token")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 rounded-xl text-xs font-bold transition-all"
                              >
                                <LuFile className="text-sm" />
                                <span className="truncate max-w-[150px]">{msg.fileName || "Attachment"}</span>
                              </a>
                            )}
                          </div>
                        )}
                        <span className={`block text-[8px] mt-1 text-right font-medium ${isMe ? "text-indigo-200" : "text-slate-400"}`}>
                          {moment(msg.createdAt).format("hh:mm A")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-900 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Upload File or Image"
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

        {/* WhatsApp-Style Right Info Panel */}
        {showInfoDrawer && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-900 bg-slate-50/70 dark:bg-slate-950/30 flex flex-col h-full animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Group & Contact Info
              </span>
              <button
                onClick={() => setShowInfoDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <LuX className="text-base" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-5 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-900 text-center">
              {selectedGroup ? (
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl mb-3 shadow-inner">
                  <LuUsers />
                </div>
              ) : selectedUser?.profileImageUrl ? (
                <img
                  src={selectedUser.profileImageUrl}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-indigo-500/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xl font-extrabold mb-3 shadow-inner">
                  {(selectedUser?.name || "").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {activeConversationInfo.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                {activeConversationInfo.sub}
              </p>

              {/* Group Action Buttons */}
              {selectedGroup && selectedGroup !== "general" && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <LuUserPlus className="text-xs" />
                    <span>Add Members</span>
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <LuTrash2 className="text-xs" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tab Navigation (4 Tabs: Members, Media, Docs, Links) */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-900 text-[10px] font-bold bg-slate-100/50 dark:bg-slate-900/30">
              <button
                onClick={() => setInfoTab("members")}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  infoTab === "members"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-extrabold bg-white dark:bg-slate-900/40"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Members ({activeConversationInfo.memberList.length})
              </button>
              <button
                onClick={() => setInfoTab("media")}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  infoTab === "media"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-extrabold bg-white dark:bg-slate-900/40"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Media ({activeConversationInfo.mediaList.length})
              </button>
              <button
                onClick={() => setInfoTab("docs")}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  infoTab === "docs"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-extrabold bg-white dark:bg-slate-900/40"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Docs ({activeConversationInfo.docsList.length})
              </button>
              <button
                onClick={() => setInfoTab("links")}
                className={`flex-1 py-2.5 text-center transition-all cursor-pointer ${
                  infoTab === "links"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-extrabold bg-white dark:bg-slate-900/40"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Links ({activeConversationInfo.linksList.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {infoTab === "members" && (
                <div className="space-y-1.5">
                  {activeConversationInfo.memberList.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80"
                    >
                      {m.profileImageUrl ? (
                        <img
                          src={m.profileImageUrl}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] flex items-center justify-center uppercase flex-shrink-0">
                          {(m.name || "").trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {m.name} {m._id === user?._id && <span className="text-[9px] text-indigo-500 font-extrabold">(You)</span>}
                          </h5>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{m.email}</p>
                      </div>

                      {/* Member Removal for Custom Groups */}
                      {selectedGroup && selectedGroup !== "general" && m._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMemberFromGroup(m._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove from group"
                        >
                          <LuUserMinus className="text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {infoTab === "media" && (
                activeConversationInfo.mediaList.length === 0 ? (
                  <p className="text-center py-10 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No shared media yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {activeConversationInfo.mediaList.map((m) => (
                      <a
                        key={m._id}
                        href={`${m.fileUrl}?token=${localStorage.getItem("token")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900"
                      >
                        <img
                          src={`${m.fileUrl}?token=${localStorage.getItem("token")}`}
                          alt={m.fileName || "Media"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <LuExternalLink className="text-sm" />
                        </div>
                      </a>
                    ))}
                  </div>
                )
              )}

              {infoTab === "docs" && (
                activeConversationInfo.docsList.length === 0 ? (
                  <p className="text-center py-10 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No shared documents yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeConversationInfo.docsList.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <LuFileText className="text-sm" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={m.fileName}>
                              {m.fileName || "Document"}
                            </p>
                            <p className="text-[9px] text-slate-400">{moment(m.createdAt).format("D MMM YYYY")}</p>
                          </div>
                        </div>
                        <a
                          href={`${m.fileUrl}?token=${localStorage.getItem("token")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                          title="Open Document"
                        >
                          <LuExternalLink className="text-sm" />
                        </a>
                      </div>
                    ))}
                  </div>
                )
              )}

              {infoTab === "links" && (
                activeConversationInfo.linksList.length === 0 ? (
                  <p className="text-center py-10 text-[10px] text-slate-500 font-bold uppercase tracking-wider">No shared web links yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeConversationInfo.linksList.map((linkItem) => (
                      <div
                        key={linkItem.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <LuLink className="text-sm" />
                          </div>
                          <div className="min-w-0">
                            <a
                              href={linkItem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                            >
                              {linkItem.url}
                            </a>
                            <p className="text-[9px] text-slate-400">Shared by {linkItem.sender} • {moment(linkItem.createdAt).format("D MMM")}</p>
                          </div>
                        </div>
                        <a
                          href={linkItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0"
                        >
                          <LuExternalLink className="text-sm" />
                        </a>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

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
                      className="rounded border-slate-300 dark:border-slate-800 text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{u.name}</span>
                    <span className="text-[9px] text-slate-400">({u.role})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroupSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Add Members to Group
              </h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Select Team Members to Add
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2">
                {users
                  .filter((u) => !activeConversationInfo.memberList.some((m) => m._id === u._id))
                  .map((u) => (
                    <label key={u._id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={addMembersSelectedIds.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAddMembersSelectedIds([...addMembersSelectedIds, u._id]);
                          } else {
                            setAddMembersSelectedIds(addMembersSelectedIds.filter((id) => id !== u._id));
                          }
                        }}
                        className="rounded border-slate-300 dark:border-slate-800 text-indigo-600"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{u.name}</span>
                      <span className="text-[9px] text-slate-400">({u.role})</span>
                    </label>
                  ))}
                {users.filter((u) => !activeConversationInfo.memberList.some((m) => m._id === u._id)).length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-500 font-semibold">All workspace users are already in this group!</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMembersToGroup}
                disabled={addMembersSelectedIds.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md cursor-pointer"
              >
                Add Selected Members
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Chat;
