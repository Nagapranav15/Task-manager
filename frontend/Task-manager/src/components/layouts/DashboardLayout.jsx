import React, { useEffect } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import Navbar from './Navbar';
import SideMenu from './SideMenu';

const DashboardLayout = ({children, activeMenu}) => {
    const {user}=useContext(UserContext);
    useEffect(()=>{
        // Force dark theme on for the whole app
        document.documentElement.classList.add('dark');
        return ()=>{};
    },[]);
    return (
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
            <Navbar activeMenu={activeMenu}/>
                
            {user && (
                <div className='flex'>
                    <div className='hidden lg:block'>
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                    <div className="grow mx-5 py-4">{children}</div>
                </div>
            )}
        </div>
    )
};

export default DashboardLayout;
