import { useMemo } from 'react';

export function useFilteredLogs(data, filters) {
  const { logs, requests, warning } = data || { logs: [], requests: [], warning: null };

  const filteredLogs = useMemo(() => {
    if (!filters || (!filters.errors && !filters.warnings)) {
      return logs;
    }
    return logs.filter((log) => {
      if (filters.errors && log.level === 'error') return true;
      if (filters.warnings && log.level === 'warn') return true;
      return false;
    });
  }, [logs, filters]);

  const filteredRequests = useMemo(() => {
    if (!filters || !filters.failedRequests) {
      return requests;
    }
    return requests.filter((req) => req.status && req.status >= 400);
  }, [requests, filters]);

  return { filteredLogs, filteredRequests, warning };
}