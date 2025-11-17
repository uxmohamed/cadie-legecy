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
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
          <div className="text-center">
            <h2 className="text-lg font-medium text-neutral-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
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

