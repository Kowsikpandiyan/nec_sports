/**
 * ThemeContext — REMOVED.
 * The application uses a single fixed Blue + White NEC LMS theme.
 * Dark mode and theme switching have been disabled permanently.
 *
 * This stub is kept only so that any residual imports do not throw errors.
 */
import React, { createContext } from 'react';

export const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });

export const ThemeProvider = ({ children }) => {
  // Ensure the 'dark' class is never on the document root
  if (typeof window !== 'undefined') {
    window.document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }
  return (
    <ThemeContext.Provider value={{ darkMode: false, toggleDarkMode: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
