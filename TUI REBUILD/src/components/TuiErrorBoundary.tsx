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
	}

	resetError = () => {
		this.setState({hasError: false, error: undefined});
	}

	render() {
		if (this.state.hasError) {
			return (
				<Ink.Box flexDirection="column" padding={2} borderStyle="double" borderColor="red">
					<Ink.Text bold color="red">
						[!] FLOYD TUI ENCOUNTERED A FATAL ERROR
					</Ink.Text>
					<Ink.Box marginTop={1} flexDirection="column">
						<Ink.Text color="white">The application has crashed due to an unexpected error.</Ink.Text>
						<Ink.Box marginTop={1}>
							<Ink.Text dimColor>Error: {this.state.error?.message}</Ink.Text>
						</Ink.Box>
					</Ink.Box>
					<Ink.Box marginTop={2} flexDirection="column">
						<Ink.Text bold color="yellow">Recovery Options:</Ink.Text>
						<Ink.Box marginTop={1}>
							<Ink.Text color="red" bold>• Press Ctrl+C twice to exit completely</Ink.Text>
						</Ink.Box>
						<Ink.Text>• Check the logs for more details</Ink.Text>
					</Ink.Box>
				</Ink.Box>
			);
		}

		return this.props.children;
	}
}
