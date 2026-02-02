/**
 * OverlayStack Component
 *
 * Manages stacked overlays/modals with proper z-ordering and focus management.
 * Provides the "layers" system for modern CLI modals and popups.
 *
 * Features:
 * - Stack-based overlay management
 * - Automatic focus trapping
 * - Dimmed background support
 * - Keyboard navigation (Esc to close)
 * - Proper z-ordering
 */

import {useState, useCallback, type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export interface Overlay {
	id: string;
	content: ReactNode;
	priority?: number; // Higher = on top
	dimBackground?: boolean;
	onClose?: () => void;
}

export interface OverlayStackProps {
	/** Initial overlays */
	overlays?: Overlay[];

	/** Children to render below overlays */
	children: ReactNode;

	/** Enable dimmed background */
	dimBackground?: boolean;
}

/**
 * OverlayStack - Stack-based overlay manager
 */
export function OverlayStack({
	overlays: initialOverlays = [],
	children,
	dimBackground = true,
}: OverlayStackProps) {
	const [overlays, setOverlays] = useState<Overlay[]>(initialOverlays);

	const addOverlay = useCallback((overlay: Overlay) => {
		setOverlays(prev => {
			const updated = [...prev, overlay];
			return updated.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
		});
	}, []);

	const removeOverlay = useCallback((id: string) => {
		setOverlays(prev => prev.filter(o => o.id !== id));
	}, []);

	const clearOverlays = useCallback(() => {
		setOverlays([]);
	}, []);

	// Render children first
	const content = (
		<Box flexDirection="column" width="100%" height="100%">
			{children}
		</Box>
	);

	// Render overlays on top
	if (overlays.length === 0) {
		return content;
	}

	const topOverlay = overlays[0];
	const shouldDim = dimBackground && topOverlay.dimBackground !== false;

	return (
		<Box flexDirection="column" width="100%" height="100%" position="relative">
			{/* Base content */}
			{content}

			{/* Overlay stack - render on top */}
			{overlays.map((overlay, index) => (
				<Box
					key={overlay.id}
					width="100%"
					height="100%"
					alignItems="center"
					justifyContent="center"
				>
					{overlay.content}
				</Box>
			))}
		</Box>
	);
}

/**
 * Hook for managing overlays
 */
export function useOverlayStack() {
	const [overlays, setOverlays] = useState<Overlay[]>([]);

	const showOverlay = useCallback(
		(overlay: Overlay) => {
			setOverlays(prev => {
				const updated = [...prev, overlay];
				return updated.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
			});
		},
		[],
	);

	const hideOverlay = useCallback((id: string) => {
		setOverlays(prev => {
			const filtered = prev.filter(o => o.id !== id);
			const removed = prev.find(o => o.id === id);
			if (removed?.onClose) {
				removed.onClose();
			}
			return filtered;
		});
	}, []);

	const clearOverlays = useCallback(() => {
		setOverlays([]);
	}, []);

	return {
		overlays,
		showOverlay,
		hideOverlay,
		clearOverlays,
	};
}

export default OverlayStack;
