import React, { useState } from "react";
import { LuSearch, LuUserPlus, LuFilter, LuPin } from "react-icons/lu";
import ConversationRow from "./ConversationRow";

export default function ConversationList({
    conversations,
    activeConversation,
    onSelectConversation,
    onOpenCreateGroupModal,
    currentUserId,
    onlineUserIds,
    userStatuses,
    searchQuery,
    setSearchQuery
}) {
    const [filterTab, setFilterTab] = useState("all"); // "all", "unread", "groups", "dms"

    const filtered = conversations.filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        if (!nameMatch) return false;

        if (filterTab === "unread") return (c.unreadCount || 0) > 0;
        if (filterTab === "groups") return c.type === "group";
        if (filterTab === "dms") return c.type === "dm";
        return true;
    });

    const pinnedList = filtered.filter((c) => c.isPinned);
    const unpinnedList = filtered.filter((c) => !c.isPinned);

    return (
        <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#0f172a] border-r border-slate-800/80 select-none">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                        Chats
                    </h2>
                    <button
                        onClick={onOpenCreateGroupModal}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
                        title="New Group"
                    >
                        <LuUserPlus className="w-4 h-4" />
                        <span>New Group</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats or messages..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
                    {["all", "unread", "groups", "dms"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterTab(tab)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all duration-200 whitespace-nowrap ${
                                filterTab === tab
                                    ? "bg-emerald-500 text-[#0f172a] shadow-md shadow-emerald-500/20"
                                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversation List Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {pinnedList.length > 0 && (
                    <div>
                        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/40 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400/90">
                            <LuPin className="w-3 h-3 rotate-45" />
                            <span>Pinned Chats</span>
                        </div>
                        {pinnedList.map((conv) => (
                            <ConversationRow
                                key={conv.id}
                                conversation={conv}
                                activeConversation={activeConversation}
                                onSelect={onSelectConversation}
                                currentUserId={currentUserId}
                                onlineUserIds={onlineUserIds}
                                userStatuses={userStatuses}
                            />
                        ))}
                    </div>
                )}

                {unpinnedList.length > 0 ? (
                    unpinnedList.map((conv) => (
                        <ConversationRow
                            key={conv.id}
                            conversation={conv}
                            activeConversation={activeConversation}
                            onSelect={onSelectConversation}
                            currentUserId={currentUserId}
                            onlineUserIds={onlineUserIds}
                            userStatuses={userStatuses}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500 text-xs font-medium">
                        No conversations found
                    </div>
                )}
            </div>
        </div>
    );
}
