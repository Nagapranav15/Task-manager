import React, { useState, useEffect } from "react";
import { 
    LuX, LuUserPlus, LuUserMinus, LuShield, LuShieldAlert, LuLogOut, LuTrash2, 
    LuLink, LuVolumeX, LuClock, LuImage, LuFileText, LuExternalLink, LuPin, LuStar, LuPencil, LuCheck 

} from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";

export default function GroupInfoPanel({
    group,
    currentUserId,
    onClose,
    onUpdateGroup,
    onLeaveGroup,
    onDeleteGroup,
    onlineUserIds,
    userStatuses,
    onJumpToMessage
}) {
    const [tab, setTab] = useState("members"); // "members", "media", "docs", "links", "starred"
    const [mediaItems, setMediaItems] = useState([]);
    const [docsItems, setDocsItems] = useState([]);
    const [linksItems, setLinksItems] = useState([]);
    const [starredItems, setStarredItems] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(group?.name || "");
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editDesc, setEditDesc] = useState(group?.description || "");

    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedAddUserIds, setSelectedAddUserIds] = useState([]);

    const participants = group?.participants || [];
    const myParticipant = participants.find((p) => (p.user?._id || p.user) === currentUserId);
    const myRole = myParticipant?.role || "member";
    const isAdminOrOwner = myRole === "admin" || myRole === "owner";

    // Sorted participants: Owner -> Admins -> Members
    const sortedParticipants = [...participants].sort((a, b) => {
        const order = { owner: 0, admin: 1, member: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3);
    });

    useEffect(() => {
        if (!group) return;
        setEditName(group.name || "");
        setEditDesc(group.description || "");
    }, [group]);

    // Fetch Media / Docs / Links
    useEffect(() => {
        if (!group || (tab !== "media" && tab !== "docs" && tab !== "links")) return;
        const fetchTabContent = async () => {
            setLoadingMedia(true);
            try {
                const res = await axiosInstance.get(
                    `/api/chat/media?conversationType=group&conversationId=${group._id}&tab=${tab}`
                );
                if (res.data?.items) {
                    if (tab === "media") setMediaItems(res.data.items);
                    else if (tab === "docs") setDocsItems(res.data.items);
                    else if (tab === "links") setLinksItems(res.data.items);
                }
            } catch (err) {
                console.error("Failed to fetch media tab content:", err);
            } finally {
                setLoadingMedia(false);
            }
        };
        fetchTabContent();
    }, [group, tab]);

    if (!group) return null;

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        try {
            const res = await axiosInstance.patch(`/api/chat/groups/${group._id}`, { name: editName.trim() });
            onUpdateGroup(res.data);
            setIsEditingName(false);
            toast.success("Group name updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update group name");
        }
    };

    const handleSaveDesc = async () => {
        try {
            const res = await axiosInstance.patch(`/api/chat/groups/${group._id}`, { description: editDesc.trim() });
            onUpdateGroup(res.data);
            setIsEditingDesc(false);
            toast.success("Group description updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update description");
        }
    };

    const handlePromote = async (targetUserId) => {
        try {
            const res = await axiosInstance.post(`/api/chat/groups/${group._id}/participants/${targetUserId}/promote`);
            onUpdateGroup(res.data);
            toast.success("Promoted to admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to promote");
        }
    };

    const handleDemote = async (targetUserId) => {
        try {
            const res = await axiosInstance.post(`/api/chat/groups/${group._id}/participants/${targetUserId}/demote`);
            onUpdateGroup(res.data);
            toast.success("Demoted to member");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to demote");
        }
    };

    const handleRemove = async (targetUserId) => {
        try {
            const res = await axiosInstance.delete(`/api/chat/groups/${group._id}/participants/${targetUserId}`);
            onUpdateGroup(res.data);
            toast.success("Member removed");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove member");
        }
    };

    const handleGenerateInvite = async () => {
        try {
            const res = await axiosInstance.post(`/api/chat/groups/${group._id}/invite`);
            const link = `${window.location.origin}/join/${res.data.inviteCode}`;
            await navigator.clipboard.writeText(link);
            toast.success("Invite link copied to clipboard!");
        } catch (err) {
            toast.error("Failed to generate invite link");
        }
    };

    return (
        <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#0f172a] border-l border-slate-800/80 select-none overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-[#0f172a]/95 backdrop-blur z-20">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Group Info</h3>
                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl">
                    <LuX className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Overview */}
            <div className="flex flex-col items-center p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-transparent">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-3xl font-black text-slate-100 shadow-xl mb-3">
                    {group.name ? group.name.charAt(0).toUpperCase() : "G"}
                </div>

                {isEditingName ? (
                    <div className="flex items-center gap-2 w-full px-4 mb-1">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg text-sm text-slate-100 font-bold text-center"
                        />
                        <button onClick={handleSaveName} className="p-2 bg-emerald-500 text-[#0f172a] rounded-lg">
                            <LuCheck className="w-4 h-4 stroke-[3]" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h2 className="text-lg font-black text-slate-100 text-center">{group.name}</h2>
                        {isAdminOrOwner && (
                            <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-400">
                                <LuPencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Group · {participants.length} participants
                </p>

                {/* Description */}
                <div className="mt-4 w-full bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description</span>
                        {isAdminOrOwner && !isEditingDesc && (
                            <button onClick={() => setIsEditingDesc(true)} className="text-slate-400 hover:text-emerald-400">
                                <LuPencil className="w-3 h-3" />

                            </button>
                        )}
                    </div>
                    {isEditingDesc ? (
                        <div>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-slate-950 border border-emerald-500/50 rounded-lg text-xs text-slate-100 resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-1">
                                <button onClick={() => setIsEditingDesc(false)} className="px-2 py-1 text-[10px] text-slate-400">Cancel</button>
                                <button onClick={handleSaveDesc} className="px-2.5 py-1 bg-emerald-500 text-[#0f172a] text-[10px] font-bold rounded-md">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                            {group.description || <span className="italic text-slate-500">No description set</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800/80">
                <button onClick={handleGenerateInvite} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors">
                    <LuLink className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold">Invite</span>
                </button>
                <button onClick={onLeaveGroup} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 text-slate-300 hover:text-rose-400 transition-colors">
                    <LuLogOut className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-bold">Exit</span>
                </button>
                {myRole === "owner" && (
                    <button onClick={onDeleteGroup} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 text-slate-300 hover:text-rose-400 transition-colors">
                        <LuTrash2 className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-bold">Delete</span>
                    </button>
                )}
            </div>

            {/* Tabs Bar */}
            <div className="flex border-b border-slate-800/80 px-2 bg-slate-900/40">
                {["members", "media", "docs", "links"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all capitalize ${
                            tab === t
                                ? "border-emerald-500 text-emerald-400"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Body */}
            <div className="p-4 flex-1">
                {tab === "members" && (
                    <div className="space-y-2">
                        {sortedParticipants.map((p) => {
                            const u = p.user || {};
                            const uid = (u._id || u).toString();
                            const isSelf = uid === currentUserId;
                            const isOnline = onlineUserIds?.has(uid);

                            return (
                                <div key={uid} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900/60 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200">
                                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0f172a]" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-200 truncate">
                                                {isSelf ? "You" : u.name || "User"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {p.role === "owner" ? (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase">
                                                Group Creator
                                            </span>
                                        ) : p.role === "admin" ? (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                                                Admin
                                            </span>
                                        ) : null}

                                        {isAdminOrOwner && !isSelf && p.role !== "owner" && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {p.role === "member" ? (
                                                    <button onClick={() => handlePromote(uid)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded-md" title="Promote to admin">
                                                        <LuShield className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleDemote(uid)} className="p-1 text-amber-400 hover:bg-amber-500/10 rounded-md" title="Demote to member">
                                                        <LuShieldAlert className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleRemove(uid)} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-md" title="Remove member">
                                                    <LuUserMinus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === "media" && (
                    <div className="grid grid-cols-3 gap-2">
                        {loadingMedia ? (
                            <div className="col-span-3 py-8 text-center text-xs text-slate-500">Loading media...</div>
                        ) : mediaItems.length > 0 ? (
                            mediaItems.map((m) => (
                                <img
                                    key={m._id}
                                    src={m.attachments?.[0]?.url || m.fileUrl}
                                    alt="Media"
                                    className="w-full h-20 rounded-xl object-cover border border-slate-800 cursor-pointer hover:scale-105 transition-transform"
                                />
                            ))
                        ) : (
                            <div className="col-span-3 py-8 text-center text-xs text-slate-500">No media shared yet</div>
                        )}
                    </div>
                )}

                {tab === "docs" && (
                    <div className="space-y-2">
                        {docsItems.map((d) => (
                            <a
                                key={d._id}
                                href={d.attachments?.[0]?.url || d.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors"
                            >
                                <LuFileText className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-200 truncate">{d.attachments?.[0]?.name || "Document"}</p>
                                    <p className="text-[10px] text-slate-500">{d.type}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {tab === "links" && (
                    <div className="space-y-2">
                        {linksItems.map((l) => (
                            <div key={l._id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                                <p className="truncate text-emerald-400 font-semibold">{l.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
