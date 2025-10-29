import React, { useState } from 'react';
import {HiMiniPlus, HiOutlineTrash} from 'react-icons/hi2';
import { FaPaperclip } from 'react-icons/fa';
const AddAttachmentsInput = ({attachments,setAttachments}) => {
    const[option,setOption]=useState('');

    const handleAddOption=()=>{
        if(option.trim())
        {
            setAttachments([...attachments,option.trim()]);
            setOption('');
        }
    };
    const handleDeleteOption=(index)=>{
        const updatedArr=attachments.filter((_,idx)=>idx!=index);
        setAttachments(updatedArr);
    };
    return (
        <div>
            {(attachments || []).map((item, index) => (
                <div
                    key={`${item}-${index}`}
                    className="flex justify-between bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2 rounded-md mb-3 mt-2"
                >
                    <div className="flex-1 flex items-center gap-3 border border-gray-100 dark:border-slate-700 rounded-md px-2 py-1">
                        <FaPaperclip className="text-gray-400 dark:text-slate-400" />
                        <p className="text-xs text-black dark:text-slate-100 break-all">{item}</p>
                    </div>
                    <button
                        className="cursor-pointer"
                        onClick={() => handleDeleteOption(index)}
                        type="button"
                    >
                        <HiOutlineTrash className="text-lg text-red-500" />
                    </button>
                </div>
            ))}
            <div className="flex items-center gap-5 mt-4">
                <div className="flex-1 flex items-center gap-3 border border-gray-100 dark:border-slate-700 rounded-md px-3 bg-white dark:bg-slate-900">
                    <FaPaperclip className="text-gray-400 dark:text-slate-400" />
                    <input
                        type="text"
                        placeholder="Add file link"
                        value={option}
                        onChange={({ target }) => setOption(target.value)}
                        className="w-full text-[13px] text-black dark:text-slate-100 outline-none bg-transparent py-2 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <button className="card-btn text-nowrap" onClick={handleAddOption} type="button">
                    <HiMiniPlus className="text-lg" />
                    Add
                </button>
            </div>
        </div>
    );
};

export default AddAttachmentsInput;
