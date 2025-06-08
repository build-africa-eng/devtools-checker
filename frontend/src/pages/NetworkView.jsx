import { useState } from 'react';
import NetworkLog from '../components/NetworkLog';

function NetworkView({ requests, filters }) {
  const [filter, setFilter] = useState('all');
  const filteredRequests = requests.filter((req) => {
    if (filter === 'all' && !Object.values(filters).some(Boolean)) return true;
    if (filters.failedRequests && req.status >= 400) return true;
    return false;
  });

  return (
    <>
      <div className="mb-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 p-1 rounded text-white"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed (4xx/5xx)</option>
        </select>
      </div>
      <NetworkLog requests={filteredRequests} />
    </>
  );
}

export default NetworkView;