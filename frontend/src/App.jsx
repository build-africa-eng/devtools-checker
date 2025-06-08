// src/App.js
import { useState, useEffect, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab'; // Assuming you have this component
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { useFilteredLogs } from './hooks/useFilteredLogs';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { analyze, loading, error, result } = useAnalysis();
  const [activeTab, setActiveTab] = useState('console');

  // --- Centralized State Management ---
  const [logFilter, setLogFilter] = useState('all'); // Dropdown for console
  const [requestFilter, setRequestFilter] = useState('all'); // Dropdown for network
  const [toggleFilters, setToggleFilters] = useState({
    errors: false,
    warnings: false,
    failedRequests: false,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Derived State from Hooks ---
  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(
    result,
    toggleFilters,
    logFilter,
    requestFilter
  );

  const hasData = result && (result.logs.length > 0 || result.requests.length > 0);

  // --- Effects ---
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- Event Handlers ---
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleToggleFilter = (filterName) => {
    setToggleFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const resetFilters = () => {
    setLogFilter('all');
    setRequestFilter('all');
    setToggleFilters({ errors: false, warnings: false, failedRequests: false });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
        </button>
      </header>

      <main className="p-4 space-y-4">
        <UrlInput onAnalyze={analyze} loading={loading} globalError={error} />
        {warning && <p className="text-yellow-600 dark:text-yellow-400 mt-2">Warning: {warning}</p>}
      </main>

      {hasData && (
        <>
          <div className="px-4">
            <FiltersPanel
              toggleFilters={toggleFilters}
              logFilter={logFilter}
              requestFilter={requestFilter}
              onToggle={handleToggleFilter}
              onLogFilterChange={setLogFilter}
              onRequestFilterChange={setRequestFilter}
              onReset={resetFilters}
            />
          </div>
           <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 mt-4">
            {/* You will need to create this Tab component */}
            <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} count={filteredLogs.length} />
            <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} count={filteredRequests.length} />
          </div>
          <div className="p-4">
             <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />
          </div>
        </>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg animate-pulse">Analyzing... please wait.</p>
          </div>
        ) : activeTab === 'console' ? (
          <ConsoleView logs={filteredLogs} />
        ) : (
          <NetworkView requests={filteredRequests} />
        )}
         {!loading && !hasData && (
             <div className="text-center text-gray-500 dark:text-gray-400">
                <p>Enter a URL to begin analysis. Results will appear here.</p>
             </div>
          )}
      </div>
    </div>
  );
}

export default App;