import React, { useRef, useEffect, useState } from "react";
import { LuSearch, LuInfo, LuChevronDown, LuUsers, LuLock } from "react-icons/lu";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import MediaViewer from "./MediaViewer";

export default function MessageThread({
    activeConversation,
    messages,
    currentUserId,
    onSendMessage,
    onSendVoiceNote,
    onReact,
    onEdit,
    onDelete,
    onOpenInfo,
    onlineUserIds,
    userStatuses,
    typingUsers,
    onTypingStart,
    onTypingStop
}) {
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [lightboxItems, setLightboxItems] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    };

    useEffect(() => {
        scrollToBottom(false);
    }, [activeConversation?.id]);

    useEffect(() => {
        if (!showScrollBottom) {
            scrollToBottom(true);
        }
    }, [messages.length]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isFarUp = scrollHeight - scrollTop - clientHeight > 250;
        setShowScrollBottom(isFarUp);
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b1329] text-center select-none">
                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
                    <LuUsers className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1">WhatsApp Web for Task Tracker</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Send and receive messages with real-time end-to-end room routing, typing indicators, rich media, and group governance.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <LuLock className="w-3.5 h-3.5" />
                    <span>Protected with JWT socket authentication</span>
                </div>
            </div>
        );
    }

    const isGroup = activeConversation.type === "group";
    const title = activeConversation.name || (isGroup ? "Group Chat" : "User");
    const avatarUrl = activeConversation.avatarUrl || activeConversation.peer?.profileImageUrl;
    const participants = activeConversation.participants || [];

    const isOnline = !isGroup && onlineUserIds?.has(activeConversation.id);
    const statusStr = isGroup
        ? `${participants.length} participants`
        : isOnline
        ? `Online (${userStatuses[activeConversation.id] || "Available"})`
        : "Offline";

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0b1329] relative select-none">
            {/* Thread Header */}
            <div className="p-3 px-4 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur flex items-center justify-between z-10">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenInfo}>
                    <div className="relative">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={title} className="w-10 h-10 rounded-full object-cover border border-slate-700/80" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                                {title.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0f172a]" />}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-100 leading-tight">{title}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{statusStr}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={onOpenInfo} className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-slate-800 transition-colors" title="Group Info">
                        <LuInfo className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            >
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg._id || msg.clientId}
                            message={msg}
                            currentUserId={currentUserId}
                            isGroup={isGroup}
                            onReply={(m) => setReplyToMessage(m)}
                            onReact={onReact}
                            onForward={(m) => {}}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStar={(m) => {}}
                            onInfo={(m) => {}}
                            onOpenMedia={(items, idx) => {
                                setLightboxItems(items);
                                setLightboxIndex(idx);
                            }}
                        />
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">
                        No messages yet. Say hi!
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Jump to Bottom Button */}
            {showScrollBottom && (
                <button
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-16 right-6 z-30 p-2.5 rounded-full bg-slate-800/90 text-emerald-400 border border-slate-700 shadow-2xl hover:scale-110 transition-transform"
                    title="Jump to bottom"
                >
                    <LuChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* Lightbox Media Viewer */}
            {lightboxItems && (
                <MediaViewer
                    mediaItems={lightboxItems}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxItems(null)}
                />
            )}

            {/* Composer Input Bar */}
            <MessageComposer
                onSendMessage={onSendMessage}
                onSendVoiceNote={onSendVoiceNote}
                replyToMessage={replyToMessage}
                onCancelReply={() => setReplyToMessage(null)}
                participants={participants}
                typingUsers={typingUsers}
                onTypingStart={onTypingStart}
                onTypingStop={onTypingStop}
            />
        </div>
    );
}
