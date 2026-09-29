import React from 'react';

/**
 * Avatar component to render user photos or initials fallback
 */
const Avatar = ({ src, name = 'User', size = 'md', className = '' }) => {
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.split(' ');
    const initials = parts.map((n) => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const isLocalFallback = src && src.startsWith('/uploads');
  const resolvedSrc = isLocalFallback 
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${src}` 
    : src;

  return resolvedSrc ? (
    <img
      src={resolvedSrc}
      alt={`${name} avatar`}
      className={`rounded-full object-cover border border-slate-200 ${selectedSize} ${className}`}
      onError={(e) => {
        // Fallback if image fails to load
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-full font-bold bg-gradient-to-tr from-blue-500 to-teal-600 text-white border border-blue-400 select-none ${selectedSize} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
