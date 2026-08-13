import React, { useState, useRef, useEffect } from "react";
import { LuSend, LuPaperclip, LuSmile, LuMic, LuX } from "react-icons/lu";
import AttachmentMenu from "./AttachmentMenu";
import VoiceRecorder from "./VoiceRecorder";

export default function MessageComposer({
    onSendMessage,
    onSendVoiceNote,
    replyToMessage,
    onCancelReply,
    participants = [],
    typingUsers = new Map(),
    onTypingStart,
    onTypingStop
}) {
    const [text, setText] = useState("");
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");

    const typingTimerRef = useRef(null);

    const handleTextChange = (e) => {
        const val = e.target.value;
        setText(val);

        // Typing indicator 3s idle timeout logic
        if (onTypingStart) onTypingStart();
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            if (onTypingStop) onTypingStop();
        }, 3000);

        // Check for @ mention trigger
        const lastAtPos = val.lastIndexOf("@");
        if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === " ")) {
            const query = val.slice(lastAtPos + 1);
            setMentionFilter(query);
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleSelectMention = (user) => {
        const lastAtPos = text.lastIndexOf("@");
        const newText = text.substring(0, lastAtPos) + `@${user.name} `;
        setText(newText);
        setShowMentions(false);
    };

    const handleSend = () => {
        if (!text.trim()) return;

        // Parse mention ObjectIds
        const mentions = participants
            .filter((p) => text.includes(`@${p.user?.name}`))
            .map((p) => p.user?._id || p.user);

        onSendMessage({
            type: "text",
            text: text.trim(),
            replyTo: replyToMessage ? replyToMessage._id : null,
            mentions
        });

        setText("");
        setShowMentions(false);
        if (onCancelReply) onCancelReply();
        if (onTypingStop) onTypingStop();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const filteredParticipants = participants.filter((p) => {
        const userName = p.user?.name || "";
        return userName.toLowerCase().includes(mentionFilter.toLowerCase());
    });

    const typingNames = Array.from(typingUsers.values());

    return (
        <div className="relative p-3 bg-[#0f172a] border-t border-slate-800/80">
            {/* Typing Indicator Banner */}
            {typingNames.length > 0 && (
                <div className="absolute -top-6 left-4 text-[11px] italic font-semibold text-emerald-400 animate-pulse">
                    {typingNames.length === 1
                        ? `${typingNames[0]} is typing...`
                        : typingNames.length === 2
                        ? `${typingNames[0]} and ${typingNames[1]} are typing...`
                        : `${typingNames[0]}, ${typingNames[1]} and ${typingNames.length - 2} others are typing...`}
                </div>
            )}

            {/* Quoted Reply Banner */}
            {replyToMessage && (
                <div className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-slate-900 border-l-4 border-emerald-500 text-xs">
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-emerald-400 text-[11px]">
                            Replying to {replyToMessage.sender?.name || "Message"}
                        </p>
                        <p className="text-slate-300 truncate text-[11px]">
                            {replyToMessage.text || "Attachment"}
                        </p>
                    </div>
                    <button onClick={onCancelReply} className="p-1 text-slate-400 hover:text-slate-200">
                        <LuX className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Mention Autocomplete Popup */}
            {showMentions && filteredParticipants.length > 0 && (
                <div className="absolute bottom-16 left-4 z-40 max-h-40 w-64 overflow-y-auto bg-[#0e1726] border border-slate-800 rounded-2xl shadow-2xl divide-y divide-slate-800/50">
                    {filteredParticipants.map((p) => (
                        <div
                            key={p.user?._id || p.user}
                            onClick={() => handleSelectMention(p.user)}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center gap-2"
                        >
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                {p.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-200">{p.user?.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Attachment Menu Popup */}
            <AttachmentMenu
                isOpen={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onSelectType={(type) => {
                    if (type === "voice") setShowVoiceRecorder(true);
                }}
            />

            {/* Main Input Row */}
            {showVoiceRecorder ? (
                <VoiceRecorder
                    onSendVoiceNote={(voiceData) => {
                        onSendVoiceNote(voiceData);
                        setShowVoiceRecorder(false);
                    }}
                    onCancel={() => setShowVoiceRecorder(false)}
                />
            ) : (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
                        title="Attach file"
                    >
                        <LuPaperclip className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            value={text}
                            onChange={handleTextChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message or @mention..."
                            rows={1}
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none max-h-24 custom-scrollbar"
                        />
                    </div>

                    {text.trim() ? (
                        <button
                            onClick={handleSend}
                            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-bold shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                            title="Send message"
                        >
                            <LuSend className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowVoiceRecorder(true)}
                            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
                            title="Record voice note"
                        >
                            <LuMic className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
