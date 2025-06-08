import React from 'react';
import { Bug, AlertCircle, WifiOff, Filter, X } from 'lucide-react';

function FiltersPanel({ filters = { errors: false, warnings: false, failedRequests: false }, onToggle, onReset }) {
  return (
    <div className="flex flex-wrap gap-3 items-center bg-background-dark p-3 rounded-lg border border-gray-700">
      <span className="flex items-center gap-2 text-sm text-text/70 font-semibold">
        <Filter className="w-4 h-4" /> Filters:
      </span>
      <button
        onClick={() => onToggle('errors')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.errors ? 'bg-error text-white border-error/80' : 'bg-gray-700 text-text/70 border-gray-600 hover:bg-error/80 hover:text-white'}
        `}
        aria-pressed={filters.errors}
        aria-label="Toggle console errors filter"
        title="Toggle console errors"
      >
        <Bug className={`w-4 h-4 ${filters.errors ? 'text-white' : 'text-error'}`} />
        Console Errors
      </button>
      <button
        onClick={() => onToggle('failedRequests')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.failedRequests ? 'bg-accent text-black border-accent/80' : 'bg-gray-700 text-text/70 border-gray-600 hover:bg-accent/80 hover:text-black'}
        `}
        aria-pressed={filters.failedRequests}
        aria-label="Toggle failed requests filter"
        title="Toggle failed requests"
      >
        <WifiOff className={`w-4 h-4 ${filters.failedRequests ? 'text-black' : 'text-accent'}`} />
        Failed Requests
      </button>
      <button
        onClick={() => onToggle('warnings')}
        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border transition
          ${filters.warnings ? 'bg-orange-600 text-white border-orange-500' : 'bg-gray-700 text-text/70 border-gray-600 hover:bg-orange-700 hover:text-white'}
        `}
        aria-pressed={filters.warnings}
        aria-label="Toggle warnings filter"
        title="Toggle warnings"
      >
        <AlertCircle className={`w-4 h-4 ${filters.warnings ? 'text-white' : 'text-orange-500'}`} />
        Warnings
      </button>
      {(filters.errors || filters.warnings || filters.failedRequests) && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1 rounded text-sm font-medium border bg-gray-700 text-text/70 border-gray-600 hover:bg-gray-600 hover:text-white transition min-w-button min-h-button"
          aria-label="Clear all filters"
          title="Clear all filters"
        >
          <X className="w-4 h-4 text-text/70" />
          Clear All
        </button>
      )}
    </div>
  );
}

export default FiltersPanel;