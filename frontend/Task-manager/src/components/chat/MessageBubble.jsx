import React, { useState } from "react";
import moment from "moment";
import { 
    LuCheck, LuCheckCheck, LuClock, LuCornerUpLeft, LuSmile, LuShare2, 
    LuPencil, LuTrash2, LuStar, LuInfo, LuFileText, LuMapPin, LuUserCheck, LuPlay, LuPause 

} from "react-icons/lu";

export default function MessageBubble({
    message,
    currentUserId,
    isGroup,
    onReply,
    onReact,
    onForward,
    onEdit,
    onDelete,
    onStar,
    onInfo,
    onOpenMedia
}) {
    const [showActions, setShowActions] = useState(false);
    const [showReactionsRow, setShowReactionsRow] = useState(false);

    const isOwn = (message.sender?._id || message.sender) === currentUserId;
    const isSystem = message.type === "system";

    // System Message Rendering
    if (isSystem) {
        const event = message.systemEvent || {};
        const actorName = event.actor?.name || "Someone";
        const targetNames = event.targets?.map((t) => t.name).join(", ") || "";

        let text = message.text;
        if (event.kind === "member_added") text = `${actorName} added ${targetNames}`;
        else if (event.kind === "member_left") text = `${actorName} left`;
        else if (event.kind === "member_removed") text = `${actorName} removed ${targetNames}`;
        else if (event.kind === "member_promoted") text = `${actorName} made ${targetNames} an admin`;
        else if (event.kind === "member_demoted") text = `${actorName} demoted ${targetNames}`;
        else if (event.kind === "group_name_changed") text = `${actorName} changed group name to "${event.value}"`;

        return (
            <div className="flex justify-center my-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-amber-300/90 shadow-sm text-center">
                    {text}
                </div>
            </div>
        );
    }

    // Status ticks helper
    const renderStatusTicks = () => {
        if (!isOwn) return null;

        if (message.status === "queued") {
            return <LuClock className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
        }

        const isReadByAll = message.deliveries && message.deliveries.length > 1 && message.deliveries.every(d => d.readAt);
        const isDeliveredToAll = message.deliveries && message.deliveries.length > 1;

        if (isReadByAll) {
            return <LuCheckCheck className="w-3.5 h-3.5 text-sky-400 inline ml-1" />;
        }
        if (isDeliveredToAll) {
            return <LuCheckCheck className="w-3.5 h-3.5 text-slate-300 inline ml-1" />;
        }
        return <LuCheck className="w-3.5 h-3.5 text-slate-300 inline ml-1" />;
    };

    const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    return (
        <div
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowReactionsRow(false);
            }}
            className={`relative flex flex-col my-1 group select-text ${
                isOwn ? "items-end" : "items-start"
            }`}
        >
            {/* Quick Actions Hover Bar */}
            {showActions && (
                <div
                    className={`absolute -top-3 z-10 flex items-center gap-1 p-1 rounded-xl bg-[#0e1726] border border-slate-800 shadow-xl ${
                        isOwn ? "right-2" : "left-2"
                    }`}
                >
                    <button
                        onClick={() => setShowReactionsRow(!showReactionsRow)}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
                        title="React"
                    >
                        <LuSmile className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onReply(message)}
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                        title="Reply"
                    >
                        <LuCornerUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onForward(message)}
                        className="p-1 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800"
                        title="Forward"
                    >
                        <LuShare2 className="w-3.5 h-3.5" />
                    </button>
                    {isOwn && (
                        <button
                            onClick={() => onEdit(message)}
                            className="p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
                            title="Edit"
                        >
                            <LuPencil className="w-3.5 h-3.5" />

                        </button>
                    )}
                    <button
                        onClick={() => onDelete(message)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                        title="Delete"
                    >
                        <LuTrash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Quick Reactions Bar Popup */}
            {showReactionsRow && (
                <div
                    className={`absolute -top-10 z-20 flex items-center gap-1.5 p-1.5 rounded-full bg-[#0e1726] border border-slate-700 shadow-2xl ${
                        isOwn ? "right-2" : "left-2"
                    }`}
                >
                    {emojis.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => {
                                onReact(message._id, emoji);
                                setShowReactionsRow(false);
                            }}
                            className="text-base hover:scale-125 transition-transform"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Message Bubble Container */}
            <div
                className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl shadow-md border ${
                    isOwn
                        ? "bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white border-emerald-500/30 rounded-tr-none"
                        : "bg-slate-900/95 text-slate-100 border-slate-800 rounded-tl-none"
                }`}
            >
                {/* Sender Name in Group */}
                {isGroup && !isOwn && message.sender && (
                    <p className="text-[11px] font-bold text-emerald-400 mb-1 leading-none">
                        {message.sender.name}
                    </p>
                )}

                {/* Forwarded Attribution Label */}
                {message.forwardScore > 0 && (
                    <div className="flex items-center gap-1 text-[10px] italic text-slate-300/80 mb-1">
                        <LuShare2 className="w-3 h-3" />
                        <span>{message.forwardScore >= 5 ? "Forwarded many times" : "Forwarded"}</span>
                    </div>
                )}

                {/* Quoted Reply Preview */}
                {message.replyTo && (
                    <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-emerald-400 text-xs">
                        <p className="font-bold text-emerald-300 text-[11px]">
                            {message.replyTo.sender?.name || "Reply"}
                        </p>
                        <p className="text-slate-200 line-clamp-1 italic text-[11px]">
                            {message.replyTo.text || "Attachment"}
                        </p>
                    </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                        {message.attachments.map((att, idx) => {
                            if (att.mime?.startsWith("image/")) {
                                return (
                                    <img
                                        key={idx}
                                        src={att.url}
                                        alt={att.name || "Image"}
                                        onClick={() => onOpenMedia && onOpenMedia(message.attachments, idx)}
                                        className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity max-h-60 object-cover border border-black/20"
                                    />
                                );
                            }
                            if (att.mime?.startsWith("video/")) {
                                return (
                                    <video
                                        key={idx}
                                        src={att.url}
                                        controls
                                        className="max-w-full rounded-xl max-h-60"
                                    />
                                );
                            }
                            return (
                                <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 text-xs text-white"
                                >
                                    <LuFileText className="w-5 h-5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold truncate">{att.name || "Document"}</p>
                                        <p className="text-[10px] opacity-75">{att.mime}</p>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Text Body */}
                {message.text && (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words font-normal">
                        {message.text}
                    </p>
                )}

                {/* Timestamp & Status Ticks */}
                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? "text-emerald-100/80" : "text-slate-400"}`}>
                    {message.editedAt && <span className="italic mr-1">Edited</span>}
                    <span>{moment(message.createdAt).format("HH:mm")}</span>
                    {renderStatusTicks()}
                </div>
            </div>

            {/* Reactions Aggregate Footer */}
            {message.reactions && message.reactions.length > 0 && (
                <div
                    className={`flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#0e1726] border border-slate-800 text-[11px] shadow-sm ${
                        isOwn ? "mr-2" : "ml-2"
                    }`}
                >
                    {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => (
                        <span key={emoji}>{emoji}</span>
                    ))}
                    <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                        {message.reactions.length}
                    </span>
                </div>
            )}
        </div>
    );
}
