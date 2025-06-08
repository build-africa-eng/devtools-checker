import { useState, useEffect, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
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

  // --- State for Filters ---
  // Dropdown filters
  const [logFilter, setLogFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  // Toggle filters (This was the missing piece)
  const [toggleFilters, setToggleFilters] = useState({
    errors: false,
    warnings: false,
    failedRequests: false,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Derived State ---
  // Pass all required arguments to the filtering hook
  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(
    result,
    toggleFilters,
    logFilter,
    requestFilter
  );

  const hasData = result && (result.logs.length > 0 || result.requests.length > 0);

  // --- Effects and Callbacks ---
  useEffect(() => {
    // Set initial dark mode based on user's system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  const handleFilterChange = (type, value) => {
    if (type === 'console-dropdown') setLogFilter(value);
    if (type === 'network-dropdown') setRequestFilter(value);
    if (type === 'toggle') {
      setToggleFilters(prev => ({ ...prev, ...value }));
    }
  };

  const resetAllFilters = () => {
    setLogFilter('all');
    setRequestFilter('all');
    setToggleFilters({
      errors: false,
      warnings: false,
      failedRequests: false,
    });
  };


  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
        </button>
      </header>

      <main className="p-4">
        <UrlInput analyze={analyze} isLoading={loading} />
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
        {warning && <p className="text-yellow-500 mt-2">Warning: {warning}</p>}
        {hasData && <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />}
      </main>

      {hasData && (
        <>
          <div className="px-4">
            <FiltersPanel
              dropdownFilters={{ console: logFilter, network: requestFilter }}
              toggleFilters={toggleFilters}
              onFilterChange={handleFilterChange}
              onReset={resetAllFilters}
            />
          </div>
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
            <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} count={filteredLogs.length} />
            <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} count={filteredRequests.length} />
          </div>
        </>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg">Analyzing... please wait.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
          {activeTab === 'console' && (
            <ConsoleView logs={filteredLogs} />
          )}
          {activeTab === 'network' && (
            <NetworkView requests={filteredRequests} />
          )}
          {!hasData && !error && (
             <div className="text-center text-gray-500 dark:text-gray-400">
                <p>Enter a URL to begin analysis.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;