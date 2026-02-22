#!/usr/bin/env node

/**
 * Fix Import Extensions
 *
 * Post-build script to fix .ts -> .js imports in ESM output.
 * TypeScript compiler doesn't handle this automatically for Node.js ESM.
 *
 * This script:
 * 1. Scans the dist/ directory for .js files
 * 2. Replaces .ts imports with .js imports
 * 3. Handles both single and double quotes
 * 4. Preserves source maps
 */

import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);
const DIST_DIR = join(ROOT_DIR, 'dist');

// Counters for reporting
let filesProcessed = 0;
let importsFixed = 0;
let errors = 0;

/**
 * Check if a path is a directory
 */
function isDirectory(path) {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Get all .js files in a directory recursively
 */
function getJsFiles(dir, files = []) {
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);

		if (isDirectory(fullPath)) {
			getJsFiles(fullPath, files);
		} else if (entry.endsWith('.js') && !entry.endsWith('.d.ts')) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Fix .ts imports to .js in a file
 */
function fixImportsInFile(filePath) {
	try {
		let content = readFileSync(filePath, 'utf-8');
		const originalContent = content;

		// Fix: from './module.ts' -> from './module.js'
		// Handles both single and double quotes
		content = content.replace(
			/from\s+(['"])(.+?)\.ts\1/g,
			(from, quote, path) => `from ${quote}${path}.js${quote}`,
		);

		// Fix: import('./module.ts') -> import('./module.js')
		content = content.replace(
			/import\(['"](.+?)\.ts['"]\)/g,
			(_, path) => `import('${path}.js')`,
		);

		// Fix dynamic imports with template literals
		content = content.replace(
			/import\(`(.+?)\.ts`\)/g,
			(_, path) => `import(\`${path}.js\`)`,
		);

		// Only write if changed
		if (content !== originalContent) {
			writeFileSync(filePath, content, 'utf-8');
			const fixedCount = (content.match(/\.js['"]/g) || []).length;
			importsFixed += fixedCount;
			return true;
		}

		return false;
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error.message);
		errors++;
		return false;
	}
}

/**
 * Main execution
 */
function main() {
	console.log('🔧 Fixing import extensions in dist/...\n');

	if (!isDirectory(DIST_DIR)) {
		console.error('❌ dist/ directory not found. Run build first.');
		process.exit(1);
	}

	const jsFiles = getJsFiles(DIST_DIR);

	if (jsFiles.length === 0) {
		console.log('⚠️  No .js files found in dist/');
		process.exit(0);
	}

	console.log(`📁 Found ${jsFiles.length} JavaScript files\n`);

	for (const file of jsFiles) {
		const relativePath = file.replace(DIST_DIR + '/', '');
		const changed = fixImportsInFile(file);

		if (changed) {
			console.log(`  ✓ Fixed: ${relativePath}`);
			filesProcessed++;
		}
	}

	console.log(`\n✅ Processed ${filesProcessed} files`);
	console.log(`📝 Fixed ${importsFixed} imports`);

	if (errors > 0) {
		console.log(`⚠️  Encountered ${errors} errors`);
		process.exit(1);
	}

	console.log('\n✨ Done!');
}

main();
