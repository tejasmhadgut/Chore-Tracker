import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary catches React component errors
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Log to error tracking service in production
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
              <div className="bg-slate-800 rounded-2xl p-8 border border-red-500/30 shadow-2xl">
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-500/20 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-white mb-2 text-center">
                  Something Went Wrong
                </h1>
                <p className="text-gray-300 text-center mb-6">
                  We're sorry for the inconvenience. Please try refreshing the page.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <p className="text-xs text-red-300 font-mono break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={this.resetError}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/';
                    }}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Go Home
                  </button>
                </div>

                {/* Support Message */}
                <p className="text-xs text-gray-400 text-center mt-6">
                  If this continues, please contact support.
                </p>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
