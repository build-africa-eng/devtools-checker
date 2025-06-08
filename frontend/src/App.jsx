import { useState, useEffect } from 'react';
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
  const [filters, setFilters] = useState({ errors: false, failedRequests: false, warnings: false });
  const [logFilter, setLogFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const analysisData = result || { logs: [], requests: [], warning: null };
  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(analysisData, filters, logFilter, requestFilter);
  const hasData = filteredLogs.length > 0 || filteredRequests.length > 0;

  const handleToggleFilter = (filter) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleResetFilters = () => {
    setFilters({ errors: false, failedRequests: false, warnings: false });
    setLogFilter('all');
    setRequestFilter('all');
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-accent" />}
        </button>
      </div>
      <div className="p-4">
        <UrlInput analyze={analyze} />
        {error && <p className="text-error mt-2">Error: {error}</p>}
        {warning && <p className="text-accent mt-2">Warning: {warning}</p>}
        {hasData && <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />}
      </div>
      <div className="p-4">
        <FiltersPanel filters={filters} onToggle={handleToggleFilter} onReset={handleResetFilters} />
      </div>
      <div className="flex border-b border-gray-700">
        <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} />
        <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && (
          <ConsoleView logs={filteredLogs} filters={filters} setFilter={setLogFilter} filter={logFilter} />
        )}
        {activeTab === 'network' && (
          <NetworkView requests={filteredRequests} filters={filters} setFilter={setRequestFilter} filter={requestFilter} />
        )}
      </div>
    </div>
  );
}

export default App;