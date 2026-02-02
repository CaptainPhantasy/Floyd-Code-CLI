/**
 * File Watcher
 *
 * Purpose: File system change watcher using chokidar
 * Exports: FileWatcher class, WatchOptions, FileEvent
 * Related: FilePicker.tsx
 */

import chokidar from 'chokidar';

// ============================================================================
// TYPES
// ============================================================================

export type FileEventType =
	| 'add'
	| 'addDir'
	| 'change'
	| 'unlink'
	| 'unlinkDir'
	| 'ready'
	| 'error'
	| 'raw';

export interface FileEvent {
	/**
	 * Event type
	 */
	type: FileEventType;

	/**
	 * File or directory path
	 */
	path: string;

	/**
	 * Timestamp
	 */
	timestamp: number;

	/**
	 * Additional event details
	 */
	details?: {
		/**
		 * For stats events
		 */
		stats?: {
			size: number;
			mtime: number;
		};

		/**
		 * For error events
		 */
		error?: Error;
	};
}

export interface WatchOptions {
	/**
	 * Paths to watch
	 */
	paths: string | string[];

	/**
	 * Ignore patterns (glob or regex)
	 */
	ignored?: string | RegExp | Array<string | RegExp>;

	/**
	 * Watch for additions
	 */
	add?: boolean;

	/**
	 * Watch for changes
	 */
	change?: boolean;

	/**
	 * Watch for deletions
	 */
	unlink?: boolean;

	/**
	 * Watch directories
	 */
	directories?: boolean;

	/**
	 * Ignore initial events
	 */
	ignoreInitial?: boolean;

	/**
	 * Use polling (useful for network drives)
	 */
	usePolling?: boolean;

	/**
	 * Polling interval in ms
	 */
	interval?: number;

	/**
	 * Debounce delay in ms
	 */
	awaitWriteFinish?:
		| boolean
		| {
				stabilityThreshold?: number;
				pollInterval?: number;
		  };

	/**
	 * Whether to persist after process exit
	 */
	persistent?: boolean;

	/**
	 * Watch depth (infinity for recursive)
	 */
	depth?: number;

	/**
	 * Disable watching on Windows for performance
	 */
	disableGlobbing?: boolean;
}

export type WatchCallback = (event: FileEvent) => void;

export type WatchErrorHandler = (error: Error) => void;

export type WatchReadyCallback = () => void;

// ============================================================================
// FILE WATCHER
// ============================================================================

/**
 * FileWatcher wraps chokidar for file system watching
 *
 * Features:
 * - Watch multiple paths
 * - Pattern-based ignoring
 * - Event callbacks for changes
 * - Debouncing for stability
 * - Start/stop control
 */
export class FileWatcher {
	private watcher: chokidar.FSWatcher | null = null;
	private callbacks: Map<FileEventType, Set<WatchCallback>>;
	private errorHandlers: Set<WatchErrorHandler>;
	private readyHandlers: Set<WatchReadyCallback>;
	private options: WatchOptions;

	constructor(options: WatchOptions) {
		this.options = options;
		this.callbacks = new Map();
		this.errorHandlers = new Set();
		this.readyHandlers = new Set();
	}

	/**
	 * Start watching
	 */
	start(): void {
		if (this.watcher) {
			return; // Already started
		}

		const chokidarOptions: chokidar.WatchOptions = {
			ignored: this.options.ignored,
			persistent: this.options.persistent ?? true,
			ignoreInitial: this.options.ignoreInitial ?? false,
			followSymlinks: true,
			depth: this.options.depth,
			awaitWriteFinish: this.options.awaitWriteFinish ?? true,
			usePolling: this.options.usePolling,
			interval: this.options.interval,
		};

		this.watcher = chokidar.watch(this.options.paths, chokidarOptions);

		// Set up event handlers
		if (this.options.add !== false) {
			this.watcher.on('add', filePath => this.emit('add', filePath));
			this.watcher.on('addDir', dirPath => this.emit('addDir', dirPath));
		}

		if (this.options.change !== false) {
			this.watcher.on('change', filePath => this.emit('change', filePath));
		}

		if (this.options.unlink !== false) {
			this.watcher.on('unlink', filePath => this.emit('unlink', filePath));
			this.watcher.on('unlinkDir', dirPath => this.emit('unlinkDir', dirPath));
		}

		this.watcher.on('ready', () => {
			for (const handler of this.readyHandlers) {
				handler();
			}
		});

		this.watcher.on('error', error => {
			for (const handler of this.errorHandlers) {
				handler(error);
			}
		});
	}

	/**
	 * Stop watching
	 */
	async stop(): Promise<void> {
		if (this.watcher) {
			await this.watcher.close();
			this.watcher = null;
		}
	}

	/**
	 * Add a path to watch
	 */
	add(filePath: string): void {
		this.watcher?.add(filePath);
	}

	/**
	 * Remove a path from watching
	 */
	unwatch(filePath: string): void {
		this.watcher?.unwatch(filePath);
	}

