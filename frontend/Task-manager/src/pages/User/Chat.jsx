import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";

import ConversationList from "../../components/chat/ConversationList";
import MessageThread from "../../components/chat/MessageThread";
import GroupInfoPanel from "../../components/chat/GroupInfoPanel";
import CreateGroupModal from "../../components/chat/CreateGroupModal";

import { useConversation } from "../../hooks/useConversation";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import { useMessageQueue } from "../../hooks/useMessageQueue";

const Chat = () => {
    const { user, socket, onlineUserIds, userStatuses } = useContext(UserContext);
    const currentUserId = user?._id || user?.id;

    const [groups, setGroups] = useState([]);
    const [dms, setDms] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null); // { id, type: "group"|"dm", name, ... }
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    const { queue, sendOptimisticMessage } = useMessageQueue(socket, currentUserId);

    const {
        messages,
        setMessages,
        loading,
        typingUsers,
        addOrUpdateMessage,
        updateReaction,
        updateEdit,
        updateDelete,
        handleTypingUpdate,
        refetch
    } = useConversation(activeConversation, socket, currentUserId);

    // Fetch User's Groups & DM contacts
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            const [groupsRes, usersRes] = await Promise.all([
                axiosInstance.get("/api/chat/groups"),
                axiosInstance.get("/api/users")
            ]);

            if (Array.isArray(groupsRes.data)) {
                setGroups(groupsRes.data);
                // Auto-select General group or first group if none active
                if (!activeConversation && groupsRes.data.length > 0) {
                    const general = groupsRes.data.find(g => g.name === "General") || groupsRes.data[0];
                    setActiveConversation({
                        id: general._id,
                        type: "group",
                        name: general.name,
                        description: general.description,
                        avatarUrl: general.avatarUrl,
                        participants: general.participants,
                        settings: general.settings
                    });
                }
            }

            if (Array.isArray(usersRes.data)) {
                const otherUsers = usersRes.data.filter(u => (u._id || u.id) !== currentUserId);
                setDms(otherUsers);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        }
    }, [user, currentUserId, activeConversation]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Socket Event Handlers
    const socketHandlers = useMemo(() => ({
        onMessageNew: (msg) => {
            addOrUpdateMessage(msg);
        },
        onMessageDelivered: () => {},
        onMessageRead: () => {},
        onMessageReact: (payload) => {
            updateReaction(payload);
        },
        onMessageEdit: (payload) => {
            updateEdit(payload);
        },
        onMessageDelete: (payload) => {
            updateDelete(payload);
        },
        onTypingUpdate: (payload) => {
            handleTypingUpdate(payload);
        },
        onGroupUpdated: (updatedGroup) => {
            setGroups((prev) => prev.map((g) => g._id === updatedGroup._id ? updatedGroup : g));
            if (activeConversation?.id === updatedGroup._id) {
                setActiveConversation((prev) => ({
                    ...prev,
                    name: updatedGroup.name,
                    description: updatedGroup.description,
                    avatarUrl: updatedGroup.avatarUrl,
                    participants: updatedGroup.participants,
                    settings: updatedGroup.settings
                }));
            }
        },
        onGroupDeleted: ({ groupId }) => {
            setGroups((prev) => prev.filter((g) => g._id !== groupId));
            if (activeConversation?.id === groupId) {
                setActiveConversation(null);
                setShowInfoPanel(false);
            }
        },
        onGroupCreated: (newGroup) => {
            setGroups((prev) => [newGroup, ...prev]);
        }
    }), [addOrUpdateMessage, updateReaction, updateEdit, updateDelete, handleTypingUpdate, activeConversation]);

    useSocketEvents(socket, socketHandlers);

    // Merge Queue into Messages for current conversation
    const displayMessages = useMemo(() => {
        if (!activeConversation) return messages;
        const currentQueue = queue.filter(q =>
            (activeConversation.type === "group" && q.conversation.group === activeConversation.id) ||
            (activeConversation.type === "dm" && q.conversation.peer === activeConversation.id)
        );
        return [...messages, ...currentQueue];
    }, [messages, queue, activeConversation]);

    // Format all conversations for ConversationList
    const conversationListItems = useMemo(() => {
        const groupItems = groups.map((g) => ({
            id: g._id,
            type: "group",
            name: g.name,
            avatarUrl: g.avatarUrl,
            description: g.description,
            participants: g.participants,
            settings: g.settings,
            unreadCount: 0,
            isPinned: false
        }));

        const dmItems = dms.map((u) => ({
            id: u._id || u.id,
            type: "dm",
            name: u.name,
            avatarUrl: u.profileImageUrl,
            peer: u,
            unreadCount: 0,
            isPinned: false
        }));

        return [...groupItems, ...dmItems];
    }, [groups, dms]);

    // Send Handlers
    const handleSendMessage = (msgPayload) => {
        if (!activeConversation) return;

        const optimisticMsg = sendOptimisticMessage({
            ...msgPayload,
            conversationId: activeConversation.id,
            conversationType: activeConversation.type
        });

        addOrUpdateMessage(optimisticMsg);
    };

    const handleSendVoiceNote = async ({ blob, durationMs, waveform }) => {
        if (!activeConversation) return;
        try {
            const formData = new FormData();
            formData.append("file", blob, `voice_${Date.now()}.webm`);

            const uploadRes = await axiosInstance.post("/api/chat/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            handleSendMessage({
                type: "voice",
                text: "",
                attachments: [{
                    url: uploadRes.data.url,
                    name: uploadRes.data.name,
                    mime: uploadRes.data.mime,
                    size: uploadRes.data.size,
                    durationMs,
                    waveform
                }]
            });
        } catch (err) {
            toast.error("Failed to upload voice note");
        }
    };

    const handleReact = (messageId, emoji) => {
        if (socket) {
            socket.emit("message:react", { messageId, emoji });
        }
    };

    const handleEdit = (message) => {
        const newText = prompt("Edit message:", message.text);
        if (newText !== null && newText.trim() && socket) {
            socket.emit("message:edit", { messageId: message._id, text: newText.trim() });
        }
    };

    const handleDelete = (message) => {
        const choice = window.confirm("Delete for everyone? Click Cancel to delete for yourself only.");
        const scope = choice ? "everyone" : "me";
        if (socket) {
            socket.emit("message:delete", { messageId: message._id, scope });
        }
    };

    const handleLeaveGroup = async () => {
        if (!activeConversation || activeConversation.type !== "group") return;
        if (!window.confirm("Are you sure you want to leave this group?")) return;

        try {
            await axiosInstance.post(`/api/chat/groups/${activeConversation.id}/leave`);
            toast.success("Left group successfully");
            setGroups(prev => prev.filter(g => g._id !== activeConversation.id));
            setActiveConversation(null);
            setShowInfoPanel(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to leave group");
        }
    };

    const handleDeleteGroup = async () => {
        if (!activeConversation || activeConversation.type !== "group") return;
        if (!window.confirm("Delete this group permanently for everyone?")) return;

        try {
            await axiosInstance.delete(`/api/chat/groups/${activeConversation.id}`);
            toast.success("Group deleted");
            setGroups(prev => prev.filter(g => g._id !== activeConversation.id));
            setActiveConversation(null);
            setShowInfoPanel(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete group");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-[#0f172a] rounded-3xl border border-slate-800/80 shadow-2xl">
                {/* Conversation List Sidebar */}
                <ConversationList
                    conversations={conversationListItems}
                    activeConversation={activeConversation}
                    onSelectConversation={(conv) => {
                        setActiveConversation(conv);
                        setShowInfoPanel(false);
                    }}
                    onOpenCreateGroupModal={() => setIsCreateGroupOpen(true)}
                    currentUserId={currentUserId}
                    onlineUserIds={onlineUserIds}
                    userStatuses={userStatuses}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {/* Main Message Thread */}
                <MessageThread
                    activeConversation={activeConversation}
                    messages={displayMessages}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    onSendVoiceNote={handleSendVoiceNote}
                    onReact={handleReact}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpenInfo={() => setShowInfoPanel(!showInfoPanel)}
                    onlineUserIds={onlineUserIds}
                    userStatuses={userStatuses}
                    typingUsers={typingUsers}
                    onTypingStart={() => {
                        if (socket && activeConversation) {
                            socket.emit("typing:start", {
                                conversationId: activeConversation.id,
                                conversationType: activeConversation.type
                            });
                        }
                    }}
                    onTypingStop={() => {
                        if (socket && activeConversation) {
                            socket.emit("typing:stop", {
                                conversationId: activeConversation.id,
                                conversationType: activeConversation.type
                            });
                        }
                    }}
                />

                {/* Right Info Drawer */}
                {showInfoPanel && activeConversation && (
                    <GroupInfoPanel
                        group={groups.find(g => g._id === activeConversation.id) || activeConversation}
                        currentUserId={currentUserId}
                        onClose={() => setShowInfoPanel(false)}
                        onUpdateGroup={(updated) => {
                            setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
                            setActiveConversation(prev => ({ ...prev, ...updated }));
                        }}
                        onLeaveGroup={handleLeaveGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onlineUserIds={onlineUserIds}
                        userStatuses={userStatuses}
                        onJumpToMessage={(msgId) => {}}
                    />
                )}
            </div>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                currentUserId={currentUserId}
                onGroupCreated={(newGroup) => {
                    setGroups(prev => [newGroup, ...prev]);
                    setActiveConversation({
                        id: newGroup._id,
                        type: "group",
                        name: newGroup.name,
                        description: newGroup.description,
                        avatarUrl: newGroup.avatarUrl,
                        participants: newGroup.participants,
                        settings: newGroup.settings
                    });
                }}
            />
        </DashboardLayout>
    );
};

export default Chat;
