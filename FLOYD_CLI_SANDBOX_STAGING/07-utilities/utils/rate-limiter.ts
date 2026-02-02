/**
 * Rate Limiter Utility
 *
 * Re-exports the throughput rate limiter for backwards compatibility.
 * For new code, prefer importing from '../throughput/rate-limiter.js'
 *
 * @module utils/rate-limiter
 */

export {
	RateLimiter,
	createRateLimiter,
	createStandardRateLimiter,
	type RateLimiterConfig,
	type RateLimiterMetrics,
} from '../throughput/rate-limiter.js';
