import React from "react";
import UI_IMG from "../../assets/images/image.png";
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
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-[#070a13] text-slate-850 dark:text-slate-100 font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left Section: Form Container */}
      <div className="w-full md:w-[50%] flex flex-col px-8 sm:px-16 lg:px-24 py-12 border-r border-slate-200 dark:border-slate-900/60 z-10 bg-white/40 dark:bg-slate-950/20 backdrop-blur-3xl justify-between transition-colors duration-300">
        {/* Logo/Header & Theme Toggle */}
        <div className="flex items-center justify-between mb-4">
          <img 
            src="https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg?width=206&height=96" 
            alt="Thinklab Digital Solutions Logo" 
            className="h-16 md:h-20 w-auto object-contain brightness-100 dark:brightness-100 hover:scale-[1.02] transition-transform duration-300" 
          />
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-105 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <LuSun className="text-base" /> : <LuMoon className="text-base" />}
          </button>
        </div>

        {/* Center the content vertically */}
        <div className="flex flex-col justify-center flex-1 py-8">
          <div className="max-w-[440px] w-full mx-auto">
            {children}
          </div>
        </div>

        {/* Footer info */}
        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-600 font-semibold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Thinklab Digital Solutions. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Section: Hero Showcase */}
      <div className="hidden md:flex w-[50%] relative bg-slate-100/50 dark:bg-[#090e1a] items-center justify-center overflow-hidden transition-colors duration-300">
        {/* Accent mesh background */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0px,transparent_60%) pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] bg-cyan-600/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10 w-4/5 max-w-md flex flex-col items-center gap-8 text-center px-6">
          <div className="relative group">
            {/* Glowing background ring */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl backdrop-blur-xl transition-colors duration-300">
              <img
                src={UI_IMG}
                alt="Task Manager UI Illustration"
                className="w-full max-h-[300px] object-contain drop-shadow-2xl transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
              Organize your tasks like never before.
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2.5 max-w-sm leading-relaxed mx-auto font-semibold">
              Create dashboards, view priorities, collaborate with team members, and generate insights dynamically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

