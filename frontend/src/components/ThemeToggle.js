import React from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${theme === 'dark' ? 'dark' : 'light'}`}>
          {theme === 'light' ? (
            <Sun size={16} />
          ) : (
            <Moon size={16} />
          )}
        </div>
      </div>
      <span className="theme-toggle-label">
        {theme === 'light' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default ThemeToggle;

