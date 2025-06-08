import React from 'react';
import { Bug, AlertCircle, WifiOff, Filter } from 'lucide-react';

const FiltersPanel = ({ filters, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-3 items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
      <span className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
        <Filter className="w-4 h-4" /> Filters:
      </span>

      <button
        onClick={() => onToggle('errors')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.errors ? 'bg-red-700 text-white border-red-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-red-800 hover:text-white'}
        `}
      >
        <Bug className="w-4 h-4" />
        Console Errors
      </button>

      <button
        onClick={() => onToggle('failedRequests')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.failedRequests ? 'bg-yellow-700 text-white border-yellow-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-yellow-800 hover:text-white'}
        `}
      >
        <WifiOff className="w-4 h-4" />
        Failed Requests
      </button>

      <button
        onClick={() => onToggle('warnings')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.warnings ? 'bg-orange-600 text-white border-orange-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-orange-700 hover:text-white'}
        `}
      >
        <AlertCircle className="w-4 h-4" />
        Warnings
      </button>
    </div>
  );
};

export default FiltersPanel;