import React from 'react';

/**
 * Skeleton Loader Component
 */
const Skeleton = ({ type = 'card', count = 1, className = '' }) => {
  const renderSkeleton = (key) => {
    if (type === 'row') {
      return (
        <div key={key} className={`animate-pulse flex items-center space-x-4 py-3 border-b border-slate-100 ${className}`}>
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (type === 'table') {
      return (
        <div key={key} className="animate-pulse space-y-3 py-4 border-b border-slate-200">
          <div className="grid grid-cols-6 gap-4">
            <div className="h-4 bg-slate-200 rounded col-span-1"></div>
            <div className="h-4 bg-slate-200 rounded col-span-2"></div>
            <div className="h-4 bg-slate-200 rounded col-span-1"></div>
            <div className="h-4 bg-slate-200 rounded col-span-1"></div>
            <div className="h-4 bg-slate-200 rounded col-span-1"></div>
          </div>
        </div>
      );
    }

    // Default: card skeleton
    return (
      <div
        key={key}
        className={`animate-pulse bg-white border border-slate-200 rounded-xl p-5 space-y-4 ${className}`}
      >
        <div className="h-32 bg-slate-200 rounded-lg w-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderSkeleton(idx))}
    </>
  );
};

export default Skeleton;
