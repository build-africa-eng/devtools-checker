import { useMemo } from 'react';

/**
 * A custom React hook to filter logs and network requests from the analysis result.
 *
 * @param {object|null} result - The result object from the useAnalysis hook.
 * @param {object} filters - An object containing toggle states, e.g., { errors: true, warnings: true, failedRequests: true }.
 * @param {string} logFilter - The dropdown filter for log levels ('all', 'error', 'warning').
 * @param {string} requestFilter - The dropdown filter for request status ('all', 'success', 'failed').
 * @returns {{
 * filteredLogs: Array<object>,
 * filteredRequests: Array<object>,
 * warning: string|null
 * }} An object containing the filtered data and any top-level warning.
 */
export function useFilteredLogs(result, filters, logFilter, requestFilter) {
  // Destructure the analysis result, providing default empty arrays if result is null or undefined.
  const { logs, requests, warning } = result || { logs: [], requests: [], warning: null };

  const filteredLogs = useMemo(() => {
    // If there are no logs, return an empty array immediately.
    if (!logs || logs.length === 0) {
      return [];
    }

    return logs.filter((log) => {
      // Handle the dropdown filter first.
      if (logFilter !== 'all') {
        return log.level === logFilter;
      }

      // If the dropdown is 'all', use the toggle filters.
      // If no toggles are active, show all logs.
      if (!filters.errors && !filters.warnings) {
        return true;
      }

      // Otherwise, check against the active toggles.
      if (filters.errors && log.level === 'error') return true;
      if (filters.warnings && log.level === 'warning') return true;

      return false;
    });
  }, [logs, filters, logFilter]);

  const filteredRequests = useMemo(() => {
    // If there are no requests, return an empty array immediately.
    if (!requests || requests.length === 0) {
      return [];
    }

    return requests.filter((req) => {
      // Handle the dropdown filter first.
      if (requestFilter !== 'all') {
        if (requestFilter === 'success') {
          // A successful request has a status code less than 400.
          return req.status && req.status < 400;
        }
        if (requestFilter === 'failed') {
          // A failed request has a status code of 400 or greater.
          return req.status && req.status >= 400;
        }
      }

      // If the dropdown is 'all', check the 'failedRequests' toggle.
      if (filters.failedRequests) {
        return req.status && req.status >= 400;
      }

      // If no filters are active, show all requests.
      return true;
    });
  }, [requests, filters, requestFilter]);

  return { filteredLogs, filteredRequests, warning };
}