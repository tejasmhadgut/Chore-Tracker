import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use relative URL or configured API URL
// Works with load balancer (port 80) or direct backend (port 5178)
const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000' // Direct backend for local development
    : window.location.origin // Production: use same origin
);

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Include cookies in all requests
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track retry count per request
const retryConfig = new WeakMap<InternalAxiosRequestConfig, number>();

// Add request interceptor for AbortController and request cancellation
axiosInstance.interceptors.request.use(
  (config) => {
    // Initialize retry count
    retryConfig.set(config, 0);

    // Add abort controller for request cancellation
    if (!config.signal) {
      const controller = new AbortController();
      config.signal = controller.signal;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor with retry logic and error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig;

    // Handle 401 Unauthorized - User session expired or invalid
    // NOTE: Do NOT redirect here - let the ProtectedRoute component handle redirects
    // This prevents infinite redirect loops when checking authentication
    if (error.response?.status === 401) {
      console.warn('[Axios] 401 Unauthorized:', config.url);
      // Clear cookies (but don't redirect - let the app handle it)
      return Promise.reject(error);
    }

    // Check if we should retry
    const shouldRetry =
      config && // Config exists
      error.response && // Got a response
      [408, 500, 502, 503, 504].includes(error.response.status) && // Retryable status codes (NOT 429)
      (retryConfig.get(config) || 0) < 3; // Haven't exceeded retry limit

    if (shouldRetry) {
      const retryCount = (retryConfig.get(config) || 0) + 1;
      retryConfig.set(config, retryCount);

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount - 1) * 1000;

      console.warn(
        `Retrying request (${retryCount}/3) after ${delay}ms:`,
        config.url,
        `Status: ${error.response?.status}`
      );

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export { axiosInstance, API_URL };
