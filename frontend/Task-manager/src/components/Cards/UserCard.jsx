import React from 'react'
import StatCard from './StatCard'
import { LuTrash2 } from 'react-icons/lu'
import { getSecureUrl } from '../../utils/apiPaths'

const UserCard = ({ userInfo, onDelete, onPromote }) => {
  const name = userInfo?.name || "Unknown";
  const email = userInfo?.email || "";
  const profileImageUrl = getSecureUrl(userInfo?.profileImageUrl);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");


  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-800/80 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700/80 shadow-md shadow-slate-100 dark:shadow-none"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {initials || "U"}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{name}</p>
              {userInfo?.role === "admin" ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                  Admin
                </span>
              ) : userInfo?.role === "manager" ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                  Manager
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-405 border border-slate-500/25">
                  Member
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold break-all mt-0.5">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onPromote && (
            <select
              value={userInfo?.role}
              onChange={(e) => onPromote(userInfo?._id, e.target.value)}
              className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer shadow-inner"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(userInfo?._id, name)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900/40 cursor-pointer transition-colors shadow-inner"
              aria-label={`Delete ${name}`}
              title="Delete user"
            >
              <LuTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4.5 grid grid-cols-3 gap-2.5 items-stretch">
        <StatCard label="Pending" count={Number(userInfo?.pendingTasks) || 0} status="Pending" />
        <StatCard label="In Progress" count={Number(userInfo?.inProgressTasks) || 0} status="In Progress" />
        <StatCard label="Completed" count={Number(userInfo?.completedTasks) || 0} status="Completed" />
      </div>

      {/* Modern Completion Progress Bar */}
      {(() => {
        const pending = Number(userInfo?.pendingTasks) || 0;
        const inProgress = Number(userInfo?.inProgressTasks) || 0;
        const completed = Number(userInfo?.completedTasks) || 0;
        const totalTasks = pending + inProgress + completed;
        const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        return (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <span>Task Completion Rate</span>
              <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950/60 h-2 rounded-full overflow-hidden border border-slate-200/20">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold text-right">
              {completed} of {totalTasks} tasks completed
            </p>
          </div>
        );
      })()}
    </div>
  );
};

export default UserCard;


