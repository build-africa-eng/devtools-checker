import { useState, useCallback } from 'react';

export function useRuntimeLogs() {
  const [logs, setLogs] = useState([]);

  const log = useCallback((message) => {
    setLogs(prev => {
      const last = prev[prev.length - 1];
      if (last?.message === message) return prev;
      return [...prev, { timestamp: new Date().toISOString(), message }];
    });
  }, []);

  return { logs, log };
}