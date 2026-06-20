import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

/**
 * Centralized error handling service for consistent error management
 * Translates HTTP errors and network errors into user-friendly messages
 */

interface ErrorContext {
  operation?: string; // e.g., "creating group", "fetching chores"
  userId?: string;
  groupId?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Get user-friendly error message based on error type and status code
 */
export function getUserFriendlyMessage(
  error: unknown,
  context?: ErrorContext
): string {
  const operation = context?.operation ? ` while ${context.operation}` : '';

  // Axios error
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    // Server-provided error message
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }

    // HTTP status-based messages
    switch (status) {
      case 400:
        return `Invalid request${operation}. Please check your input.`;
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return `You don't have permission to perform this action${operation}.`;
      case 404:
        return `The requested resource was not found${operation}.`;
      case 408:
        return `Request timeout${operation}. Please try again.`;
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return `Server error${operation}. Please try again later.`;
      default:
        if (error.request && !error.response) {
          return `Unable to connect to the server${operation}. Check your internet connection.`;
        }
    }
  }

  // Network error
  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return `Network error${operation}. Check your internet connection.`;
    }
    if (error.message.includes('timeout')) {
      return `Request timeout${operation}. Please try again.`;
    }
    return error.message;
  }

  // Unknown error
  return `An unexpected error occurred${operation}. Please try again.`;
}

/**
 * Log error for debugging/monitoring
 */
export function logError(
  error: unknown,
  context?: ErrorContext
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    operation: context?.operation,
    userId: context?.userId,
    groupId: context?.groupId,
    metadata: context?.metadata,
  };

  if (error instanceof AxiosError) {
    console.error('API Error:', {
      ...errorInfo,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      data: error.response?.data,
    });
  } else if (error instanceof Error) {
    console.error('Error:', {
      ...errorInfo,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error('Unknown Error:', { ...errorInfo, error });
  }
}

/**
 * Show error toast notification to user
 */
export function showErrorToast(
  error: unknown,
  context?: ErrorContext
): void {
  const message = getUserFriendlyMessage(error, context);
  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
}

/**
 * Handle error comprehensively: log + show toast + extract message
 */
export function handleError(
  error: unknown,
  context?: ErrorContext
): string {
  logError(error, context);
  showErrorToast(error, context);
  return getUserFriendlyMessage(error, context);
}

/**
 * Extract data from error response if available
 */
export function getErrorData(error: unknown): Record<string, unknown> | null {
  if (error instanceof AxiosError && error.response?.data) {
    return error.response.data as Record<string, unknown>;
  }
  return null;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    // Retry on network errors, timeouts, and 5xx server errors
    return !error.response || [408, 429, 500, 502, 503, 504].includes(status || 0);
  }
  return false;
}

/**
 * Check if error is due to authentication
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is due to authorization
 */
export function isAuthzError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}

export const errorHandler = {
  getUserFriendlyMessage,
  logError,
  showErrorToast,
  handleError,
  getErrorData,
  isRetryableError,
  isAuthError,
  isAuthzError,
};
