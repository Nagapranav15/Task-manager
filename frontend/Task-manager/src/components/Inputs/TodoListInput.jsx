import React, { useState } from 'react';
import { HiMiniPlus, HiOutlineTrash } from 'react-icons/hi2';

const TodoListInput = ({ todoList = [], setTodoList }) => {
    const [option, setOption] = useState('');

    const handleAddOption = () => {
        if (option.trim() !== "") {
            setTodoList([...todoList, option.trim()]);
            setOption('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddOption();
        }
    };

    const handleDeleteOption = (index) => {
        const updatedArr = todoList.filter((_, idx) => idx !== index);
        setTodoList(updatedArr);
    };

    return (
        <div>
            {todoList.map((item, index) => (
                <div 
                    key={`${item}-${index}`}
                    className="flex justify-between bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2 rounded-md mb-3 mt-2"
                >
                    <p className="text-xs text-black dark:text-slate-100">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold mr-2">
                            {index < 9 ? `0${index + 1}` : index + 1}
                        </span>
                        {item}
                    </p> 
                    <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => handleDeleteOption(index)}
                        aria-label={`Delete task option ${index + 1}`}
                    >
                        <HiOutlineTrash className='text-lg text-red-500'/>
                    </button>
                </div>
            ))}
            <div className="flex items-center gap-5 mt-4">
                <input
                    type="text"
                    placeholder="Enter Task (Press Enter to Add)"
                    value={option}
                    onChange={({ target }) => setOption(target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full text-[13px] text-black dark:text-slate-100 outline-none bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 py-2 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    aria-label="Add new todo checklist item"
                />
                <button
                    type="button"
                    className="card-btn text-nowrap cursor-pointer flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md transition-all shadow-md"
                    onClick={handleAddOption}
                >
                    <HiMiniPlus className='text-lg'/> Add
                </button>
            </div>
        </div>
    );
};

export default TodoListInput;