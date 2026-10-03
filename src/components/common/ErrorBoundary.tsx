import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught render exception:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-card border border-brand-line p-8 shadow-card flex flex-col items-center">
            {/* Brand Cross Mark */}
            <div
              className="w-14 h-14 border-[3px] border-[#2786aa] rounded-full flex items-center justify-center text-brand-red font-extrabold text-2xl bg-white shadow-sm mb-4"
              aria-hidden="true"
            >
              +
            </div>

            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>

            <h2 className="font-serif text-xl font-bold text-brand-ink mb-2">
              {this.props.fallbackTitle || 'Unable to load this section'}
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mb-6 leading-relaxed">
              An unexpected error occurred. Please try reloading the page, or return to the hospital homepage.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue2 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-line hover:bg-brand-bg text-brand-ink rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Homepage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
