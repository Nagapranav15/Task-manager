import React, { useContext, useEffect, useState } from 'react';  
import { SIDE_MENU_DATA, SIDE_MENU_MANAGER_DATA, SIDE_MENU_USER_DATA } from '../../utils/data';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';

const SideMenu = ({activeMenu}) => {
    const { user, clearUser } = useContext(UserContext);
    const [sideMenuData, setSideMenuData] = useState([]);
    const [imgError, setImgError] = useState(false);

    const navigate = useNavigate();

    const handleClick = (route) => {
        if (route === 'logout') {
            handleLogout();
            return;
        }
        if (route) navigate(route);
    };

    const handleLogout = () => {
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

    return (
        <div className="w-64 h-[calc(100vh-61px)] border-r border-slate-200 dark:border-slate-900 sticky bg-white dark:bg-slate-950/20 backdrop-blur-md top-[61px] z-20 flex flex-col justify-between pb-6">
            <div>
                <div className="flex flex-col items-center justify-center mb-8 pt-6">
                    <div className="relative">
                        {(!imgError && user?.profileImageUrl) ? (
                            <img
                                src={user.profileImageUrl}
                                alt="Profile Image"
                                className="w-20 h-20 bg-slate-800 rounded-full object-cover ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-bold ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-lg shadow-indigo-500/10">
                                {(user?.name || ' ').trim().charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {user?.role === "admin" && (
                        <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full mt-3 border border-indigo-500/20">
                            Admin Portal
                        </div>
                    )}
                    {user?.role === "manager" && (
                        <div className="text-[10px] font-bold text-cyan-550 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full mt-3 border border-cyan-500/20">
                            Manager Portal
                        </div>
                    )}
                    <h5 className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-wide mt-3.5">
                         {user?.name || ""}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {user?.email || ""}
                    </p>
                </div>

                <div className="space-y-1 px-3">
                    {sideMenuData.map((item) => (
                        <button
                            key={item.id}
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SideMenu;

