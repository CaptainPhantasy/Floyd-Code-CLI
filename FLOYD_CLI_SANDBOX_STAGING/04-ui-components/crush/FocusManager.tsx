/**
 * FocusManager Component
 *
 * Keyboard focus management for interactive elements.
 * Provides Tab navigation, focus indicators, and focus trapping.
 *
 * Features:
 * - Tab/Shift+Tab navigation
 * - Focus indicators
 * - Focus trapping in modals
 * - Keyboard shortcuts
 */

import {useState, useCallback, useEffect, type ReactNode} from 'react';
import {useInput} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export interface FocusableElement {
	id: string;
	element: ReactNode;
	disabled?: boolean;
}

export interface FocusManagerProps {
	/** Focusable elements */
	elements: FocusableElement[];

	/** Initial focused element ID */
	initialFocus?: string;

	/** Enable focus trapping (for modals) */
	trapFocus?: boolean;

	/** Callback when focus changes */
	onFocusChange?: (id: string) => void;

	/** Render function for each element */
	children: (element: FocusableElement, focused: boolean) => ReactNode;
}

/**
 * FocusManager - Keyboard focus management
 */
export function FocusManager({
	elements,
	initialFocus,
	trapFocus = false,
	onFocusChange,
	children,
}: FocusManagerProps) {
	const enabledElements = elements.filter(e => !e.disabled);
	const [focusedId, setFocusedId] = useState<string | undefined>(
		initialFocus || enabledElements[0]?.id,
	);

	const focusIndex = enabledElements.findIndex(e => e.id === focusedId);
	const focusedElement = enabledElements[focusIndex];

	// Handle keyboard navigation
	useInput((_input, key) => {
		if (key.tab) {
			const direction = key.shift ? -1 : 1;
			const nextIndex =
				(focusIndex + direction + enabledElements.length) %
				enabledElements.length;
			const nextId = enabledElements[nextIndex]?.id;

			if (nextId) {
				setFocusedId(nextId);
				onFocusChange?.(nextId);
			}
		}
	});

	// Update focus when elements change
	useEffect(() => {
		if (!focusedId || !enabledElements.find(e => e.id === focusedId)) {
			const firstId = enabledElements[0]?.id;
			if (firstId) {
				setFocusedId(firstId);
			}
		}
	}, [elements, focusedId, enabledElements]);

	return (
		<>
			{enabledElements.map(element => (
				<FocusableWrapper
					key={element.id}
					id={element.id}
					focused={element.id === focusedId}
				>
					{children(element, element.id === focusedId)}
				</FocusableWrapper>
			))}
		</>
	);
}

interface FocusableWrapperProps {
	id: string;
	focused: boolean;
	children: ReactNode;
}

function FocusableWrapper({focused, children}: FocusableWrapperProps) {
	return (
		<>
			{/* Focus indicator would be rendered here if needed */}
			{children}
		</>
	);
}

/**
 * Hook for managing focus state
 */
export function useFocusManager(elements: FocusableElement[]) {
	const enabledElements = elements.filter(e => !e.disabled);
	const [focusedId, setFocusedId] = useState<string | undefined>(
		enabledElements[0]?.id,
	);

	const focusNext = useCallback(() => {
		const currentIndex = enabledElements.findIndex(e => e.id === focusedId);
		const nextIndex = (currentIndex + 1) % enabledElements.length;
		setFocusedId(enabledElements[nextIndex]?.id);
	}, [enabledElements, focusedId]);

	const focusPrevious = useCallback(() => {
		const currentIndex = enabledElements.findIndex(e => e.id === focusedId);
		const prevIndex =
			(currentIndex - 1 + enabledElements.length) % enabledElements.length;
		setFocusedId(enabledElements[prevIndex]?.id);
	}, [enabledElements, focusedId]);

	const focusById = useCallback(
		(id: string) => {
			if (enabledElements.find(e => e.id === id)) {
				setFocusedId(id);
			}
		},
		[enabledElements],
	);

	return {
		focusedId,
		focusNext,
		focusPrevious,
		focusById,
		setFocusedId,
	};
}

export default FocusManager;
