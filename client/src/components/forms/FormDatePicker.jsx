import React from 'react';

/**
 * Standard Date/DateTime selector wrapped for forms
 */
const FormDatePicker = React.forwardRef(({
  label,
  name,
  showTime = false,
  error,
  className = '',
  required = false,
  ...props
}, ref) => {
  const type = showTime ? 'datetime-local' : 'date';

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs md:text-sm font-semibold text-slate-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        className={`px-3 py-2 text-sm rounded-lg bg-white border transition outline-none cursor-pointer ${
          error
            ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
            : 'border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
        } disabled:opacity-60 text-slate-800`}
        {...props}
      />

      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

FormDatePicker.displayName = 'FormDatePicker';

export default FormDatePicker;
