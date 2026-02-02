import * as React from 'react';
import * as Ink from 'ink';

interface TuiErrorBoundaryProps {
	children: React.ReactNode;
}

interface TuiErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary for entire TUI application
 * Catches component errors and provides graceful recovery
 */
export class TuiErrorBoundary extends React.Component<
	TuiErrorBoundaryProps,
	TuiErrorBoundaryState
> {
	constructor(props: TuiErrorBoundaryProps) {
		super(props);
		this.state = {hasError: false};
	}

	static getDerivedStateFromError(error: Error): TuiErrorBoundaryState {
		return {hasError: true, error};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error for debugging
		console.error('FLOYD TUI FATAL ERROR:', error);
		console.error('Component Stack:', errorInfo.componentStack);

		// Send to error tracking (placeholder)
		if (
			typeof process !== 'undefined' &&
			process.env.NODE_ENV === 'production'
		) {
			// TODO: Send error to production error tracking service
		}

		// Exit gracefully with error code
		process.exit(1);
	}

	render() {
		if (this.state.hasError) {
			return (
				<Ink.Box flexDirection="column" paddingX={1} justifyContent="center">
					<Ink.Text bold color="red">
						ERROR: FLOYD TUI CRASHED
					</Ink.Text>
					<Ink.Text dimColor>
						{'\n'}
						{'\n'}
						Something went wrong with the FLOYD TUI.
						{'\n'}
						Please restart the application.
						{'\n'}
						{'\n'}
						Error Details:
						{'\n'}
						{this.state.error?.message}
						{'\n'}
						{'\n'}
						If this issue persists, please report it.
						{'\n'}
					</Ink.Text>
				</Ink.Box>
			);
		}

		return this.props.children;
	}
}
