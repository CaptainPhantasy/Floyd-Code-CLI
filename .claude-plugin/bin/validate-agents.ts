#!/usr/bin/env node
/**
 * Agent File Validator CLI
 * 
 * Usage:
 *   validate-agents check [--dir=path]          Check agent files
 *   validate-agents fix [--dir=path] [--dry-run] Auto-fix issues
 *   validate-agents watch [--dir=path]          Watch for changes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import {
	validateAgentDirectory,
	validateAgentFile,
	fixAgentFile,
	formatValidationResults
} from '../validators/agent-file-validator.js';

const program = new Command();

program
	.name('validate-agents')
	.description('Validate VS Code agent file format')
	.version('1.0.0');

// Check command
program
	.command('check')
	.description('Validate agent files')
	.option('-d, --dir <path>', 'Directory to validate', '.claude/agents')
	.option('-f, --file <path>', 'Single file to validate')
	.action(async (options) => {
		console.log(chalk.blue('🔍 Validating agent files...\n'));

		try {
			if (options.file) {
				// Validate single file
				const result = await validateAgentFile(options.file);
				console.log(formatValidationResults([result]));
				
				if (!result.valid) {
					console.log(chalk.yellow('\n💡 Run with "fix" to auto-fix issues\n'));
					process.exit(1);
				}
			} else {
				// Validate directory
				const results = await validateAgentDirectory(options.dir);
				
				if (results.length === 0) {
					console.log(chalk.yellow(`No agent files found in ${options.dir}`));
					return;
				}

				console.log(formatValidationResults(results));

				const invalid = results.filter(r => !r.valid);
				if (invalid.length > 0) {
					console.log(chalk.red(`\n❌ ${invalid.length} file(s) have issues`));
					console.log(chalk.yellow('💡 Run with "fix" to auto-fix issues\n'));
					process.exit(1);
				} else {
					console.log(chalk.green(`\n✓ All ${results.length} agent file(s) are valid\n`));
				}
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error);
			process.exit(1);
		}
	});

// Fix command
program
	.command('fix')
	.description('Auto-fix agent file issues')
	.option('-d, --dir <path>', 'Directory to fix', '.claude/agents')
	.option('-f, --file <path>', 'Single file to fix')
	.option('--dry-run', 'Preview changes without applying')
	.action(async (options) => {
		const mode = options.dryRun ? 'Preview' : 'Fixing';
		console.log(chalk.blue(`🔧 ${mode} agent file issues...\n`));

		try {
			if (options.file) {
				// Fix single file
				const result = await fixAgentFile(options.file, options.dryRun);
				
				if (!result.fixed) {
					console.log(chalk.green(`✓ ${path.basename(options.file)} - No fixes needed`));
					return;
				}

				console.log(chalk.yellow(`${path.basename(options.file)}:`));
				result.changes.forEach(change => console.log(`  ${change}`));

				if (options.dryRun) {
					console.log(chalk.blue('\n--- Preview ---'));
					console.log(result.newContent);
					console.log(chalk.blue('--- End Preview ---'));
					console.log(chalk.yellow('\nRun without --dry-run to apply changes'));
				} else {
					console.log(chalk.green('\n✓ File fixed'));
				}
			} else {
				// Fix directory
				const results = await validateAgentDirectory(options.dir);
				
				if (results.length === 0) {
					console.log(chalk.yellow(`No agent files found in ${options.dir}`));
					return;
				}

				const invalid = results.filter(r => !r.valid);
				if (invalid.length === 0) {
					console.log(chalk.green('✓ No issues found'));
					return;
				}

				let fixed = 0;
				for (const result of invalid) {
					const fixResult = await fixAgentFile(result.filePath, options.dryRun);
					
					if (fixResult.fixed) {
						console.log(chalk.yellow(`\n${path.basename(result.filePath)}:`));
						fixResult.changes.forEach(change => console.log(`  ${change}`));
						fixed++;
					}
				}

				if (options.dryRun) {
					console.log(chalk.yellow(`\n💡 ${fixed} file(s) would be fixed`));
					console.log(chalk.yellow('Run without --dry-run to apply changes'));
				} else {
					console.log(chalk.green(`\n✓ Fixed ${fixed} file(s)`));
				}
			}
		} catch (error) {
			console.error(chalk.red('Error:'), error);
			process.exit(1);
		}
	});

// Watch command
program
	.command('watch')
	.description('Watch agent files for changes')
	.option('-d, --dir <path>', 'Directory to watch', '.claude/agents')
	.action(async (options) => {
		const chokidar = await import('chokidar');
		
		console.log(chalk.blue(`👀 Watching ${options.dir} for changes...\n`));

		const watcher = chokidar.watch(`${options.dir}/**/*.{md,agent.md}`, {
			persistent: true,
			ignoreInitial: false
		});

		watcher.on('add', async (filePath) => {
			console.log(chalk.gray(`Checking ${path.basename(filePath)}...`));
			const result = await validateAgentFile(filePath);
			
			if (!result.valid) {
				console.log(chalk.red(`✗ ${path.basename(filePath)} has issues:`));
				result.errors.forEach(err => {
					console.log(chalk.yellow(`  • ${err.message}`));
				});
			}
		});

		watcher.on('change', async (filePath) => {
			console.log(chalk.gray(`Validating ${path.basename(filePath)}...`));
			const result = await validateAgentFile(filePath);
			
			if (result.valid) {
				console.log(chalk.green(`✓ ${path.basename(filePath)}`));
			} else {
				console.log(chalk.red(`✗ ${path.basename(filePath)} has issues:`));
				result.errors.forEach(err => {
					console.log(chalk.yellow(`  • ${err.message}`));
				});
			}
		});

		// Keep process running
		process.on('SIGINT', () => {
			console.log(chalk.blue('\n\nStopped watching'));
			process.exit(0);
		});
	});

program.parse();
