import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '../utils/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(
      error,
      'RENDER_ERROR', 
      this.props.componentName || 'ErrorBoundary',
      { componentStack: errorInfo.componentStack }
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Özel hata UI'ı göster
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Varsayılan hata UI'ı
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-300">
          <h3 className="text-lg font-medium text-red-800 mb-2">Bir şeyler yanlış gitti</h3>
          <p className="text-sm text-red-700">
            Hata: {this.state.error?.message || 'Bilinmeyen hata'}
          </p>
          <button
            className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 