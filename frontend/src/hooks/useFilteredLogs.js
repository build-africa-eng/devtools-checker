import { useMemo } from 'react';

export function useFilteredLogs(data, filters, logFilter, requestFilter) {
  const { logs, requests, warning } = data || { logs: [], requests: [], warning: null };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Normalize log.level to expected values if needed outside hook

      if (logFilter !== 'all') {
        return log.level === logFilter;
      }

      // No dropdown filter, use toggles
      if (filters.errors && log.level === 'error') return true;
      if (filters.warnings && log.level === 'warning') return true;

      // If no toggles active, show all
      if (!filters.errors && !filters.warnings) return true;

      return false;
    });
  }, [logs, filters, logFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (requestFilter !== 'all') {
        if (requestFilter === 'success') {
          return req.status && req.status < 400;
        }
        if (requestFilter === 'failed') {
          return req.status && req.status >= 400;
        }
        return true;
      }

      if (filters.failedRequests) {
        return req.status && req.status >= 400;
      }

      // No filters active, show all
      return true;
    });
  }, [requests, filters, requestFilter]);

  return { filteredLogs, filteredRequests, warning };
}