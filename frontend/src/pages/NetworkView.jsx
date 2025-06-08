import { useState } from 'react';
import NetworkEntry from '../components/NetworkEntry';

function NetworkView({ requests }) {
  const [filter, setFilter] = useState('all');
  const filtered = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'failed') return req.status >= 400;
    if (filter === 'success') return req.status < 400;
    return true;
  });

  return (
    <>
      <div className="mb-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-gray-800 p-1 rounded text-white">
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed (4xx/5xx)</option>
        </select>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center">No requests available</p>
        ) : (
          filtered.map((req, index) => <NetworkEntry key={index} request={req} />)
        )}
      </div>
    </>
  );
}

export default NetworkView;