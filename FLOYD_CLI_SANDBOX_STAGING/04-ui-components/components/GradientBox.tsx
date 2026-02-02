/**
 * GradientBox Component
 *
 * Box with gradient border/background effects.
 * Simulates gradient borders using multi-layer Box rendering.
 */

import {Box, Text} from 'ink';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';
import {getGradient, type GradientName} from '../../theme/gradients.js';

export interface GradientBoxProps {
	/** Content inside the box */
	children?: React.ReactNode;

	/** Gradient to use for border */
	gradient?: GradientName;

	/** Border style */
	borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble';

	/** Show gradient border */
	showBorder?: boolean;

	/** Fill background with gradient */
	filled?: boolean;

	/** Inner padding */
	padding?: number;

	/** Box width */
	width?: number | '100%';

	/** Box alignment */
	align?: 'left' | 'center' | 'right';

	/** Custom title */
	title?: string;

	/** Title color */
	titleColor?: string;

	/** Dim the gradient effect */
	dimGradient?: boolean;
}

/**
 * GradientBox component
 */
export function GradientBox({
	children,
	gradient = 'charple',
	showBorder = true,
	padding = 1,
	width = '100%',
	align = 'left',
	title,
	titleColor,
	dimGradient = false,
}: GradientBoxProps) {
	// Get gradient colors
	const gradientColors = getGradient(gradient);

	// Calculate dimensions
	const boxWidth = typeof width === 'number' ? width : 40;

	// Alignment helper
	const alignment = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end',
	}[align] as 'flex-start' | 'center' | 'flex-end';

	// Render simple border effect using Text with colored segments
	const renderBorder = () => {
		const topColor = gradientColors[0];
		const bottomColor = gradientColors[gradientColors.length - 1];

		return (
			<Box flexDirection="column" width={width}>
				{/* Top border with gradient */}
				<Box>
					<Text color={topColor} dimColor={dimGradient}>
						{'┌'}
					</Text>
					{Array.from({length: Math.max(4, boxWidth - 2)}).map((_, i) => {
						const colorIndex = i % gradientColors.length;
						return (
							<Text
								key={i}
								color={gradientColors[colorIndex]}
								dimColor={dimGradient}
							>
								{'─'}
							</Text>
						);
					})}
					<Text color={topColor} dimColor={dimGradient}>
						{'┐'}
					</Text>
				</Box>

				{/* Content area with side borders */}
				<Box>
					<Text color={gradientColors[0]} dimColor={dimGradient}>
						{'│'}
					</Text>
					<Box paddingX={padding}>
						{title && (
							<Text bold color={titleColor ?? floydRoles.headerTitle}>
								{title}
							</Text>
						)}
						{children}
					</Box>
					<Text color={gradientColors[0]} dimColor={dimGradient}>
						{'│'}
					</Text>
				</Box>

				{/* Bottom border with gradient */}
				<Box>
					<Text color={bottomColor} dimColor={dimGradient}>
						{'└'}
					</Text>
					{Array.from({length: Math.max(4, boxWidth - 2)}).map((_, i) => {
						const colorIndex = (boxWidth - 2 - i) % gradientColors.length;
						return (
							<Text
								key={i}
								color={gradientColors[colorIndex]}
								dimColor={dimGradient}
							>
								{'─'}
							</Text>
						);
					})}
					<Text color={bottomColor} dimColor={dimGradient}>
						{'┘'}
					</Text>
				</Box>
			</Box>
		);
	};

	// No border version - just content
	if (!showBorder) {
		return (
			<Box
				flexDirection="column"
				width={width}
				alignItems={alignment}
				paddingX={padding}
			>
				{children}
			</Box>
		);
	}

	return renderBorder();
}

/**
 * SolidGradientBox - Box filled with gradient color
 */
export interface SolidGradientBoxProps {
	/** Content inside the box */
	children?: React.ReactNode;

	/** Gradient to use */
	gradient?: GradientName;

	/** Padding */
	padding?: number;

	/** Width */
	width?: number | '100%';
}

export function SolidGradientBox({
	children,
	gradient = 'charple',
	padding = 1,
	width = '100%',
}: SolidGradientBoxProps) {
	const gradientColors = getGradient(gradient);
	const bgColor = gradientColors[Math.floor(gradientColors.length / 2)];

	return (
		<Box
			flexDirection="column"
			width={width}
			paddingX={padding}
			paddingY={padding}
			borderStyle="round"
			borderColor={bgColor}
		>
			{children}
		</Box>
	);
}

/**
 * AlertBox - Pre-configured gradient box for alerts
 */
export interface AlertBoxProps {
	/** Alert type */
	type?: 'info' | 'success' | 'warning' | 'error';

	/** Alert message */
	children: React.ReactNode;

	/** Alert title */
	title?: string;
}

export function AlertBox({type = 'info', children, title}: AlertBoxProps) {
	const alertConfig = {
		info: {
			gradient: 'charple' as GradientName,
			label: 'INFO',
			titleColor: floydTheme.colors.info,
		},
		success: {
			gradient: 'guac' as GradientName,
			label: 'SUCCESS',
			titleColor: floydTheme.colors.success,
		},
		warning: {
			gradient: 'zest' as GradientName,
			label: 'WARNING',
			titleColor: floydTheme.colors.warning,
		},
		error: {
			gradient: 'sriracha' as GradientName,
			label: 'ERROR',
			titleColor: floydTheme.colors.error,
		},
	};

	const config = alertConfig[type];

	return (
		<GradientBox
			gradient={config.gradient}
			title={title ?? config.label}
			titleColor={config.titleColor}
			padding={1}
		>
			{children}
		</GradientBox>
	);
}

export default GradientBox;
