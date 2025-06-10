import React from 'react';
import ConsoleLog from '../components/ConsoleLog';

function ConsoleView({ logs = [] }) {
  const isEmpty = !Array.isArray(logs) || logs.length === 0;

  return (
    <section className="space-y-4" aria-labelledby="console-logs-heading">
      <h2 id="console-logs-heading" className="text-xl font-semibold">
        Console Logs
      </h2>

      {isEmpty ? (
        <div
          className="text-center text-gray-500 dark:text-gray-400 py-8"
          role="alert"
          aria-live="polite"
        >
          <p>No console logs to display for the current filters.</p>
        </div>
      ) : (
        <ConsoleLog logs={logs} />
      )}
    </section>
  );
}

export default ConsoleView;