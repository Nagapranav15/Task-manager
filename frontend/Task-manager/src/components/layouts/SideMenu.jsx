import React, { useContext, useEffect, useState } from 'react';  
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from '../../utils/data';
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
            setSideMenuData(user?.role === 'admin' ? SIDE_MENU_DATA : SIDE_MENU_USER_DATA);
        } else {
            setSideMenuData([]);
        }
        return ()=>{};
    }, [user]);

    return <div className="w-64 h-[calc(100vh-61px)] border-r border-gray-200/50 dark:border-slate-800 sticky bg-white dark:bg-slate-900 top-[61px] z-20">
        <div className='flex flex-col items-center justify-center mb-7 pt-5 '>
            <div className="relative">
                {(!imgError && user?.profileImageUrl) ? (
                    <img
                        src={user.profileImageUrl}
                        alt="Profile Image"
                        className="w-20 h-20 bg-slate-400 rounded-full object-cover ring-1 ring-gray-200 dark:ring-slate-700"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-400 text-white flex items-center justify-center text-xl ring-1 ring-gray-200 dark:ring-slate-700">
                        {(user?.name||' ').trim().charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
        {user?.role==="admin" && (
            <div className="text-[10px] font-medium text-white bg-primary px-3 py-0.5 rounded mt-1">
                Admin
            </div>
        )}
        <h5 className="text-gray-950 dark:text-slate-100 font-medium leading-6 mt-3 ">
            {user?.name || ""}
        </h5>

        <p className="text-[12px] text-gray-500 dark:text-slate-400 ">
            {user?.email || ""}
        </p>
    </div>
    {sideMenuData.map((item)=>
        (
        <button
        key={item.id}
        className={`w-full flex items-center gap-4 text-[15px] ${
            activeMenu===item.id
            ?"text-primary bg-gradient-to-r from-blue-50/40 to-blue-100/50 dark:from-slate-800 dark:to-slate-800/60 border-r-4"
            :"text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        } py-3 px-6 mb-3 cursor-pointer`}
        onClick={()=>handleClick(item.path)}
        >
            {item.Icon ? <item.Icon className="text-xl"/> : null}
            {item.label}
        </button>
    ))}
    </div>
};

export default SideMenu;
