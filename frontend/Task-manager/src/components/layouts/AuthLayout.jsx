import React from "react";
import UI_IMG from "../../assets/images/image.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-[#070a13] text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left Section: Form Container */}
      <div className="w-full md:w-[50%] flex flex-col px-8 sm:px-16 lg:px-24 py-12 border-r border-slate-200 dark:border-slate-900/60 z-10 bg-slate-950/20 backdrop-blur-3xl justify-between">
        {/* Logo/Header */}
        <div className="mb-4">
          <img 
            src="https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg?width=206&height=96" 
            alt="Task Manager Logo" 
            className="h-10 w-auto object-contain brightness-100 dark:brightness-100" 
          />
        </div>

        {/* Center the content vertically */}
        <div className="flex flex-col justify-center flex-1 py-8">
          <div className="max-w-[440px] w-full mx-auto">
            {children}
          </div>
        </div>

        {/* Footer info */}
        <div>
          <p className="text-[11px] text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} Task Manager. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Section: Hero Showcase */}
      <div className="hidden md:flex w-[50%] relative bg-[#090e1a] items-center justify-center overflow-hidden">
        {/* Accent mesh background */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0px,transparent_60%) pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] bg-cyan-600/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10 w-4/5 max-w-md flex flex-col items-center gap-8 text-center px-6">
          <div className="relative group">
            {/* Glowing background ring */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-slate-950/40 border border-slate-800 p-8 rounded-2xl backdrop-blur-xl">
              <img
                src={UI_IMG}
                alt="Task Manager UI Illustration"
                className="w-full max-h-[300px] object-contain drop-shadow-2xl transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Organize your tasks like never before.
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 max-w-sm leading-relaxed mx-auto font-medium">
              Create dashboards, view priorities, collaborate with team members, and generate insights dynamically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

