/**
 * CRUSH Theme
 *
 * Theme configuration for FLOYD CLI UI components.
 * Stub implementation for rebuild.
 *
 * @module theme/crush-theme
 */

import chalk from 'chalk';

/**
 * Theme colors
 */
export const floydTheme = {
	primary: chalk.cyan,
	success: chalk.green,
	warning: chalk.yellow,
	danger: chalk.red,
	muted: chalk.gray,
};

/**
 * Theme roles
 */
export const floydRoles = {
	heading: chalk.bold.cyan,
	subheading: chalk.bold,
	code: chalk.yellow,
	string: chalk.green,
	number: chalk.magenta,
};

export default {
	...floydTheme,
	...floydRoles,
};
