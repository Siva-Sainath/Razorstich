import React from 'react';

/** Catches render errors in heavy subtrees (3D canvas, charts) without white-screening the app. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info?.componentStack);
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-black/40 p-6 text-center"
          data-testid={this.props.testId || 'error-boundary'}
        >
          <p className="type-meta text-white/55">{this.props.message || 'This view failed to render.'}</p>
          {this.props.onRetry && (
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                this.props.onRetry?.();
              }}
              className="type-micro font-mono text-primary hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
