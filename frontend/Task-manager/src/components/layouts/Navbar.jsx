import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineX, HiOutlineMenu } from 'react-icons/hi'
import { LuSun, LuMoon, LuHistory, LuX } from 'react-icons/lu';
import SideMenu from './SideMenu';
import RecentActivities from '../Cards/RecentActivities';

const Navbar = ({ activeMenu }) => {
    const [openSideMenu, setOpenSideMenu] = useState(false)
    const [openActivities, setOpenActivities] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <header className="flex items-center justify-between bg-white dark:bg-slate-950/50 backdrop-blur-lg border-b border-slate-200 dark:border-slate-900/85 py-3 px-8 sticky top-0 z-30 text-slate-800 dark:text-slate-100 shadow-md">
            <div className="flex items-center gap-5">
                <button 
                    className="block lg:hidden text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer"
                    onClick={() => setOpenSideMenu(!openSideMenu)}
                    aria-label="Toggle mobile navigation menu"
                >
                    {openSideMenu ? (
                        <HiOutlineX className="text-2xl" />
                    ) : (
                        <HiOutlineMenu className="text-2xl" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    <img src="/logo.svg" alt="Task Tracker Logo" width={32} height={32} className="w-8 h-8 object-contain" />
                    <h1 className="text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
                        Task Tracker
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Activity Logs Trigger */}
                <button
                    onClick={() => setOpenActivities(true)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                    title="View Activity Logs"
                    aria-label="Open Activity Logs"
                >
                    <LuHistory className="text-base" />
                </button>

                {/* Theme Switcher */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
                >
                    {theme === 'dark' ? <LuSun className="text-base" /> : <LuMoon className="text-base" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {openSideMenu && createPortal(
                <div className="fixed top-[53px] left-0 right-0 bottom-0 bg-slate-950/90 backdrop-blur-lg z-50 lg:hidden">
                    <div className="w-64 h-full bg-[#070a13] shadow-2xl">
                        <div className="flex justify-end p-4">
                            <button onClick={() => setOpenSideMenu(false)} aria-label="Close navigation drawer">
                                <HiOutlineX className="text-2xl text-slate-400" />
                            </button>
                        </div>
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                </div>,
                document.body
            )}

            {/* Activity Logs Drawer */}
            {openActivities && createPortal(
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
                        onClick={() => setOpenActivities(false)}
                    />
                    
                    {/* Drawer container */}
                    <div className="relative w-full max-w-md h-full bg-white dark:bg-[#070a13] border-l border-slate-200 dark:border-slate-900 shadow-2xl p-6 flex flex-col z-10 transition-transform duration-300">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-900 mb-6 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <LuHistory className="text-indigo-500 dark:text-indigo-400 text-lg" />
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Activity Log</h3>
                            </div>
                            <button 
                                onClick={() => setOpenActivities(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                aria-label="Close activity log drawer"
                            >
                                <LuX className="text-lg" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                            <RecentActivities />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    )
}

export default Navbar;
