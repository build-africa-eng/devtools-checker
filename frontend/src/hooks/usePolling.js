import { useCallback, useRef, useState, useEffect } from 'react';

export function usePolling(callback, interval = 60000) {
  const intervalRef = useRef(null);
  const urlRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback((url) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    urlRef.current = url;
    intervalRef.current = setInterval(() => {
      callback(url);
    }, interval);
    setIsPolling(true);
  }, [callback, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { isPolling, startPolling, stopPolling, pollingUrl: urlRef.current };
}