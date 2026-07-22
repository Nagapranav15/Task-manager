import React, { useEffect } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import Navbar from './Navbar';
import SideMenu from './SideMenu';
import { motion } from 'framer-motion';

const DashboardLayout = ({children, activeMenu}) => {
    const {user}=useContext(UserContext);
    useEffect(()=>{
        const storedTheme = localStorage.getItem('theme') || 'dark';
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return ()=>{};
    },[]);
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar activeMenu={activeMenu}/>
                
            {user && (
                <div className="flex flex-1">
                    <div className="hidden lg:block">
                        <SideMenu activeMenu={activeMenu} />
                    </div>
                    <motion.main 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={activeMenu === "chat" 
                            ? "flex-1 overflow-hidden h-[calc(100vh-80px)] w-full p-0 flex flex-col" 
                            : "flex-1 px-6 py-6 overflow-y-auto max-w-[1600px] mx-auto w-full"
                        }
                    >
                        {children}
                    </motion.main>
                </div>
            )}
        </div>
    )
};

export default DashboardLayout;


