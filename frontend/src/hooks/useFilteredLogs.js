import { useMemo } from 'react';

export function useFilteredLogs(data, filters, logFilter, requestFilter) {
  const { logs, requests, warning } = data || { logs: [], requests: [], warning: null };

  const filteredLogs = useMemo(() => {
    // Show all logs if no filters are active and logFilter is 'all'
    if (
      logFilter === 'all' &&
      (!filters || (!filters.errors && !filters.warnings))
    ) {
      return logs;
    }

    return logs.filter((log) => {
      // Apply local filter
      if (logFilter !== 'all' && log.level !== logFilter) {
        return false;
      }
      // Apply global filters
      if (filters.errors && log.level === 'error') return true;
      if (filters.warnings && log.level === 'warn') return true;
      return logFilter === 'all' && !filters.errors && !filters.warnings;
    });
  }, [logs, filters, logFilter]);

  const filteredRequests = useMemo(() => {
    // Show all requests if no filters are active and requestFilter is 'all'
    if (
      requestFilter === 'all' &&
      (!filters || !filters.failedRequests)
    ) {
      return requests;
    }

    return requests.filter((req) => {
      // Apply local filter
      if (requestFilter === 'success' && (!req.status || req.status >= 400)) {
        return false;
      }
      if (requestFilter === 'failed' && (!req.status || req.status < 400)) {
        return false;
      }
      // Apply global filters
      if (filters.failedRequests && req.status && req.status >= 400) return true;
      return requestFilter === 'all' && !filters.failedRequests;
    });
  }, [requests, filters, requestFilter]);

  return { filteredLogs, filteredRequests, warning };
}