	/**
	 * Get watched paths
	 */
	getWatched(): string[] {
		if (!this.watcher) {
			return [];
		}
		const watched = this.watcher.getWatched();
		const paths: string[] = [];
		for (const dir of Object.keys(watched)) {
			const watchedFiles = watched[dir];
			if (watchedFiles) {
				paths.push(dir, ...watchedFiles);
			}
		}
		return paths;
	}

	/**
	 * Register a callback for a specific event type
	 */
	on(eventType: FileEventType, callback: WatchCallback): this {
		if (!this.callbacks.has(eventType)) {
			this.callbacks.set(eventType, new Set());
		}
		this.callbacks.get(eventType)!.add(callback);
		return this;
	}

	/**
	 * Remove a callback for a specific event type
	 */
	off(eventType: FileEventType, callback: WatchCallback): this {
		const callbacks = this.callbacks.get(eventType);
		if (callbacks) {
			callbacks.delete(callback);
		}
		return this;
	}

	/**
	 * Register an error handler
	 */
	onError(handler: WatchErrorHandler): this {
		this.errorHandlers.add(handler);
		return this;
	}

	/**
	 * Register a ready handler
	 */
	onReady(handler: WatchReadyCallback): this {
		this.readyHandlers.add(handler);
		return this;
	}

	/**
	 * Check if the watcher is ready
	 */
	isReady(): boolean {
		return this.watcher !== null;
	}

	/**
	 * Emit an event to all registered callbacks
	 */
	private emit(type: FileEventType, filePath: string): void {
		const callbacks = this.callbacks.get(type);
		if (!callbacks || callbacks.size === 0) {
			return;
		}

		const event: FileEvent = {
			type,
			path: filePath,
			timestamp: Date.now(),
		};

		for (const callback of callbacks) {
			try {
				callback(event);
			} catch (error) {
				// Emit to error handlers but don't crash
				for (const errorHandler of this.errorHandlers) {
					errorHandler(error as Error);
				}
			}
		}
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a file watcher with default options
 */
export function createFileWatcher(
	paths: string | string[],
	options?: Partial<WatchOptions>,
): FileWatcher {
	return new FileWatcher({
		paths,
		add: true,
		change: true,
		unlink: true,
		directories: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 200,
			pollInterval: 100,
		},
		...options,
	});
}

/**
 * Watch a single file
 */
export function watchFile(
	filePath: string,
	callback: WatchCallback,
): FileWatcher {
	const watcher = createFileWatcher(filePath, {
		add: false,
		unlink: false,
		directories: false,
		ignoreInitial: true,
	});

	watcher.on('change', callback);
	watcher.start();

	return watcher;
}

/**
 * Watch a directory recursively
 */
export function watchDirectory(
	dirPath: string,
	callback: WatchCallback,
	options?: Partial<WatchOptions>,
): FileWatcher {
	const watcher = createFileWatcher(dirPath, {
		depth: options?.depth ?? 99, // Deep but not infinite
		directories: options?.directories ?? false,
		ignoreInitial: true,
		...options,
	});

	// Register for all events
	const allEvents: FileEventType[] = ['add', 'change', 'unlink'];
	for (const eventType of allEvents) {
		watcher.on(eventType, callback);
	}

	watcher.start();

	return watcher;
}

/**
 * Watch files matching a glob pattern
 */
export function watchGlob(
	globPattern: string,
	callback: WatchCallback,
	options?: Partial<WatchOptions>,
): FileWatcher {
	const watcher = createFileWatcher(globPattern, {
		ignoreInitial: true,
		...options,
	});

	const allEvents: FileEventType[] = ['add', 'change', 'unlink'];
	for (const eventType of allEvents) {
		watcher.on(eventType, callback);
	}

	watcher.start();

	return watcher;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debounce file events to avoid rapid-fire callbacks
 */
export function debounceFileEvents(
	callback: WatchCallback,
	delay: number = 300,
): WatchCallback {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	const pendingEvents = new Set<string>();

	return (event: FileEvent) => {
		pendingEvents.add(event.path);

		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			// Emit the last event for each unique path
			for (const path of pendingEvents) {
				callback({
					...event,
					path,
				});
			}
			pendingEvents.clear();
			timeout = null;
		}, delay);
	};
}

/**
 * Group events by file path
 */
export function groupEventsByPath(
	events: FileEvent[],
): Map<string, FileEvent[]> {
	const grouped = new Map<string, FileEvent[]>();

	for (const event of events) {
		if (!grouped.has(event.path)) {
			grouped.set(event.path, []);
		}
		grouped.get(event.path)!.push(event);
	}

	return grouped;
}

/**
 * Get the most recent event for each path
 */
export function getLatestEvents(events: FileEvent[]): FileEvent[] {
	const latestByPath = new Map<string, FileEvent>();

	for (const event of events) {
		const existing = latestByPath.get(event.path);
		if (!existing || event.timestamp > existing.timestamp) {
			latestByPath.set(event.path, event);
		}
	}

	return Array.from(latestByPath.values());
}

export default FileWatcher;
