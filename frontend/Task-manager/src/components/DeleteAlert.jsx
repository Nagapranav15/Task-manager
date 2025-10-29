import React from 'react';
import Modal from './Modal';

const DeleteAlert = ({ content, onDelete }) => {
    return (
        <div>
            <p className="text-sm bg white text-white">{content}</p>
            <div className="flex items-center gap-2 mt-4">
                <button
                type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
                    onClick={onDelete}
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default DeleteAlert;