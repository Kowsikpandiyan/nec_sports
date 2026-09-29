import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      {/* Animated Icon */}
      <div className="relative mb-6 animate-bounce">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <Compass className="h-24 w-24 text-blue-500 relative z-10 mx-auto" />
      </div>

      {/* Text Content */}
      <h1 className="text-9xl font-black text-slate-200 tracking-widest relative select-none">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 mb-4">
        Lost in the Stadium?
      </h2>
      <p className="text-slate-600 max-w-md mx-auto mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back in the game!
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={() => window.history.back()}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition duration-150 ease-in-out cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </button>
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition duration-150 ease-in-out"
        >
          <Home className="mr-2 h-5 w-5" />
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
