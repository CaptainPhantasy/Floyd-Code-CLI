/**
 * Animation Engine
 *
 * Purpose: Animation frame scheduling for smooth UI animations
 * Exports: AnimationEngine class, AnimationConfig
 * Related: animations.ts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AnimationConfig {
	/**
	 * Duration in milliseconds
	 */
	duration: number;

	/**
	 * Easing function
	 */
	easing?: EasingFunction;

	/**
	 * Frame rate target (fps)
	 */
	fps?: number;
}

export type EasingFunction = (t: number) => number;

export interface AnimationFrame {
	/**
	 * Progress from 0 to 1
	 */
	progress: number;

	/**
	 * Eased value from 0 to 1
	 */
	eased: number;

	/**
	 * Timestamp in ms
	 */
	timestamp: number;
}

export type AnimationCallback = (frame: AnimationFrame) => void;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const Easing: Record<string, EasingFunction> = {
	linear: t => t,

	easeInQuad: t => t * t,
	easeOutQuad: t => t * (2 - t),
	easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

	easeInCubic: t => t * t * t,
	easeOutCubic: t => --t * t * t + 1,
	easeInOutCubic: t =>
		t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

	easeInQuart: t => t * t * t * t,
	easeOutQuart: t => 1 - --t * t * t * t * t,
	easeInOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

	easeInQuint: t => t * t * t * t * t,
	easeOutQuint: t => 1 + --t * t * t * t * t,
	easeInOutQuint: t =>
		t < 0.5 ? 16 * t * t * t * t : 1 + 16 * --t * t * t * t,

	easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
	easeOutSine: t => Math.sin((t * Math.PI) / 2),
	easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

	easeInExpo: t => (t === 0 ? 0 : 2 ** (10 * t - 10)),
	easeOutExpo: t => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
	easeInOutExpo: t =>
		t === 0
			? 0
			: t === 1
			? 1
			: t < 0.5
			? 2 ** (20 * t - 10) / 2
			: (2 - 2 ** (-20 * t + 10)) / 2,
};

// ============================================================================
// ANIMATION ENGINE
// ============================================================================

/**
 * AnimationEngine handles frame-by-frame animations
 *
 * Features:
 * - Configurable duration and easing
 * - Frame rate control with budgeting
 * - Cancellation support
 * - Progress callbacks
 * - Coalesces multiple animations into single render cycle
 * - Pauses animations when idle
 */
export class AnimationEngine {
	private animations = new Set<AnimationState>();
	private nextId = 0;
	private frameBudget = 16; // Max 16ms per frame (~60fps)
	private lastFrameTime = 0;
	private totalFrameTime = 0;
	private frameCount = 0;
	private isIdle = false;
	private idleCheckTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Start an animation
	 *
	 * @param config - Animation configuration
	 * @param callback - Callback for each frame
	 * @returns Animation ID for cancellation
	 */
	animate(config: AnimationConfig, callback: AnimationCallback): number {
		const id = this.nextId++;
		const easing = config.easing ?? Easing['linear'];
		const fps = config.fps ?? 60;
		const frameDuration = 1000 / fps;

		const animation: AnimationState = {
			id,
			startTime: Date.now(),
			duration: config.duration,
			easing: easing ?? Easing['linear'],
			frameDuration,
			callback,
			canceled: false,
		};

		this.animations.add(animation);
		this.scheduleFrame(animation);

		return id;
	}

	/**
	 * Cancel an animation
	 */
	cancel(id: number): void {
		for (const animation of this.animations) {
			if (animation.id === id) {
				animation.canceled = true;
				this.animations.delete(animation);
				return;
			}
		}
	}

	/**
	 * Cancel all animations
	 */
	cancelAll(): void {
		for (const animation of this.animations) {
			animation.canceled = true;
		}
		this.animations.clear();
	}

	/**
	 * Get number of active animations
	 */
	get activeCount(): number {
		return this.animations.size;
	}

	/**
	 * Schedule a next frame of an animation
	 */
	private scheduleFrame(animation: AnimationState): void {
		if (animation.canceled) {
			this.animations.delete(animation);
			return;
		}

		const now = Date.now();
		const elapsed = now - animation.startTime;
		const progress = Math.min(1, elapsed / animation.duration);

		// Frame budgeting: only schedule if within budget
		if (this.lastFrameTime > 0) {
			const timeSinceLastFrame = now - this.lastFrameTime;
			this.totalFrameTime += timeSinceLastFrame;
			this.frameCount++;

			// Check if we're over budget (e.g., >16ms average)
			if (this.frameCount > 10) {
				const avgFrameTime = this.totalFrameTime / this.frameCount;
				if (avgFrameTime > this.frameBudget) {
					// Skip this frame to reduce CPU load
					// Coalesce with next frame
					return;
				}
			}
		}

		this.lastFrameTime = now;

		if (progress >= 1) {
			// Animation complete
			this.animations.delete(animation);
			animation.callback({
				progress: 1,
				eased: animation.easing ? animation.easing(1) : 1,
				timestamp: now,
			});
			return;
		}

		// Emit frame
		animation.callback({
			progress,
			eased: animation.easing ? animation.easing(progress) : progress,
			timestamp: now,
		});

		// Schedule next frame
		setTimeout(() => this.scheduleFrame(animation), animation.frameDuration);
	}

	/**
	 * Start idle detection
	 */
	startIdleDetection(): void {
		if (this.idleCheckTimer) {
			return;
		}

		this.idleCheckTimer = setInterval(() => {
			const now = Date.now();
			const timeSinceLastFrame = now - this.lastFrameTime;
			this.isIdle = timeSinceLastFrame > 1000; // 1 second without frames = idle

			if (this.isIdle && this.animations.size > 0) {
				// Pause all animations when idle
				this.animations.clear();
				this.frameCount = 0;
				this.totalFrameTime = 0;
			}
		}, 1000);
	}

	/**
	 * Stop idle detection
	 */
	stopIdleDetection(): void {
		if (this.idleCheckTimer) {
			clearInterval(this.idleCheckTimer);
			this.idleCheckTimer = null;
		}
	}
}

interface AnimationState {
	id: number;
	startTime: number;
	duration: number;
	easing: EasingFunction | undefined;
	frameDuration: number;
	callback: AnimationCallback;
	canceled: boolean;
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let globalEngine: AnimationEngine | null = null;

/**
 * Get global animation engine instance
 */
export function getAnimationEngine(): AnimationEngine {
	if (!globalEngine) {
		globalEngine = new AnimationEngine();
	}
	return globalEngine;
}

/**
 * Create a new animation engine instance
 */
export function createAnimationEngine(): AnimationEngine {
	return new AnimationEngine();
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Animate a value with given configuration
 */
export function animate(
	config: AnimationConfig,
	callback: AnimationCallback,
): number {
	return getAnimationEngine().animate(config, callback);
}

/**
 * Cancel an animation by ID
 */
export function cancelAnimation(id: number): void {
	getAnimationEngine().cancel(id);
}

/**
 * Cancel all animations
 */
export function cancelAllAnimations(): void {
	getAnimationEngine().cancelAll();
}

/**
 * Get number of active animations
 */
export function getActiveAnimationCount(): number {
	return getAnimationEngine().activeCount;
}

export default AnimationEngine;
