// src/components/FiltersPanel.js
import React from 'react';
import { Bug, AlertCircle, WifiOff, Filter, X } from 'lucide-react';

function FiltersPanel({
  toggleFilters = {},
  logFilter,
  requestFilter,
  onToggle,
  onLogFilterChange,
  onRequestFilterChange,
  onReset,
}) {
  const hasActiveFilters =
    toggleFilters.errors ||
    toggleFilters.warnings ||
    toggleFilters.failedRequests ||
    logFilter !== 'all' ||
    requestFilter !== 'all';

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center bg-gray-200 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-700">
      <div className="flex-grow flex flex-wrap gap-3 items-center">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="w-4 h-4" />
          Filters:
        </span>
        {/* Toggle Buttons */}
        <button
          onClick={() => onToggle('errors')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition focus:outline-none focus:ring-2 ring-offset-2 dark:ring-offset-gray-800 ${
            toggleFilters.errors
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-red-500/10 hover:border-red-500'
          }`}
          aria-pressed={toggleFilters.errors}
        >
          <Bug className="w-4 h-4" />
          Errors
        </button>
        <button
          onClick={() => onToggle('warnings')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition focus:outline-none focus:ring-2 ring-offset-2 dark:ring-offset-gray-800 ${
            toggleFilters.warnings
              ? 'bg-yellow-500 text-black border-yellow-400'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-yellow-500/10 hover:border-yellow-500'
          }`}
          aria-pressed={toggleFilters.warnings}
        >
          <AlertCircle className="w-4 h-4" />
          Warnings
        </button>
        <button
          onClick={() => onToggle('failedRequests')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition focus:outline-none focus:ring-2 ring-offset-2 dark:ring-offset-gray-800 ${
            toggleFilters.failedRequests
              ? 'bg-orange-600 text-white border-orange-500'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-orange-500/10 hover:border-orange-500'
          }`}
          aria-pressed={toggleFilters.failedRequests}
        >
          <WifiOff className="w-4 h-4" />
          Failed Requests
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
           <label htmlFor="log-filter" className="text-sm">Console:</label>
           <select id="log-filter" value={logFilter} onChange={(e) => onLogFilterChange(e.target.value)} className="bg-white dark:bg-gray-700 p-1 rounded text-sm border border-gray-400 dark:border-gray-600 focus:ring-2">
             <option value="all">All</option>
             <option value="error">Errors</option>
             <option value="warning">Warnings</option>
             <option value="info">Info</option>
           </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="request-filter" className="text-sm">Network:</label>
           <select id="request-filter" value={requestFilter} onChange={(e) => onRequestFilterChange(e.target.value)} className="bg-white dark:bg-gray-700 p-1 rounded text-sm border border-gray-400 dark:border-gray-600 focus:ring-2">
             <option value="all">All</option>
             <option value="success">Success</option>
             <option value="failed">Failed</option>
           </select>
        </div>

        {hasActiveFilters && (
          <button onClick={onReset} className="flex items-center gap-2 p-2 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition" aria-label="Clear all filters">
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default FiltersPanel;