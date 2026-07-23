import React, { useContext, useEffect, useState } from 'react';  
import { SIDE_MENU_DATA, SIDE_MENU_MANAGER_DATA, SIDE_MENU_USER_DATA } from '../../utils/data';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { LuLogOut, LuTriangleAlert, LuChevronDown, LuChevronRight } from 'react-icons/lu';
import { API_PATHS, getSecureUrl } from '../../utils/apiPaths';

const SideMenu = ({activeMenu}) => {
    const { user, clearUser, userStatus } = useContext(UserContext);
    const [sideMenuData, setSideMenuData] = useState([]);
    const [imgError, setImgError] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    const navigate = useNavigate();

    const handleClick = (route) => {
        if (route === 'logout') {
            setShowLogoutModal(true);
            return;
        }
        if (route) navigate(route);
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        localStorage.clear();
        clearUser();
        navigate('/login');
    };

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                setSideMenuData(SIDE_MENU_DATA);
            } else if (user.role === 'manager') {
                setSideMenuData(SIDE_MENU_MANAGER_DATA);
            } else {
                setSideMenuData(SIDE_MENU_USER_DATA);
            }
        } else {
            setSideMenuData([]);
        }
        return ()=>{};
    }, [user]);

    // Auto-expand group that contains active child menu
    useEffect(() => {
        if (sideMenuData && activeMenu) {
            const activeGroup = sideMenuData.find(group => 
                group.children?.some(child => child.id === activeMenu)
            );
            if (activeGroup) {
                setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
            }
        }
    }, [activeMenu, sideMenuData]);

    return (
        <>
            <aside className="w-64 h-[calc(100vh-61px)] border-r border-slate-200 dark:border-slate-900 sticky bg-white dark:bg-slate-950/20 backdrop-blur-md top-[61px] z-20 flex flex-col justify-between pb-6 overflow-y-auto custom-sidebar-scrollbar">
                <div>
                    <div className="flex flex-col items-center justify-center mb-6 pt-6">
                        <div className="relative">
                            {(!imgError && user?.profileImageUrl) ? (
                                <img
                                    src={getSecureUrl(user.profileImageUrl)}
                                    alt={user?.name ? `${user.name} Profile` : "User Profile"}
                                    width={80}
                                    height={80}
                                    decoding="async"
                                    className="w-20 h-20 bg-slate-800 rounded-full object-cover ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-bold ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-lg shadow-indigo-500/10">
                                    {(user?.name || ' ').trim().charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span 
                                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-950 shadow-md ${
                                    userStatus === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :
                                    userStatus === "away" ? "bg-amber-500" :
                                    userStatus === "dnd" ? "bg-rose-500" : "bg-slate-400"
                                }`} 
                                title={`Teams Status: ${userStatus === "online" ? "Available" : userStatus}`}
                            />
                        </div>
                        {user?.role === "admin" && (
                            <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full mt-3 border border-indigo-500/20">
                                Admin Portal
                            </div>
                        )}
                        {user?.role === "manager" && (
                            <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full mt-3 border border-cyan-500/20">
                                Manager Portal
                            </div>
                        )}
                        <h2 className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-wide mt-3.5">
                             {user?.name || ""}
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {user?.email || ""}
                        </p>
                    </div>

                    <nav className="space-y-1 px-3 pb-6" aria-label="Sidebar Navigation">
                        {sideMenuData.map((item) => {
                            const hasChildren = !!item.children;
                            const isGroupExpanded = !!expandedGroups[item.id];
                            const isChildActive = hasChildren && item.children.some(c => c.id === activeMenu);
                            const isParentActive = activeMenu === item.id || isChildActive;

                            return (
                                <div key={item.id} className="space-y-1">
                                    {hasChildren ? (
                                        <>
                                            <button
                                                aria-label={item.label}
                                                className={`w-full flex items-center justify-between text-xs font-semibold rounded-xl py-3 px-4.5 transition-all duration-200 cursor-pointer ${
                                                    isParentActive
                                                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500"
                                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                                                }`}
                                                onClick={() => toggleGroup(item.id)}
                                            >
                                                <div className="flex items-center gap-3.5">
                                                    {item.Icon ? <item.Icon className="text-lg" /> : null}
                                                    <span>{item.label}</span>
                                                </div>
                                                {isGroupExpanded ? (
                                                    <LuChevronDown className="text-sm opacity-80" />
                                                ) : (
                                                    <LuChevronRight className="text-sm opacity-80" />
                                                )}
                                            </button>
                                            
                                            {/* Sub Menu / Child Items */}
                                            {isGroupExpanded && (
                                                <div className="pl-6 space-y-1 mt-1 transition-all duration-300">
                                                    {item.children.map((child) => (
                                                        <button
                                                            key={child.id}
                                                            aria-label={child.label}
                                                            className={`w-full flex items-center gap-3 text-[11px] font-bold rounded-xl py-2 px-4 transition-all duration-200 cursor-pointer ${
                                                                activeMenu === child.id
                                                                    ? "text-indigo-650 dark:text-indigo-400 bg-indigo-500/5 font-extrabold"
                                                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                                                            }`}
                                                            onClick={() => handleClick(child.path)}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                                activeMenu === child.id ? "bg-indigo-500" : "bg-slate-400 dark:bg-slate-650"
                                                            }`} />
                                                            <span>{child.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            aria-label={item.label}
                                            className={`w-full flex items-center gap-3.5 text-xs font-semibold rounded-xl py-3 px-4.5 transition-all duration-200 cursor-pointer ${
                                                activeMenu === item.id
                                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-r-2 border-indigo-500"
                                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                                            }`}
                                            onClick={() => handleClick(item.path)}
                                        >
                                            {item.Icon ? <item.Icon className="text-lg" /> : null}
                                            <span>{item.label}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                            <LuTriangleAlert className="text-2xl" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Confirm Logout</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Are you sure you want to log out of your session?
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <LuLogOut className="text-sm" />
                                <span>Yes, Logout</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default SideMenu;
