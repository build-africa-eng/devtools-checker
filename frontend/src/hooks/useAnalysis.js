import { useState } from 'react';

/**
 * A custom React hook to analyze a URL using the backend API.
 * Handles loading, result, and error states.
 *
 * @returns {{
 *   analyze: (url: string, options?: { includeHtml?: boolean, includeScreenshot?: boolean }) => Promise<object|null>,
 *   loading: boolean,
 *   error: string|null,
 *   result: object|null
 * }}
 */
export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Translates internal errors to user-friendly messages.
   * @param {string} msg
   * @returns {string}
   */
  const friendlyError = (msg = '') => {
    const lowered = msg.toLowerCase();
    if (lowered.includes('failed to fetch')) return 'Cannot connect to the analysis server. Please check your connection or try again later.';
    if (lowered.includes('timeout')) return 'The website took too long to load and timed out.';
    if (lowered.includes('net::err')) return 'A network error occurred while trying to reach the website.';
    if (lowered.includes('navigation')) return 'Failed to navigate to the page during analysis.';
    return msg || 'An unknown error occurred.';
  };

  /**
   * Sends a URL to the backend for analysis.
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<object|null>}
   */
  const analyze = async (url, options = {}) => {
    if (!url || typeof url !== 'string') {
      setError('A valid URL is required.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/analyze`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error: ${response.status}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const formatted = {
        title: data.title || 'Untitled Page',
        html: data.html,
        screenshot: data.screenshot,
        logs: Array.isArray(data.logs) ? data.logs : [],
        requests: Array.isArray(data.requests) ? data.requests : [],
        warning: data.warning || null,
      };

      setResult(formatted);
      return formatted;

    } catch (err) {
      const userMessage = friendlyError(err.message);
      setError(userMessage);
      setResult(null);
      return null;

    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}