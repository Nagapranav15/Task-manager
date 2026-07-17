import React from 'react';

const DeleteAlert = ({ content, onDelete }) => {
    return (
        <div>
            <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
            <div className="flex items-center justify-end gap-3 mt-6">
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-rose-500/10 rounded-lg"
                    onClick={onDelete}
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default DeleteAlert;