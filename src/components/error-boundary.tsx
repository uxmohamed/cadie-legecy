"use client";

import * as React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-l0-solid)] px-4">
          <div className="text-center">
            <h2 className="text-lg font-medium text-[var(--text-primary)]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-[var(--bg-inverse)] px-4 py-2 text-sm text-[var(--text-inverse)] hover:bg-[var(--bg-inverse)]/90"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

