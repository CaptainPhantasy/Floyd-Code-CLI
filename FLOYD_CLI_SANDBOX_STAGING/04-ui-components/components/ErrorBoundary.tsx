/**
 * ErrorBoundary Component
 *
 * React error boundary to catch component errors and prevent full app crashes.
 * Displays a graceful error message and allows the user to continue or restart.
 *
 * @module ui/components/ErrorBoundary
 */

import React, {type ReactNode, type ErrorInfo} from 'react';
import {Box, Text} from 'ink';
import {floydTheme, crushTheme} from '../../theme/crush-theme.js';

export interface ErrorBoundaryProps {
	/** Children to render */
	children: ReactNode;

	/** Optional fallback component */
	fallback?: (error: Error, reset: () => void) => ReactNode;

	/** Callback when error occurs */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * ErrorBoundary - Catches React component errors and displays fallback UI
 *
 * Note: Must be a class component (React error boundaries don't work with hooks)
 */
export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error for debugging
		console.error('[ErrorBoundary] Caught error:', error);
		console.error('[ErrorBoundary] Error info:', errorInfo);

		// Call optional error handler
		this.props.onError?.(error, errorInfo);
	}

	reset = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.reset);
			}

			return (
				<Box
					flexDirection="column"
					padding={2}
					width="100%"
					height="100%"
					borderStyle="round"
					borderColor={crushTheme.status.error}
				>
					<Box marginBottom={1}>
						<Text bold color={crushTheme.status.error}>
							⚠️  Error
						</Text>
					</Box>

					<Box marginBottom={1} flexDirection="column">
						<Text color={floydTheme.colors.fgBase}>
							{this.state.error.message || 'An unexpected error occurred'}
						</Text>
					</Box>

					<Box marginTop={1} flexDirection="column">
						<Text color={floydTheme.colors.fgMuted} dimColor>
							Press 'r' to reset and continue, or 'q' to exit
						</Text>
					</Box>
				</Box>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
