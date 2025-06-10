import React from 'react';
import NetworkLog from '../components/NetworkLog';

function NetworkView({ requests = [] }) {
  const isEmpty = !Array.isArray(requests) || requests.length === 0;

  return (
    <section className="space-y-4" aria-labelledby="network-requests-heading">
      <h2 id="network-requests-heading" className="text-xl font-semibold">
        Network Requests
      </h2>

      {isEmpty ? (
        <div
          className="text-center text-gray-500 dark:text-gray-400 py-8"
          role="alert"
          aria-live="polite"
        >
          <p>No network requests to display for the current filters.</p>
        </div>
      ) : (
        <NetworkLog requests={requests} />
      )}
    </section>
  );
}

export default NetworkView;