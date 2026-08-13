import React, { useState, useEffect } from "react";
import { LuX, LuUsers, LuCheck, LuLoader, LuSearch } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated, currentUserId }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get("/api/users");
                if (Array.isArray(res.data)) {
                    setUsers(res.data.filter((u) => (u._id || u.id) !== currentUserId));
                }
            } catch (err) {
                console.error("Failed to fetch users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [isOpen, currentUserId]);

    if (!isOpen) return null;

    const toggleUser = (userId) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Group name is required");
            return;
        }

        setCreating(true);
        try {
            const res = await axiosInstance.post("/api/chat/groups", {
                name: name.trim(),
                description: description.trim(),
                avatarUrl: avatarUrl.trim(),
                participants: selectedUserIds
            });

            toast.success("Group created successfully!");
            if (onGroupCreated) onGroupCreated(res.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    const filteredUsers = users.filter(
        (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                        <LuUsers className="w-5 h-5 text-emerald-400" />
                        <span>Create New Group</span>
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl">
                        <LuX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4 my-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Alpha Team"
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Group topic or rules (max 512 chars)..."
                            maxLength={512}
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                    </div>

                    {/* Participant Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Select Participants ({selectedUserIds.length})
                            </label>
                        </div>

                        <div className="relative mb-2">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search co-workers..."
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-800/80 rounded-xl divide-y divide-slate-800/50 bg-slate-900/40">
                            {loading ? (
                                <div className="p-4 text-center text-slate-500 text-xs">Loading users...</div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => {
                                    const uid = u._id || u.id;
                                    const isSelected = selectedUserIds.includes(uid);
                                    return (
                                        <div
                                            key={uid}
                                            onClick={() => toggleUser(uid)}
                                            className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                                                isSelected ? "bg-emerald-500/10" : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-200 truncate">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                                    isSelected ? "bg-emerald-500 border-emerald-500 text-[#0f172a]" : "border-slate-700"
                                                }`}
                                            >
                                                {isSelected && <LuCheck className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-slate-500 text-xs">No users found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={creating || !name.trim()}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#0f172a] font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                        {creating && <LuLoader className="w-3.5 h-3.5 animate-spin" />}
                        <span>Create Group</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
