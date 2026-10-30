import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2rem', border: '1px solid #fed7aa', backgroundColor: '#fff' }}>
            <h2 style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '1.25rem' }}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '1.5rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                Reload Page
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
