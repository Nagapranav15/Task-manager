import React from "react";
import { LuSun, LuMoon } from "react-icons/lu";

const AuthLayout = ({ children }) => {
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#070a13] text-slate-850 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-300 px-4">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Centered Form Card */}
      <div className="w-full max-w-[500px] flex flex-col justify-between p-8 sm:p-12 z-10 bg-white/40 dark:bg-slate-950/20 backdrop-blur-3xl border border-slate-200 dark:border-slate-900/60 rounded-3xl shadow-xl shadow-slate-200/10 dark:shadow-slate-950/30 transition-all duration-300 my-8">
        {/* Logo/Header & Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <img 
            src="https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg?width=206&height=96" 
            alt="Thinklab Digital Solutions Logo" 
            className="h-16 w-auto object-contain dark:invert-0 invert hover:scale-[1.02] transition-all duration-300" 
          />
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <LuSun className="text-base" /> : <LuMoon className="text-base" />}
          </button>
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-center flex-1">
          {children}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-200/40 dark:border-slate-900/40 text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-655 font-semibold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Thinklab Digital Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

