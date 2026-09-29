import React from 'react';

/**
 * Standard Form Input Component wrapped for react-hook-form
 */
const FormInput = React.forwardRef(({
  label,
  name,
  type = 'text',
  error,
  className = '',
  required = false,
  ...props
}, ref) => {
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
        className={`px-3 py-2 text-sm rounded-lg bg-white border transition outline-none ${
          error
            ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
        } disabled:opacity-60 text-gray-800 placeholder-gray-400`}
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

FormInput.displayName = 'FormInput';

export default FormInput;
