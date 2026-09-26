import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dashboard render failed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <h1>Что-то пошло не так</h1>
          <p>{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
