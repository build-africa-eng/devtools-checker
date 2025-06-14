import { useState, useEffect, useRef, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import LogPanel from './components/LogPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { useFilteredLogs } from './hooks/useFilteredLogs';
import { Moon, Sun, Loader2 } from 'lucide-react';

function App() {
  const { analyze, loading, error, result } = useAnalysis();
  const [activeTab, setActiveTab] = useState('console');
  const [logFilter, setLogFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  const [toggleFilters, setToggleFilters] = useState({
    errors: false,
    warnings: false,
    failedRequests: false,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [runtimeLogs, setRuntimeLogs] = useState([]);

  const pollingUrlRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(
    result,
    toggleFilters,
    logFilter,
    requestFilter
  );

  const hasData = filteredLogs.length > 0 || filteredRequests.length > 0;

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Add error handler for failed resource loads
  useEffect(() => {
    const handleError = (event) => {
      if (event.filename) {
        setRuntimeLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          message: `Failed to load resource: ${event.filename} (Error: ${event.message})`,
        }]);
      } else if (error) {
        setRuntimeLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          message: `Analysis error: ${error.message || 'Unknown error'}`,
        }]);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [error]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  const handleToggleFilter = useCallback(
    filterName => {
      setToggleFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setLogFilter('all');
    setRequestFilter('all');
    setToggleFilters({ errors: false, warnings: false, failedRequests: false });
  }, []);

  const startPolling = useCallback((url, options = {}, interval = 60000) => {
    pollingUrlRef.current = url;
    pollingIntervalRef.current = setInterval(() => {
      analyze(url, options);
    }, interval);
    setIsPolling(true);
  }, [analyze]);

  const stopPolling = useCallback(() => {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleAnalyze = useCallback((normalizedUrl) => {
    setRuntimeLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message: `Analyzing URL: ${normalizedUrl}`,
    }]);
    pollingUrlRef.current = normalizedUrl;
    if (isPolling) {
      stopPolling();
      startPolling(normalizedUrl);
    } else {
      analyze(normalizedUrl);
    }
  }, [analyze, isPolling, startPolling, stopPolling]);

  useEffect(() => {
    if (result) {
      setRuntimeLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: `Analysis Result: ${result.logs.length} logs, ${result.requests.length} requests`,
      }]);
    }
  }, [result]);

  useEffect(() => {
    if (filteredLogs.length > 0 || filteredRequests.length > 0) {
      setRuntimeLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: `Filtered Data: ${filteredLogs.length} logs, ${filteredRequests.length} requests`,
      }]);
    }
  }, [filteredLogs, filteredRequests]);

  return (
    <div className="min-h-screen bg-red-500 dark:bg-blue-500 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <div className="flex items-center gap-3">
          {pollingUrlRef.current && (
            <button
              onClick={() => {
                if (isPolling) {
                  stopPolling();
                } else {
                  startPolling(pollingUrlRef.current);
                }
              }}
              className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              {isPolling ? 'Stop Polling' : 'Start Polling'}
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 max-w-7xl mx-auto w-full">
        <section className="mb-6">
          <UrlInput onAnalyze={handleAnalyze} loading={loading} globalError={error} />
          {warning && (
            <p className="text-yellow-600 dark:text-yellow-400 mt-2 text-sm" role="alert">
              {warning}
            </p>
          )}
        </section>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {hasData && (
          <>
            <nav className="flex gap-4 mb-4">
              <Tab
                label="Console"
                active={activeTab === 'console'}
                onClick={() => setActiveTab('console')}
              />
              <Tab
                label="Network"
                active={activeTab === 'network'}
                onClick={() => setActiveTab('network')}
              />
              <Tab
                label="Logs"
                active={activeTab === 'logs'}
                onClick={() => setActiveTab('logs')}
              />
            </nav>

            <FiltersPanel
              toggleFilters={toggleFilters}
              logFilter={logFilter}
              requestFilter={requestFilter}
              onToggle={handleToggleFilter}
              onLogFilterChange={setLogFilter}
              onRequestFilterChange={setRequestFilter}
              onReset={resetFilters}
            />

            <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />

            {activeTab === 'console' && <ConsoleView logs={filteredLogs} />}
            {activeTab === 'network' && <NetworkView requests={filteredRequests} />}
            {activeTab === 'logs' && <LogPanel logs={runtimeLogs} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;