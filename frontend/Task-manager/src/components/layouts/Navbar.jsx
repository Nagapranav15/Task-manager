import React, { useState } from 'react';
import { HiOutlineX, HiOutlineMenu } from 'react-icons/hi'
import SideMenu from './SideMenu';

const Navbar = ({ activeMenu }) => {
    const [openSideMenu, setOpenSideMenu] = useState(false)
    return (
        <div className="flex gap-5 bg-slate-900 border border-b border-slate-800 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30 text-slate-100">
            <button className="block lg:hidden"
                onClick={() => {
                    setOpenSideMenu(!openSideMenu)
                }}
            >
                {openSideMenu ? (
                    <HiOutlineX className="text-2xl" />
                ) : (
                    <HiOutlineMenu className="text-2xl" />
                )}
            </button>
            <h2 className="text-lg font-medium">Task Manager</h2>

            {openSideMenu && (
                <div className="fixed top-[61px] -ml-4 bg-slate-900 border border-slate-800 text-slate-100">
                    <SideMenu activeMenu={activeMenu} />
                </div>
            )}
        </div>
    )
}

export default Navbar;
