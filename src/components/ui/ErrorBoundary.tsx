import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { FileText, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack ?? 'unavailable',
        },
      },
    });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh bg-surface flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-danger" />
            </div>

            <h1 className="text-lg font-bold text-navy mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-slate mb-6 leading-relaxed">
              Your data is safe. This error has been reported automatically.
              Try refreshing or going back to the dashboard.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh page
              </button>

              <button
                onClick={this.handleReset}
                className="w-full bg-white border border-border hover:border-slate-light text-navy font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Try again
              </button>

              <a
                href="/dashboard"
                className="text-sm text-shield font-medium mt-2 inline-block"
              >
                Go to dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
