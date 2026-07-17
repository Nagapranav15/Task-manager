import React from 'react';

const AvatarGroup = ({ avatars, maxVisible = 3 }) => {
  const list = Array.isArray(avatars)
    ? avatars.filter((u) => typeof u === 'string' && u.trim().length > 0)
    : [];
  return (
    <div className="flex items-center -space-x-2.5">
      {list.slice(0, maxVisible).map((avatar, index) => (
        <img
          key={index}
          src={avatar}
          alt={`Avatar ${index + 1}`}
          className="w-8.5 h-8.5 rounded-full border-2 border-[#090D16] object-cover"
        />
      ))}
      {list.length > maxVisible && (
        <div className="w-8.5 h-8.5 rounded-full border-2 border-[#090D16] bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
          +{list.length - maxVisible}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;