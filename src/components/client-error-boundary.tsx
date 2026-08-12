"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  label: string;
};

type ClientErrorBoundaryState = {
  failed: boolean;
};

export class ClientErrorBoundary extends Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ClientErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Jamly ${this.props.label} error`, error, info.componentStack);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
