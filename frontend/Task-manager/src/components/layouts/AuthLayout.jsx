import React from "react";
import UI_IMG from "../../assets/images/image.png"; // <-- make sure this file exists

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Section */}
      <div className="w-full md:w-[55%] bg-white dark:bg-slate-900 flex flex-col px-8 md:px-16 lg:px-24 py-10 border-r border-gray-200/60 dark:border-slate-800">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-10">Task Manager</h1>

        {/* Center the content vertically */}
        <div className="flex flex-col justify-center flex-1">
          {children}
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex w-[45%] relative bg-gradient-to-br from-slate-800 to-slate-700 items-center justify-center overflow-hidden">
        {/* Optional subtle pattern */}
        <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] bg-cover opacity-10"></div>

        {/* Illustration */}
        <img
          src={UI_IMG}
          alt="Task Manager Illustration"
          className="relative z-10 w-4/5 max-w-lg object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  );
};

export default AuthLayout;
