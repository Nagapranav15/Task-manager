import React from 'react';

const AvatarGroup = ({ avatars, maxVisible = 3 }) => {
  const list = Array.isArray(avatars)
    ? avatars.filter((u) => typeof u === 'string' && u.trim().length > 0)
    : [];
  return (
    <div className="flex items-center -space-x-2">
      {list.slice(0, maxVisible).map((avatar, index) => (
        <img
          key={index}
          src={avatar}
          alt={`Avatar ${index + 1}`}
          className="w-9 h-9 rounded-full border-2 border-white"
        />
      ))}
      {list.length > maxVisible && (
        <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
          +{list.length - maxVisible}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;