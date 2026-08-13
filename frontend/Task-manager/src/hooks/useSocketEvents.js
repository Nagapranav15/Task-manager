import { useEffect } from "react";

export function useSocketEvents(socket, handlers) {
    const {
        onMessageNew,
        onMessageDelivered,
        onMessageRead,
        onMessageReact,
        onMessageEdit,
        onMessageDelete,
        onTypingUpdate,
        onGroupUpdated,
        onGroupDeleted,
        onGroupCreated
    } = handlers;

    useEffect(() => {
        if (!socket) return;

        if (onMessageNew) socket.on("message:new", onMessageNew);
        if (onMessageDelivered) socket.on("message:delivered", onMessageDelivered);
        if (onMessageRead) socket.on("message:read", onMessageRead);
        if (onMessageReact) socket.on("message:react", onMessageReact);
        if (onMessageEdit) socket.on("message:edit", onMessageEdit);
        if (onMessageDelete) socket.on("message:delete", onMessageDelete);
        if (onTypingUpdate) socket.on("typing:update", onTypingUpdate);
        if (onGroupUpdated) socket.on("group:updated", onGroupUpdated);
        if (onGroupDeleted) socket.on("group:deleted", onGroupDeleted);
        if (onGroupCreated) socket.on("group:created", onGroupCreated);

        return () => {
            if (onMessageNew) socket.off("message:new", onMessageNew);
            if (onMessageDelivered) socket.off("message:delivered", onMessageDelivered);
            if (onMessageRead) socket.off("message:read", onMessageRead);
            if (onMessageReact) socket.off("message:react", onMessageReact);
            if (onMessageEdit) socket.off("message:edit", onMessageEdit);
            if (onMessageDelete) socket.off("message:delete", onMessageDelete);
            if (onTypingUpdate) socket.off("typing:update", onTypingUpdate);
            if (onGroupUpdated) socket.off("group:updated", onGroupUpdated);
            if (onGroupDeleted) socket.off("group:deleted", onGroupDeleted);
            if (onGroupCreated) socket.off("group:created", onGroupCreated);
        };
    }, [
        socket,
        onMessageNew,
        onMessageDelivered,
        onMessageRead,
        onMessageReact,
        onMessageEdit,
        onMessageDelete,
        onTypingUpdate,
        onGroupUpdated,
        onGroupDeleted,
        onGroupCreated
    ]);
}
