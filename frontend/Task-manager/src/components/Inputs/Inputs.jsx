import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Inputs = ({ value, onChange, label, placeholder, type, id }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${(label || "field").toLowerCase().replace(/\s+/g, "-")}`;

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div>
      <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
        {label}
      </label>

      <div className="input-box flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-white dark:bg-slate-950/40">
        <input
          id={inputId}
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          aria-label={label}
          className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
          value={value}
          onChange={onChange}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={toggleShowPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <FaRegEye size={18} className="text-indigo-500" />
            ) : (
              <FaRegEyeSlash size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Inputs;
