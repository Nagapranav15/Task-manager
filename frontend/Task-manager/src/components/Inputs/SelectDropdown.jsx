import React, { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

const SelectDropdown = ({ options = [], value = "", onChange, placeholder = "Select" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (val) => {
    const found = options.find((opt) => opt.value === val) || { value: val, label: val };
    onChange && onChange(found);
    setIsOpen(false);
  };

  return (
  <div className="relative w-full">
    {/*Dropdown Button*/}
    <button
    onClick={()=>setIsOpen(!isOpen)}
    className="w-full text-sm text-black dark:text-slate-100 outline-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-2.5 py-3 rounded-md mt-2 flex justify-between items-center"
    type="button"
    >
      {value ? (options.find((opt)=>opt.value===value)?.label || String(value)) : placeholder}
      <span className="ml-2">
        <LuChevronDown className={(isOpen ? "rotate-180 " : "") + "transition-transform text-slate-600 dark:text-slate-300"} />
      </span>
    </button>

    {/*Dropdown Menu*/}
    {isOpen && (
        <div className="absolute w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-md mt-1 shadow-md z-10">
            {options.map((option)=> (
              <div
                key={option.value}
                onClick={()=>handleSelect(option.value)}
                className="px-3 py-2 text-sm cursor-pointer text-slate-800 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                {option.label}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;