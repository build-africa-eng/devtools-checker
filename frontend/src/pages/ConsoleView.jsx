// src/pages/ConsoleView.js
import React from 'react';
import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No console logs to display for the current filters.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Console Logs</h2>
      <ConsoleLog logs={logs} />
    </section>
  );
}

export default ConsoleView;