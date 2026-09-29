import React from 'react';

/**
 * PageHeader component for standard layout tops
 */
const PageHeader = ({ title, description = '', children }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-905">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center space-x-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
