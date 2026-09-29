import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

/**
 * Custom Image Upload component with thumbnail previews
 */
const ImageUpload = ({
  label,
  onChange,
  error,
  value,
  className = '',
  required = false
}) => {
  const [previewUrl, setPreviewUrl] = useState('');

  // Synchronize initial previews (handles existing URL edits vs fresh selections)
  useEffect(() => {
    if (!value) {
      setPreviewUrl('');
      return;
    }

    if (typeof value === 'string') {
      // Check if it is a local relative fallback path
      const isLocal = value.startsWith('/uploads');
      const resolved = isLocal 
        ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${value}` 
        : value;
      setPreviewUrl(resolved);
    } else if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      // Clean memory leak
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      onChange(file);
    }
  };

  const handleClear = () => {
    onChange(null);
    setPreviewUrl('');
  };

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <span className="text-xs md:text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      )}

      <div className="relative flex items-center justify-center w-full">
        {previewUrl ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200">
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition shadow-sm"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-slate-400" />
              <p className="mb-1 text-sm text-slate-500">
                <span className="font-semibold">Click to upload</span> image
              </p>
              <p className="text-xs text-slate-400">
                PNG, JPG, JPEG or WEBP (Max 5MB)
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
};

export default ImageUpload;
