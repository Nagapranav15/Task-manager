import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "whatsapp_offline_msg_queue";

export function useMessageQueue(socket, currentUserId) {
    const [queue, setQueue] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error("Failed to save offline queue", e);
        }
    }, [queue]);

    // Send or enqueue a message optimistically
    const sendOptimisticMessage = useCallback((msgPayload) => {
        const clientId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const optimisticMsg = {
            _id: clientId,
            clientId,
            conversation: {
                type: msgPayload.conversationType,
                group: msgPayload.conversationType === "group" ? msgPayload.conversationId : null,
                peer: msgPayload.conversationType === "dm" ? msgPayload.conversationId : null
            },
            sender: {
                _id: currentUserId
            },
            type: msgPayload.type || "text",
            text: msgPayload.text || "",
            attachments: msgPayload.attachments || [],
            replyTo: msgPayload.replyTo || null,
            mentions: msgPayload.mentions || [],
            status: "queued", // "queued" -> clock, "sent" -> single tick, "delivered" -> double tick, "read" -> blue double tick
            createdAt: new Date().toISOString()
        };

        if (socket && socket.connected) {
            socket.emit("message:send", { ...msgPayload, clientId }, (response) => {
                if (response && response.error) {
                    // Mark failed in queue
                    setQueue((prev) => prev.map((q) => q.clientId === clientId ? { ...q, status: "failed" } : q));
                }
            });
        } else {
            setQueue((prev) => [...prev, optimisticMsg]);
        }

        return optimisticMsg;
    }, [socket, currentUserId]);

    // Process unsent offline queue on reconnect
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            if (queue.length > 0) {
                const copy = [...queue];
                setQueue([]);
                copy.forEach((item) => {
                    if (item.status === "queued") {
                        socket.emit("message:send", {
                            conversationId: item.conversation.type === "group" ? item.conversation.group : item.conversation.peer,
                            conversationType: item.conversation.type,
                            type: item.type,
                            text: item.text,
                            attachments: item.attachments,
                            replyTo: item.replyTo,
                            mentions: item.mentions,
                            clientId: item.clientId
                        });
                    }
                });
            }
        };

        socket.on("connect", handleConnect);
        return () => {
            socket.off("connect", handleConnect);
        };
    }, [socket, queue]);

    return {
        queue,
        sendOptimisticMessage
    };
}
