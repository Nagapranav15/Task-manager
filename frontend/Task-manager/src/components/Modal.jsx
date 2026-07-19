import React from "react";

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">{title}</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              className="w-3.5 h-3.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1l6 6m0 0 6 6M7 7l6-6M7 7L1 13"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 text-slate-800 dark:text-slate-100">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
