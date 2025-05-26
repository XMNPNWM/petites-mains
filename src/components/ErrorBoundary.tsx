
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('[ERROR_BOUNDARY] Error caught:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR_BOUNDARY] Error details:', error, errorInfo);
  }

  private handleRetry = () => {
    console.log('[ERROR_BOUNDARY] Retrying...');
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    console.log('[ERROR_BOUNDARY] Reloading page...');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-slate-600 mb-6">
              An unexpected error occurred. Please try again or reload the page.
            </p>
            <div className="space-x-4">
              <Button onClick={this.handleRetry} variant="outline">
                Try Again
              </Button>
              <Button onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-500">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
