import React from 'react';
import { CheckCircle, XCircle, Filter } from 'lucide-react';
import NetworkLog from '../components/NetworkLog';

function NetworkView({ requests, filter, setFilter }) {
  console.log('NetworkView requests:', requests);

  const getIcon = (value) => {
    switch (value) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Filter className="w-4 h-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Network Requests</h2>
      <div className="mb-2 flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 p-1 rounded text-white text-sm"
          aria-label="Filter network requests"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed (4xx/5xx)</option>
        </select>
        {getIcon(filter)}
      </div>
      {requests.length === 0 && filter !== 'all' && (
        <p className="text-gray-400">No requests match the selected filter.</p>
      )}
      <NetworkLog requests={requests} />
    </div>
  );
}

export default NetworkView;