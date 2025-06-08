import React from 'react';
import { CheckCircle, XCircle, Filter } from 'lucide-react';
import NetworkLog from '../components/NetworkLog';

function NetworkView({ requests, filter, setFilter }) {
  console.log('NetworkView requests:', requests);

  const getIcon = (value) => {
    switch (value) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error" />;
      default:
        return <Filter className="w-4 h-4 text-text/70" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Network Requests</h2>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-background-dark p-1 rounded text-text text-sm border border-gray-700 focus:border-primary"
          aria-label="Filter network requests"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed (4xx/5xx)</option>
        </select>
        {getIcon(filter)}
      </div>
      {requests.length === 0 && filter !== 'all' && (
        <p className="text-text/70">No requests match the selected filter.</p>
      )}
      <NetworkLog requests={requests} />
    </div>
  );
}

export default NetworkView;