/**
 * CRUSH Frame Component
 *
 * Bordered container with floating frame aesthetic.
 * Supports gradient borders, shadows, and various styles.
 */

import {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';
import {
	getBorderStyle,
	type BorderStyle,
	type BorderVariant,
	getBorderColor,
	getGradientBorder,
} from '../../theme/borders.js';
import {getGradient, type GradientName} from '../../theme/gradients.js';

export interface FrameProps {
	/** Content to display within the frame */
	children: ReactNode;

	/** Border style variant */
	borderStyle?: BorderStyle;

	/** Border color variant */
	borderVariant?: BorderVariant;

	/** Apply gradient to border */
	gradient?: GradientName | false;

	/** Custom border color (overrides variant) */
	borderColor?: string;

	/** Padding inside the frame */
	padding?:
		| number
		| {
				x?: number;
				y?: number;
				top?: number;
				bottom?: number;
				left?: number;
				right?: number;
		  };

	/** Width constraint */
	width?: number | '100%' | 'auto';

	/** Height constraint */
	height?: number | '100%' | 'auto';

	/** Add shadow effect */
	shadow?: boolean;

	/** Title displayed in the top border */
	title?: string;

	/** Title color */
	titleColor?: string;

	/** Flex direction */
	flexDirection?: 'row' | 'column';

	/** Alignment */
	alignItems?: 'flex-start' | 'center' | 'flex-end';

	/** Justification */
	justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

/**
 * Parse padding prop to {x, y} values
 */
function parsePadding(padding: FrameProps['padding']): {
	x: number;
	y: number;
	top: number;
	bottom: number;
	left: number;
	right: number;
} {
	if (typeof padding === 'number') {
		return {
			x: padding,
			y: padding,
			top: padding,
			bottom: padding,
			left: padding,
			right: padding,
		};
	}
	if (typeof padding === 'object' && padding !== null) {
		return {
			x: padding.x ?? 0,
			y: padding.y ?? 0,
			top: padding.top ?? padding.y ?? 0,
			bottom: padding.bottom ?? padding.y ?? 0,
			left: padding.left ?? padding.x ?? 0,
			right: padding.right ?? padding.x ?? 0,
		};
	}
	return {x: 0, y: 0, top: 0, bottom: 0, left: 0, right: 0};
}

/**
 * Frame component with CRUSH styling
 */
export function Frame({
	children,
	borderStyle = 'round',
	borderVariant = 'default',
	gradient = false,
	borderColor,
	padding = 1,
	width = 'auto',
	height = 'auto',
	shadow = false,
	title,
	titleColor = floydTheme.colors.secondary,
	flexDirection = 'column',
	alignItems = 'flex-start',
	justifyContent = 'flex-start',
}: FrameProps) {
	const pad = parsePadding(padding);
	const finalBorderColor = borderColor ?? getBorderColor(borderVariant);
	const inkBorderStyle = getBorderStyle(borderStyle);

	return (
		<Box flexDirection="column">
			{shadow && (
				<Box paddingLeft={1}>
					<Text dimColor>
						{' '.repeat(width === '100%' ? 80 : width === 'auto' ? 40 : width)}
					</Text>
				</Box>
			)}
			<Box
				borderStyle={gradient === false ? inkBorderStyle : 'round'}
				borderColor={gradient === false ? finalBorderColor : undefined}
				paddingX={pad.x}
				paddingY={pad.y}
				paddingTop={pad.top}
				paddingBottom={pad.bottom}
				paddingLeft={pad.left}
				paddingRight={pad.right}
				width={width}
				height={height}
				flexDirection={flexDirection}
				alignItems={alignItems}
				justifyContent={justifyContent}
			>
				{title && (
					<Box>
						<Text backgroundColor={finalBorderColor} color={titleColor}>
							{' ' + title + ' '}
						</Text>
					</Box>
				)}
				{children}
			</Box>
		</Box>
	);
}

/**
 * GradientFrame - Frame with gradient border effect
 */
export interface GradientFrameProps
	extends Omit<FrameProps, 'gradient' | 'borderColor'> {
	/** Gradient to apply */
	gradient: GradientName;
}

export function GradientFrame({
	children,
	borderStyle = 'round',
	gradient,
	title,
	padding = 1,
	width,
	height,
	flexDirection,
	alignItems,
	justifyContent,
}: GradientFrameProps) {
	const colors = getGradient(gradient);
	const pad = parsePadding(padding);

	// For gradient borders, we manually render corners with different colors
	const corners = getGradientBorder(borderStyle);

	return (
		<Box flexDirection="column" width={width}>
			{/* Top border with gradient */}
			<Box>
				<Text color={colors[0]}>{corners.tl}</Text>
				<Text color={colors[1]}>{'─'.repeat(4)}</Text>
				{title && (
					<>
						<Text color={colors[2]}> {title} </Text>
						<Text color={colors[3]}>{'─'.repeat(4)}</Text>
					</>
				)}
				{!title && <Text color={colors[2]}>{'─'.repeat(12)}</Text>}
				<Text color={colors[4]}>{'─'.repeat(4)}</Text>
				<Text color={colors[0]}>{corners.tr}</Text>
			</Box>

			{/* Content area */}
			<Box>
				<Text color={colors[0]}>{corners.v}</Text>
				<Box
					paddingX={pad.x}
					paddingY={pad.y}
					flexDirection={flexDirection}
					alignItems={alignItems}
					justifyContent={justifyContent}
					width={width}
					height={height}
				>
					{children}
				</Box>
				<Text color={colors[0]}>{corners.v}</Text>
			</Box>

			{/* Bottom border with gradient */}
			<Box>
				<Text color={colors[4]}>{corners.bl}</Text>
				<Text color={colors[3]}>{'─'.repeat(8)}</Text>
				<Text color={colors[2]}>{'─'.repeat(8)}</Text>
				<Text color={colors[1]}>{'─'.repeat(4)}</Text>
				<Text color={colors[0]}>{corners.br}</Text>
			</Box>
		</Box>
	);
}

/**
 * ModalFrame - Floating modal style frame
 */
export interface ModalFrameProps extends Omit<FrameProps, 'shadow'> {
	/** Show as modal (centered with shadow) */
	modal?: boolean;
}

export function ModalFrame({
	children,
	title,
	titleColor,
	padding = 1,
	width = 60,
	modal = true,
}: ModalFrameProps) {
	const content = (
		<Frame
			borderStyle="round"
			borderVariant="focus"
			padding={padding}
			width={width}
			shadow={modal}
			title={title}
			titleColor={titleColor}
		>
			{children}
		</Frame>
	);

	if (!modal) {
		return content;
	}

	// Center in viewport when modal
	return (
		<>
			<Box flexDirection="column">
				{/* Dimmed background simulation */}
				<Text color={floydTheme.colors.bgSubtle}>{' '.repeat(80)}</Text>
			</Box>
			{content}
		</>
	);
}

export default Frame;
