import React from 'react';

/**
 * Standard Dropdown select component integrated with react-hook-form
 */
const FormSelect = React.forwardRef(({
  label,
  name,
  options = [],
  error,
  placeholder = 'Select an option',
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

      <select
        ref={ref}
        id={name}
        name={name}
        className={`px-3 py-2 text-sm rounded-lg bg-white border transition outline-none cursor-pointer ${
          error
            ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
        } disabled:opacity-60 text-gray-800`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';

export default FormSelect;
