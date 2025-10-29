import React from 'react'
import StatCard from './StatCard'
import { LuTrash2 } from 'react-icons/lu'

const UserCard = ({ userInfo, onDelete }) => {
  const name = userInfo?.name || "Unknown";
  const email = userInfo?.email || "";
  const profileImageUrl = userInfo?.profileImageUrl || null;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");


  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md shadow-gray-100/40 dark:shadow-black/20 border border-gray-200/70 dark:border-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60 dark:hover:shadow-black/40">
      <div className="flex items-center gap-3">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center font-semibold border border-gray-200 dark:border-slate-700">
            {initials || "U"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{name}</p>
          <p className="text-xs text-gray-600 dark:text-slate-400 break-words">{email}</p>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(userInfo?._id, name)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/40"
            aria-label={`Delete ${name}`}
            title="Delete user"
          >
            <LuTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 items-stretch">
        <StatCard label="Pending" count={Number(userInfo?.pendingTasks) || 0} status="Pending" />
        <StatCard label="In Progress" count={Number(userInfo?.inProgressTasks) || 0} status="In Progress" />
        <StatCard label="Completed" count={Number(userInfo?.completedTasks) || 0} status="Completed" />
      </div>
    </div>
  );
};

export default UserCard;


