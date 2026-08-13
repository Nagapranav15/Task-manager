import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

export function useConversation(activeConversation, socket, currentUserId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [draft, setDraft] = useState("");
    const [typingUsers, setTypingUsers] = useState(new Map());

    const activeRef = useRef(activeConversation);
    useEffect(() => {
        activeRef.current = activeConversation;
    }, [activeConversation]);

    // Fetch initial messages for active conversation
    const fetchMessages = useCallback(async () => {
        if (!activeConversation) return;

        setLoading(true);
        try {
            const type = activeConversation.type; // "group" or "dm"
            const id = activeConversation.id;
            const url = `/api/chat/messages?conversationType=${type}&conversationId=${id}&limit=150`;

            const res = await axiosInstance.get(url);
            if (Array.isArray(res.data)) {
                setMessages(res.data);
                setHasMore(res.data.length >= 150);

                // Mark read via socket
                if (socket && res.data.length > 0) {
                    const lastMsg = res.data[res.data.length - 1];
                    socket.emit("message:read", {
                        conversationId: id,
                        conversationType: type,
                        upToMessageId: lastMsg._id
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch conversation messages:", err);
        } finally {
            setLoading(false);
        }
    }, [activeConversation, socket]);

    useEffect(() => {
        fetchMessages();
        setTypingUsers(new Map());
    }, [fetchMessages]);

    // Append new incoming message or reconcile optimistic message by clientId / _id
    const addOrUpdateMessage = useCallback((newMsg) => {
        setMessages((prev) => {
            const currentActive = activeRef.current;
            if (!currentActive) return prev;

            const isCurrentGroup = currentActive.type === "group" && 
                newMsg.conversation?.type === "group" && 
                newMsg.conversation?.group === currentActive.id;

            const isCurrentDM = currentActive.type === "dm" && 
                newMsg.conversation?.type === "dm" && 
                (newMsg.sender?._id === currentActive.id || newMsg.conversation?.peer === currentActive.id);

            if (!isCurrentGroup && !isCurrentDM) return prev;

            // Reconcile by clientId if present
            if (newMsg.clientId) {
                const existingIdx = prev.findIndex((m) => m.clientId === newMsg.clientId || m._id === newMsg.clientId);
                if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = newMsg;
                    return updated;
                }
            }

            // Deduplicate by _id
            if (prev.some((m) => m._id === newMsg._id)) {
                return prev;
            }

            return [...prev, newMsg];
        });
    }, []);

    // Update reaction on a message
    const updateReaction = useCallback(({ messageId, reactions }) => {
        setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, reactions } : m));
    }, []);

    // Update edit on a message
    const updateEdit = useCallback(({ messageId, text, editedAt }) => {
        setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, text, editedAt } : m));
    }, []);

    // Update deletion on a message
    const updateDelete = useCallback(({ messageId, scope, deletedForEveryoneAt }) => {
        setMessages((prev) => {
            if (scope === "me") {
                return prev.filter((m) => m._id !== messageId);
            }
            return prev.map((m) => m._id === messageId ? { ...m, text: "This message was deleted", attachments: [], deletedForEveryoneAt } : m);
        });
    }, []);

    // Handle typing indicator updates
    const handleTypingUpdate = useCallback(({ conversationId, userId, userName, isTyping }) => {
        const currentActive = activeRef.current;
        if (!currentActive || currentActive.id !== conversationId) return;

        setTypingUsers((prev) => {
            const nextMap = new Map(prev);
            if (isTyping && userId !== currentUserId) {
                nextMap.set(userId, userName);
            } else {
                nextMap.delete(userId);
            }
            return nextMap;
        });
    }, [currentUserId]);

    return {
        messages,
        setMessages,
        loading,
        hasMore,
        draft,
        setDraft,
        typingUsers,
        addOrUpdateMessage,
        updateReaction,
        updateEdit,
        updateDelete,
        handleTypingUpdate,
        refetch: fetchMessages
    };
}
