import { useState } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { useFilteredLogs } from './hooks/useFilteredLogs';

function App() {
  const { analyze, loading, error, result } = useAnalysis();
  const [activeTab, setActiveTab] = useState('console');
  const [filters, setFilters] = useState({ errors: false, failedRequests: false, warnings: false });

  const analysisData = result || { logs: [], requests: [], warning: null };
  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(analysisData, filters);
  const hasData = filteredLogs.length > 0 || filteredRequests.length > 0;

  const handleToggleFilter = (filter) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleResetFilters = () => {
    setFilters({ errors: false, failedRequests: false, warnings: false });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">DevTools Checker</h1>
        <UrlInput setAnalysisData={analyze} />
        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        {warning && <p className="text-yellow-400 mb-4">Warning: {warning}</p>}
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
        {activeTab === 'console' && <ConsoleView logs={filteredLogs} />}
        {activeTab === 'network' && <NetworkView requests={filteredRequests} />}
      </div>
    </div>
  );
}

export default App;