// src/pages/NetworkView.js
import React from 'react';
import NetworkLog from '../components/NetworkLog';

function NetworkView({ requests = [] }) {
  if (requests.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No network requests to display for the current filters.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Network Requests</h2>
      <NetworkLog requests={requests} />
    </section>
  );
}

export default NetworkView;