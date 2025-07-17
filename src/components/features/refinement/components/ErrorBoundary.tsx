import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Editor Error Boundary caught an error:', error);
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Editor Error Boundary caught an error:', error, errorInfo);
    
    // Auto-retry for DOM-related errors (like BubbleMenu issues)
    if (error.message.includes('removeChild') || error.message.includes('Node')) {
      setTimeout(() => {
        if (this.state.retryCount < 2) {
          this.setState({ 
            hasError: false, 
            retryCount: this.state.retryCount + 1 
          });
        }
      }, 500);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full p-4 bg-red-50 border border-red-200 rounded">
          <div className="text-center">
            <div className="text-red-600 mb-2">Editor Error</div>
            <div className="text-sm text-red-500">
              The editor encountered an error. Retrying...
            </div>
            <button 
              onClick={this.handleRetry}
              className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;