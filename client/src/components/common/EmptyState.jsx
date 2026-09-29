import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * EmptyState placeholder component
 */
const EmptyState = ({
  icon: Icon = AlertCircle,
  title = 'No items found',
  description = 'There are no records matching your criteria. Try adjustments or add new details.',
  actionText = '',
  onActionClick = null,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-xl shadow-xs ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-4">
        <Icon size={24} aria-hidden="true" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {description}
      </p>

      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
