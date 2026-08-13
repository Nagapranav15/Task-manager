import React from "react";
import moment from "moment";
import { LuCheck, LuCheckCheck, LuClock, LuVolumeX, LuPin } from "react-icons/lu";

export default function ConversationRow({
    conversation,
    activeConversation,
    onSelect,
    currentUserId,
    onlineUserIds,
    userStatuses
}) {
    const isActive = activeConversation && activeConversation.id === conversation.id;
    const isGroup = conversation.type === "group";

    const name = conversation.name || (isGroup ? "Group Chat" : "User");
    const avatarUrl = conversation.avatarUrl || conversation.peer?.profileImageUrl;
    const unreadCount = conversation.unreadCount || 0;
    const isPinned = conversation.isPinned || false;
    const isMuted = conversation.isMuted || false;
    const draft = conversation.draft || "";

    const lastMsg = conversation.lastMessage;
    const isOwnLastMsg = lastMsg && (lastMsg.sender?._id || lastMsg.sender) === currentUserId;

    // Status ticks helper
    const renderStatusTicks = () => {
        if (!isOwnLastMsg || !lastMsg) return null;

        if (lastMsg.status === "queued") {
            return <LuClock className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
        }

        const isReadByAll = lastMsg.deliveries && lastMsg.deliveries.length > 1 && lastMsg.deliveries.every(d => d.readAt);
        const isDeliveredToAll = lastMsg.deliveries && lastMsg.deliveries.length > 1;

        if (isReadByAll) {
            return <LuCheckCheck className="w-4 h-4 text-sky-400 inline ml-1" />;
        }
        if (isDeliveredToAll) {
            return <LuCheckCheck className="w-4 h-4 text-slate-400 inline ml-1" />;
        }
        return <LuCheck className="w-4 h-4 text-slate-400 inline ml-1" />;
    };

    // User online status dot
    const isOnline = !isGroup && onlineUserIds?.has(conversation.id);
    const userStatus = !isGroup ? (userStatuses[conversation.id] || "online") : null;

    let statusColor = "bg-slate-500";
    if (isOnline) {
        if (userStatus === "away") statusColor = "bg-amber-500";
        else if (userStatus === "dnd") statusColor = "bg-rose-500";
        else statusColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
    }

    const timeStr = lastMsg?.createdAt ? moment(lastMsg.createdAt).calendar(null, {
        sameDay: 'HH:mm',
        lastDay: '[Yesterday]',
        lastWeek: 'dddd',
        sameElse: 'DD/MM/YYYY'
    }) : "";

    return (
        <div
            onClick={() => onSelect(conversation)}
            className={`group relative flex items-center gap-3.5 px-4 py-3 cursor-pointer border-b border-slate-800/40 transition-all duration-200 select-none ${
                isActive
                    ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-l-4 border-l-emerald-500"
                    : "hover:bg-slate-800/50"
            }`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-700/60 shadow-md"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 font-bold text-lg shadow-md">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
                {!isGroup && (
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] ${statusColor}`} />
                )}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                        {name}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
                        {timeStr}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 truncate flex-1 leading-relaxed">
                        {draft ? (
                            <span className="italic text-emerald-400 font-medium">Draft: {draft}</span>
                        ) : lastMsg ? (
                            <>
                                {renderStatusTicks()}
                                {isGroup && lastMsg.sender?.name && (
                                    <span className="font-semibold text-slate-300 mr-1">
                                        {lastMsg.sender._id === currentUserId ? "You" : lastMsg.sender.name.split(" ")[0]}:
                                    </span>
                                )}
                                <span className={lastMsg.type === "system" ? "italic text-amber-400/90" : ""}>
                                    {lastMsg.text || (lastMsg.attachments?.length > 0 ? `📷 ${lastMsg.attachments[0].name || "Attachment"}` : "")}
                                </span>
                            </>
                        ) : (
                            <span className="italic text-slate-500">No messages yet</span>
                        )}
                    </p>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isMuted && <LuVolumeX className="w-3.5 h-3.5 text-slate-500" />}
                        {isPinned && <LuPin className="w-3.5 h-3.5 text-amber-400 rotate-45" />}
                        {unreadCount > 0 && (
                            <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-[#0f172a] font-extrabold text-[10px] flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
