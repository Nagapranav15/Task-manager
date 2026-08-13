import React from "react";
import { LuImage, LuFileText, LuMapPin, LuUserCheck, LuMic, LuX } from "react-icons/lu";

export default function AttachmentMenu({ isOpen, onClose, onSelectType }) {
    if (!isOpen) return null;

    const items = [
        { id: "image", label: "Photos & Videos", icon: LuImage, color: "from-purple-500 to-indigo-600" },
        { id: "document", label: "Document", icon: LuFileText, color: "from-blue-500 to-cyan-600" },
        { id: "voice", label: "Voice Note", icon: LuMic, color: "from-rose-500 to-pink-600" },
        { id: "location", label: "Location", icon: LuMapPin, color: "from-emerald-500 to-teal-600" },
        { id: "contact", label: "Contact", icon: LuUserCheck, color: "from-amber-500 to-orange-600" }
    ];

    return (
        <div className="absolute bottom-16 left-4 z-50 bg-[#0e1726]/95 backdrop-blur-xl border border-slate-800 p-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 px-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Attach</span>
                <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-200 rounded-lg">
                    <LuX className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSelectType(item.id);
                                onClose();
                            }}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200 group"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-100">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
