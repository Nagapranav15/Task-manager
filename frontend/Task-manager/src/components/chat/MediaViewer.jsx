import React, { useState } from "react";
import { LuX, LuChevronLeft, LuChevronRight, LuDownload, LuZoomIn, LuZoomOut } from "react-icons/lu";

export default function MediaViewer({ mediaItems, initialIndex = 0, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoomLevel, setZoomLevel] = useState(1);

    if (!mediaItems || mediaItems.length === 0) return null;

    const item = mediaItems[currentIndex];
    const isVideo = item.mime?.startsWith("video/") || item.type === "video";

    const handlePrev = () => {
        setZoomLevel(1);
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
    };

    const handleNext = () => {
        setZoomLevel(1);
        setCurrentIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 select-none animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-10">
                <div className="text-xs font-semibold text-slate-300">
                    {currentIndex + 1} of {mediaItems.length}
                </div>
                <div className="flex items-center gap-3">
                    {!isVideo && (
                        <>
                            <button
                                onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                                className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                                title="Zoom In"
                            >
                                <LuZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 1))}
                                className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                                title="Zoom Out"
                            >
                                <LuZoomOut className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <a
                        href={item.url}
                        download={item.name || "media"}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                        title="Download"
                    >
                        <LuDownload className="w-5 h-5" />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-rose-500/20 hover:text-rose-400"
                        title="Close"
                    >
                        <LuX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Media Content */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
                {mediaItems.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 z-10 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-100 shadow-xl"
                    >
                        <LuChevronLeft className="w-6 h-6" />
                    </button>
                )}

                <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
                    {isVideo ? (
                        <video
                            src={item.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
                        />
                    ) : (
                        <img
                            src={item.url}
                            alt={item.name || "Media"}
                            style={{ transform: `scale(${zoomLevel})` }}
                            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl transition-transform"
                        />
                    )}
                </div>

                {mediaItems.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="absolute right-4 z-10 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-100 shadow-xl"
                    >
                        <LuChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Footer Details */}
            <div className="text-center z-10">
                <p className="text-xs font-medium text-slate-400 truncate">
                    {item.name || "Media item"}
                </p>
            </div>
        </div>
    );
}
