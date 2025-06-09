// src/components/Tab.jsx
import React from 'react';

export default function Tab({ label, isActive, onClick, count }) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 ${
        isActive ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {label} {typeof count === 'number' && <span className="ml-1 text-sm text-gray-400">({count})</span>}
    </button>
  );
}