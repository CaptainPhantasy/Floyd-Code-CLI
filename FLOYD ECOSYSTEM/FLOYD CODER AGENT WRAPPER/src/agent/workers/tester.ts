/**
 * Tester Worker Agent
 *
 * Purpose: Test execution and validation specialist.
 *
 * Features:
 * - Auto-detect test framework (jest, vitest, pytest, go test, etc.)
 * - Run specific test suites or individual tests
 * - Parse test output for failures
 * - Run linters and formatters
 * - Report test results in structured format
 *
 * @module agent/workers/tester
 */

import {createModuleLogger, type Logger} from '../../utils/logger.js';
import {execa} from 'execa';
import fs from 'fs-extra';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported test frameworks
 */
export type TestFramework =
	| 'jest'
	| 'vitest'
	| 'mocha'
	| 'ava'
	| 'pytest'
	| 'unittest'
	| 'go-test'
	| 'cargo-test'
	| 'unknown';

/**
 * Supported linters
 */
export type LinterType =
	| 'eslint'
	| 'pylint'
	| 'flake8'
	| 'golangci-lint'
	| 'clippy'
	| 'unknown';

/**
 * Supported formatters
 */
export type FormatterType =
	| 'prettier'
	| 'black'
	| 'gofmt'
	| 'rustfmt'
	| 'unknown';

/**
 * Individual test result
 */
export interface TestResult {
	/** File containing the test */
	file: string;
	/** Test name */
	name: string;
	/** Test status */
	status: 'pass' | 'fail' | 'skip' | 'timeout';
	/** Duration in milliseconds */
	duration: number;
	/** Error details if failed */
	error?: {
		message: string;
		stack?: string;
	};
}

/**
 * Summary of test run
 */
export interface TestSummary {
	/** Total number of tests */
	total: number;
	/** Number of passed tests */
	passed: number;
	/** Number of failed tests */
	failed: number;
	/** Number of skipped tests */
	skipped: number;
	/** Total duration in milliseconds */
	duration: number;
	/** List of failed tests */
	failures: TestResult[];
}

/**
 * Linter result for a single file
 */
export interface LintResult {
	/** File path */
	file: string;
	/** Line number */
	line: number;
	/** Column number */
	column?: number;
	/** Severity level */
	severity: 'error' | 'warning' | 'info';
	/** Rule name */
	rule?: string;
	/** Error/warning message */
	message: string;
}

/**
 * Format check result
 */
export interface FormatResult {
	/** File path */
	file: string;
	/** Whether file is properly formatted */
	formatted: boolean;
	/** Diff if not formatted */
	diff?: string;
}

/**
 * Parsed test output
 */
export interface ParsedResult {
	summary: TestSummary;
	tests: TestResult[];
	rawOutput: string;
}

/**
 * Framework detection result
 */
export interface FrameworkDetection {
	framework: TestFramework;
	confidence: number;
	configFile?: string;
	command?: string;
}

// ============================================================================
// TESTER WORKER CLASS
// ============================================================================

/**
 * TesterWorker - Test execution and validation specialist
 *
 * Token budget: 50 (balanced for test analysis)
 */
export class TesterWorker {
	private logger: Logger;
	private projectRoot: string;
	private cachedFramework: FrameworkDetection | null = null;

	constructor(projectRoot: string = process.cwd()) {
		this.projectRoot = path.resolve(projectRoot);
		this.logger = createModuleLogger('TesterWorker');
	}

	/**
	 * Set the project root directory
	 */
	setProjectRoot(projectRoot: string): void {
		this.projectRoot = path.resolve(projectRoot);
		this.cachedFramework = null; // Invalidate cache
	}

	/**
	 * Detect the test framework used in the project
	 */
	async detectFramework(projectPath?: string): Promise<FrameworkDetection> {
		const targetPath = projectPath
			? path.resolve(projectPath)
			: this.projectRoot;

		this.logger.debug(`Detecting test framework in: ${targetPath}`);

		// Check cache first
		if (this.cachedFramework && targetPath === this.projectRoot) {
			this.logger.debug(
				`Using cached framework: ${this.cachedFramework.framework}`,
			);
			return this.cachedFramework;
		}

		const detection: FrameworkDetection = {
			framework: 'unknown',
			confidence: 0,
		};

		try {
			const files = await fs.readdir(targetPath);

			// Check for package.json (Node.js projects)
			if (files.includes('package.json')) {
				const pkgPath = path.join(targetPath, 'package.json');
				const pkg = await fs.readJson(pkgPath).catch(() => ({}));

				// Check devDependencies for test frameworks
				const deps = {...pkg.dependencies, ...pkg.devDependencies};

				if (
					deps.vitest ||
					files.includes('vitest.config.ts') ||
					files.includes('vitest.config.js')
				) {
					detection.framework = 'vitest';
					detection.confidence = 0.95;
					detection.configFile = files.includes('vitest.config.ts')
						? 'vitest.config.ts'
						: files.includes('vitest.config.js')
						? 'vitest.config.js'
						: undefined;
					detection.command = 'npx vitest run';
				} else if (
					deps.jest ||
					files.includes('jest.config.js') ||
					files.includes('jest.config.ts')
				) {
					detection.framework = 'jest';
					detection.confidence = 0.95;
					detection.configFile = files.includes('jest.config.ts')
						? 'jest.config.ts'
						: files.includes('jest.config.js')
						? 'jest.config.js'
						: undefined;
					detection.command = 'npx jest';
				} else if (deps.mocha) {
					detection.framework = 'mocha';
					detection.confidence = 0.8;
					detection.command = 'npx mocha';
				} else if (deps.ava) {
					detection.framework = 'ava';
					detection.confidence = 0.8;
					detection.command = 'npx ava';
				} else if (pkg.scripts?.test) {
					// Generic detection based on test script
					detection.framework = 'jest'; // Most common default
					detection.confidence = 0.5;
					detection.command = 'npm test';
				}
			}

			// Check for Go projects
			if (files.includes('go.mod') || files.includes('go.sum')) {
				const hasTestFiles = await this.hasGoTests(targetPath);
				if (hasTestFiles) {
					detection.framework = 'go-test';
					detection.confidence = 0.9;
					detection.configFile = 'go.mod';
					detection.command = 'go test ./...';
				}
			}

			// Check for Rust projects
			if (files.includes('Cargo.toml')) {
				detection.framework = 'cargo-test';
				detection.confidence = 0.9;
				detection.configFile = 'Cargo.toml';
				detection.command = 'cargo test';
			}

			// Check for Python projects
			const hasPyProject = files.includes('pyproject.toml');
			const hasRequirements = files.includes('requirements.txt');
			const hasSetupPy = files.includes('setup.py');

			if (hasPyProject || hasRequirements || hasSetupPy) {
				// Check for pytest
				if (hasPyProject) {
					const pyprojectPath = path.join(targetPath, 'pyproject.toml');
					const content = await fs
						.readFile(pyprojectPath, 'utf-8')
						.catch(() => '');

					if (content.includes('pytest') || files.includes('pytest.ini')) {
						detection.framework = 'pytest';
						detection.confidence = 0.9;
						detection.configFile = files.includes('pytest.ini')
							? 'pytest.ini'
							: 'pyproject.toml';
						detection.command = 'pytest';
					} else if (content.includes('unittest') || content.includes('test')) {
						detection.framework = 'unittest';
						detection.confidence = 0.7;
						detection.command = 'python -m unittest discover';
					}
				} else {
					// Default to pytest for Python
					detection.framework = 'pytest';
					detection.confidence = 0.6;
					detection.command = 'pytest';
				}
			}

			this.logger.info(
				`Detected framework: ${detection.framework} (confidence: ${detection.confidence})`,
			);
		} catch (error) {
			this.logger.error('Error detecting framework', error as Error);
		}

		// Cache the result
		if (targetPath === this.projectRoot) {
			this.cachedFramework = detection;
		}

		return detection;
	}

	/**
	 * Check if project has Go test files
	 */
	private async hasGoTests(projectPath: string): Promise<boolean> {
		try {
			const testFiles = await this.findFiles(projectPath, '**/*_test.go');
			return testFiles.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Find files matching a pattern
	 */
	private async findFiles(dir: string, pattern: string): Promise<string[]> {
		const results: string[] = [];

		async function walk(currentPath: string) {
			try {
				const entries = await fs.readdir(currentPath, {withFileTypes: true});
				for (const entry of entries) {
					const fullPath = path.join(currentPath, entry.name);
					if (entry.isDirectory()) {
						// Skip node_modules and other common directories
						if (
							!['node_modules', '.git', 'dist', 'build', 'target'].includes(
								entry.name,
							)
						) {
							await walk(fullPath);
						}
					} else if (entry.isFile()) {
						// Simple glob matching
						if (pattern.includes('*')) {
							const regex = new RegExp(
								'^' + pattern.replace(/\*/g, '.*') + '$',
							);
							if (regex.test(entry.name)) {
								results.push(fullPath);
							}
						} else if (entry.name === pattern) {
							results.push(fullPath);
						}
					}
				}
			} catch {
				// Ignore permission errors
			}
		}

		await walk(dir);
		return results;
	}

	/**
	 * Run tests with optional pattern filter
	 */
	async runTests(pattern?: string): Promise<TestResult[]> {
		const detection = await this.detectFramework();
		const command = detection.command;

		if (!command) {
			throw new Error(
				`No test command available for framework: ${detection.framework}`,
			);
		}

		this.logger.info(`Running tests with framework: ${detection.framework}`);

		// Build command args
		const args = this.buildTestArgs(detection.framework, pattern);
		const commandParts = command.split(' ');
		const cmd = commandParts[0];
		if (!cmd) {
			throw new Error('Command missing from detection');
		}
		const cmdArgs = [...commandParts.slice(1), ...args];

		this.logger.debug(`Executing: ${cmd} ${cmdArgs.join(' ')}`);

		const startTime = Date.now();

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result: any = await execa(cmd, cmdArgs, {
				cwd: this.projectRoot,
				timeout: 120000, // 2 minutes
				reject: false,
			});

			const parsed = this.parseTestOutput(
				(result.stdout || result.stderr || '') as string,
				detection.framework,
			);

			this.logger.info(
				`Tests completed: ${parsed.summary.passed}/${parsed.summary.total} passed`,
			);

			return parsed.tests;
		} catch (error) {
			this.logger.error('Test execution failed', error as Error);
			return [
				{
					file: '',
					name: 'test-execution',
					status: 'fail',
					duration: Date.now() - startTime,
					error: {
						message: (error as Error).message,
					},
				},
			];
		}
	}

	/**
	 * Run a single test by file and name
	 */
	async runSingleTest(filePath: string, testName: string): Promise<TestResult> {
		const detection = await this.detectFramework();
		const command = detection.command;

		if (!command) {
			throw new Error(
				`No test command available for framework: ${detection.framework}`,
			);
		}

		this.logger.info(`Running single test: ${testName} in ${filePath}`);

		const args = this.buildSingleTestArgs(
			detection.framework,
			filePath,
			testName,
		);
		const commandParts = command.split(' ');
		const cmd = commandParts[0];
		if (!cmd) {
			throw new Error('Command missing from detection');
		}
		const cmdArgs = [...commandParts.slice(1), ...args];

		const startTime = Date.now();

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result: any = await execa(cmd, cmdArgs, {
				cwd: this.projectRoot,
				timeout: 60000, // 1 minute
				reject: false,
			});

			const output = (result.stdout || result.stderr || '') as string;
			const parsed = this.parseTestOutput(output, detection.framework);

			// Find the specific test result
			const testResult = parsed.tests.find(
				t => t.name === testName || t.file === filePath,
			);

			if (testResult) {
				return testResult;
			}

			// Return a default result if not found
			return {
				file: filePath,
				name: testName,
				status: result.exitCode === 0 ? 'pass' : 'fail',
				duration: Date.now() - startTime,
				error:
					result.exitCode !== 0 ? {message: output.slice(0, 500)} : undefined,
			};
		} catch (error) {
			this.logger.error('Single test execution failed', error as Error);
			return {
				file: filePath,
				name: testName,
				status: 'fail',
				duration: Date.now() - startTime,
				error: {
					message: (error as Error).message,
				},
			};
		}
	}

	/**
	 * Build test arguments for the framework
	 */
	private buildTestArgs(framework: TestFramework, pattern?: string): string[] {
		switch (framework) {
			case 'jest':
				return pattern ? [pattern, '--verbose'] : ['--verbose'];
			case 'vitest':
				return pattern ? [pattern, '--run'] : ['--run'];
			case 'mocha':
				return pattern ? [pattern] : [];
			case 'ava':
				return pattern ? [pattern] : [];
			case 'pytest':
				return pattern ? ['-k', pattern, '-v'] : ['-v'];
			case 'unittest':
				return pattern ? ['-k', pattern] : [];
			case 'go-test':
				return pattern ? ['-run', pattern] : [];
			case 'cargo-test':
				return pattern ? [pattern] : [];
			default:
				return pattern ? [pattern] : [];
		}
	}

	/**
	 * Build arguments to run a single test
	 */
	private buildSingleTestArgs(
		framework: TestFramework,
		filePath: string,
		testName: string,
	): string[] {
		switch (framework) {
			case 'jest':
				return [filePath, '-t', testName];
			case 'vitest':
				return [filePath, '-t', testName, '--run'];
			case 'mocha':
				return [filePath, '--grep', testName];
			case 'ava':
				return [filePath, '-m', testName];
			case 'pytest':
				return [filePath, '-k', testName, '-v'];
			case 'unittest':
				return [filePath, '-k', testName];
			case 'go-test':
				return ['-run', testName, filePath];
			case 'cargo-test':
				return [testName];
			default:
				return [filePath];
		}
	}

	/**
	 * Parse test output based on framework
	 */
	parseTestOutput(output: string, framework: TestFramework): ParsedResult {
		const tests: TestResult[] = [];
		const summary: TestSummary = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			duration: 0,
			failures: [],
		};

		switch (framework) {
			case 'jest':
			case 'vitest':
				this.parseJestStyleOutput(output, tests, summary);
				break;
			case 'pytest':
				this.parsePytestOutput(output, tests, summary);
				break;
			case 'go-test':
				this.parseGoTestOutput(output, tests, summary);
				break;
			case 'cargo-test':
				this.parseCargoTestOutput(output, tests, summary);
				break;
			default:
				this.parseGenericOutput(output, tests, summary);
		}

		summary.failures = tests.filter(t => t.status === 'fail');

		return {
			summary,
			tests,
			rawOutput: output,
		};
	}

	/**
	 * Parse Jest/Vitest style output
	 */
	private parseJestStyleOutput(
		output: string,
		tests: TestResult[],
		summary: TestSummary,
	): void {
		const lines = output.split('\n');

		let currentFile = '';
		let currentTest: TestResult | null = null;
		let inErrorBlock = false;
		let errorLines: string[] = [];

		for (const line of lines) {
			// Match file headers: "PASS src/utils.test.ts"
			const fileMatch = line.match(/^(PASS|FAIL)\s+(.+)$/);
			if (fileMatch) {
				currentFile = fileMatch[2] ?? '';
				const status = fileMatch[1] === 'PASS' ? 'pass' : 'fail';
				// File-level result
				if (currentTest) {
					tests.push(currentTest);
				}
				currentTest = {
					file: currentFile,
					name: currentFile,
					status,
					duration: 0,
				};
				if (status === 'pass') {
					summary.passed++;
				} else {
					summary.failed++;
				}
				summary.total++;
				inErrorBlock = false;
				errorLines = [];
				continue;
			}

			// Match test names with status: "  test name"
			const testMatch = line.match(/^\s+[ox]\s+(.+)$/);
			if (testMatch && currentTest) {
				currentTest.name = testMatch[1] ?? '';
				continue;
			}

			// Match duration: "Time: 1.234s"
			const timeMatch = line.match(/Time:\s+([\d.]+)s/);
			if (timeMatch && timeMatch[1]) {
				summary.duration = Math.round(parseFloat(timeMatch[1]) * 1000);
			}

			// Match test duration: "  (1ms)"
			const durationMatch = line.match(/\((\d+)ms\)/);
			if (durationMatch && durationMatch[1] && currentTest) {
				currentTest.duration = parseInt(durationMatch[1], 10);
			}

			// Error indicator
			if (line.includes('FAIL') || line.includes('Error:')) {
				inErrorBlock = true;
			}

			if (inErrorBlock && line.trim()) {
				errorLines.push(line);
			}
		}

		if (currentTest) {
			if (errorLines.length > 0 && currentTest.status === 'fail') {
				currentTest.error = {
					message: errorLines.slice(0, 10).join('\n'),
					stack: errorLines.join('\n'),
				};
			}
			tests.push(currentTest);
		}

		// Try to parse summary line: "Tests: 10 passed, 2 failed, 1 skipped"
		const summaryMatch = output.match(
			/Tests?:\s+(\d+)\s+(passed|failed),?\s*(\d+)?\s*(failed|skipped)?/,
		);
		if (summaryMatch && summaryMatch[1]) {
			summary.total = parseInt(summaryMatch[1], 10);
		}
	}

	/**
	 * Parse pytest style output
	 */
	private parsePytestOutput(
		output: string,
		tests: TestResult[],
		summary: TestSummary,
	): void {
		const lines = output.split('\n');

		for (const line of lines) {
			// Match test results: PASSED test_module.py::test_name
			const passMatch = line.match(/^PASSED\s+(.+)/);
			if (passMatch && passMatch[1]) {
				const testName = passMatch[1];
				tests.push({
					file: testName.split('::')[0] ?? '',
					name: testName,
					status: 'pass',
					duration: 0,
				});
				summary.passed++;
				summary.total++;
			}

			// Match failed tests: FAILED test_module.py::test_name
			const failMatch = line.match(/^FAILED\s+(.+)/);
			if (failMatch && failMatch[1]) {
				const testName = failMatch[1];
				tests.push({
					file: testName.split('::')[0] ?? '',
					name: testName,
					status: 'fail',
					duration: 0,
				});
				summary.failed++;
				summary.total++;
			}

			// Match duration: "0.123s"
			const durationMatch = line.match(/in\s+([\d.]+)s/);
			if (durationMatch && durationMatch[1] && tests.length > 0) {
				const lastTest = tests[tests.length - 1];
				if (lastTest) {
					lastTest.duration = Math.round(parseFloat(durationMatch[1]) * 1000);
				}
			}
		}

		// Parse summary line: "10 passed, 2 failed in 1.23s"
		const summaryMatch = output.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
		if (summaryMatch && summaryMatch[1] && summaryMatch[2]) {
			summary.total =
				parseInt(summaryMatch[1], 10) + parseInt(summaryMatch[2], 10);
		}

		const durationMatch = output.match(/in\s+([\d.]+)s/);
		if (durationMatch && durationMatch[1]) {
			summary.duration = Math.round(parseFloat(durationMatch[1]) * 1000);
		}
	}

	/**
	 * Parse Go test output
	 */
	private parseGoTestOutput(
		output: string,
		tests: TestResult[],
		summary: TestSummary,
	): void {
		const lines = output.split('\n');

		for (const line of lines) {
			// Match: PASS: TestName (0.12s)
			const passMatch = line.match(/^PASS:\s+(\S+)\s+\(([\d.]+)s\)/);
			if (passMatch && passMatch[1] && passMatch[2]) {
				tests.push({
					file: '',
					name: passMatch[1],
					status: 'pass',
					duration: Math.round(parseFloat(passMatch[2]) * 1000),
				});
				summary.passed++;
				summary.total++;
			}

			// Match: FAIL: TestName (0.12s)
			const failMatch = line.match(/^FAIL:\s+(\S+)\s+\(([\d.]+)s\)/);
			if (failMatch && failMatch[1] && failMatch[2]) {
				tests.push({
					file: '',
					name: failMatch[1],
					status: 'fail',
					duration: Math.round(parseFloat(failMatch[2]) * 1000),
				});
				summary.failed++;
				summary.total++;
			}
		}

		// Parse summary: "ok      package/path  1.234s"
		const okMatch = output.match(/^ok\s+(\S+)\s+([\d.]+)s/);
		if (okMatch && okMatch[2]) {
			summary.duration = Math.round(parseFloat(okMatch[2]) * 1000);
		}

		// Parse failure summary: "FAIL    package/path  1.234s"
		const failSummaryMatch = output.match(/^FAIL\s+(\S+)\s+([\d.]+)s/);
		if (failSummaryMatch && failSummaryMatch[2]) {
			summary.duration = Math.round(parseFloat(failSummaryMatch[2]) * 1000);
		}
	}

	/**
	 * Parse Cargo test output
	 */
	private parseCargoTestOutput(
		output: string,
		tests: TestResult[],
		summary: TestSummary,
	): void {
		const lines = output.split('\n');

		for (const line of lines) {
			// Match: "test name ... ok"
			const passMatch = line.match(/^\s+test\s+(.+)\s+\.\.\.\s+ok/);
			if (passMatch && passMatch[1]) {
				tests.push({
					file: '',
					name: passMatch[1],
					status: 'pass',
					duration: 0,
				});
				summary.passed++;
				summary.total++;
			}

			// Match: "test name ... FAILED"
			const failMatch = line.match(
				/^\s+test\s+(.+)\s+\.\.\.\s+(FAILED|ignored)/,
			);
			if (failMatch && failMatch[1] && failMatch[2]) {
				const status = failMatch[2] === 'FAILED' ? 'fail' : 'skip';
				tests.push({
					file: '',
					name: failMatch[1],
					status,
					duration: 0,
				});
				if (status === 'fail') {
					summary.failed++;
				} else {
					summary.skipped++;
				}
				summary.total++;
			}
		}

		// Parse summary: "test result: ok. X passed; Y failed"
		const summaryMatch = output.match(/result:\s+ok\.\s+(\d+)\s+passed/);
		if (summaryMatch && summaryMatch[1]) {
			summary.total = parseInt(summaryMatch[1], 10);
		}
	}

	/**
	 * Parse generic test output (fallback)
	 */
	private parseGenericOutput(
		output: string,
		tests: TestResult[],
		summary: TestSummary,
	): void {
		const lines = output.split('\n');

		for (const line of lines) {
			if (
				line.includes('PASS') ||
				line.includes('OK') ||
				line.includes('passed')
			) {
				tests.push({
					file: '',
					name: line,
					status: 'pass',
					duration: 0,
				});
				summary.passed++;
				summary.total++;
			} else if (
				line.includes('FAIL') ||
				line.includes('FAILED') ||
				line.includes('error')
			) {
				tests.push({
					file: '',
					name: line,
					status: 'fail',
					duration: 0,
				});
				summary.failed++;
				summary.total++;
			}
		}
	}

	/**
	 * Run linter on the project
	 */
	async lint(projectPath?: string): Promise<LintResult[]> {
		const targetPath = projectPath
			? path.resolve(projectPath)
			: this.projectRoot;
		const results: LintResult[] = [];

		this.logger.info(`Running linter on: ${targetPath}`);

		// Detect linter type
		const linterType = await this.detectLinter(targetPath);

		let command: string;
		let args: string[] = [];

		switch (linterType) {
			case 'eslint':
				command = 'npx';
				args = ['eslint', '.', '--format', 'json'];
				break;
			case 'pylint':
				command = 'pylint';
				args = ['--output-format=json', '.'];
				break;
			case 'flake8':
				command = 'flake8';
				args = ['--format=json', '.'];
				break;
			case 'golangci-lint':
				command = 'golangci-lint';
				args = ['run', '--out-format=json'];
				break;
			case 'clippy':
				command = 'cargo';
				args = ['clippy', '--message-format=json'];
				break;
			default:
				this.logger.warn(`Unknown linter type: ${linterType}`);
				return [];
		}

		try {
			const result = await execa(command, args, {
				cwd: targetPath,
				timeout: 60000,
				reject: false,
			});

			// Parse linter output
			const parsed = this.parseLintOutput(
				result.stdout || result.stderr || '',
				linterType,
			);
			results.push(...parsed);
		} catch (error) {
			this.logger.error('Lint execution failed', error as Error);
		}

		this.logger.info(`Lint complete: ${results.length} issues found`);

		return results;
	}

	/**
	 * Detect the linter used in the project
	 */
	async detectLinter(projectPath: string): Promise<LinterType> {
		try {
			const files = await fs.readdir(projectPath);

			// Check for ESLint
			if (
				files.includes('.eslintrc.js') ||
				files.includes('.eslintrc.json') ||
				files.includes('.eslintrc.yml') ||
				files.includes('.eslintrc.yaml') ||
				files.includes('eslint.config.js')
			) {
				return 'eslint';
			}

			// Check for Python linters
			if (
				files.includes('pyproject.toml') ||
				files.includes('.pylintrc') ||
				files.includes('setup.py')
			) {
				try {
					const pyprojectPath = path.join(projectPath, 'pyproject.toml');
					const content = await fs
						.readFile(pyprojectPath, 'utf-8')
						.catch(() => '');

					if (content.includes('pylint')) {
						return 'pylint';
					}
					if (content.includes('flake8')) {
						return 'flake8';
					}
				} catch {
					// Default to pylint for Python
					return 'pylint';
				}
			}

			// Check for Go
			if (files.includes('go.mod')) {
				return 'golangci-lint';
			}

			// Check for Rust
			if (files.includes('Cargo.toml')) {
				return 'clippy';
			}
		} catch (error) {
			this.logger.error('Error detecting linter', error as Error);
		}

		return 'unknown';
	}

	/**
	 * Parse linter output
	 */
	private parseLintOutput(
		output: string,
		linterType: LinterType,
	): LintResult[] {
		const results: LintResult[] = [];

		switch (linterType) {
			case 'eslint':
				try {
					const data = JSON.parse(output);
					if (Array.isArray(data)) {
						for (const file of data) {
							for (const message of file.messages || []) {
								results.push({
									file: file.filePath,
									line: message.line,
									column: message.column,
									severity: message.severity === 2 ? 'error' : 'warning',
									rule: message.ruleId,
									message: message.message,
								});
							}
						}
					}
				} catch {
					// Parse as JSON lines
				}
				break;

			case 'pylint':
			case 'flake8':
				try {
					const data = JSON.parse(output);
					for (const item of data || []) {
						results.push({
							file: (item.path ?? item.filename) || '',
							line: item.line ?? 0,
							column: item.column,
							severity: item.type === 'error' ? 'error' : 'warning',
							rule:
								(item['message-id'] as string | undefined) ??
								(item.code as string | undefined),
							message: item.message ?? '',
						});
					}
				} catch {
					// Parse line by line
					for (const line of output.split('\n')) {
						// Match: file:line:column: message
						const match = line.match(/^(.+):(\d+):(?:(\d+):)?\s+(.+)$/);
						if (match && match[1] && match[2] && match[4]) {
							results.push({
								file: match[1],
								line: parseInt(match[2], 10),
								column: match[3] ? parseInt(match[3], 10) : undefined,
								severity: 'warning',
								message: match[4],
							});
						}
					}
				}
				break;

			default:
				// Generic line parsing
				for (const line of output.split('\n')) {
					if (line.includes('error') || line.includes('warning')) {
						results.push({
							file: '',
							line: 0,
							severity: line.includes('error') ? 'error' : 'warning',
							message: line,
						});
					}
				}
		}

		return results;
	}

	/**
	 * Check code formatting
	 */
	async checkFormat(projectPath?: string): Promise<FormatResult[]> {
		const targetPath = projectPath
			? path.resolve(projectPath)
			: this.projectRoot;
		const results: FormatResult[] = [];

		this.logger.info(`Checking format for: ${targetPath}`);

		const formatterType = await this.detectFormatter(targetPath);

		let command: string;
		let args: string[];

		switch (formatterType) {
			case 'prettier':
				command = 'npx';
				args = ['prettier', '--check', '.'];
				break;
			case 'black':
				command = 'black';
				args = ['--check', '.'];
				break;
			case 'gofmt':
				command = 'gofmt';
				args = ['-l', '.'];
				break;
			case 'rustfmt':
				command = 'cargo';
				args = ['fmt', '--', '--check'];
				break;
			default:
				this.logger.warn(`Unknown formatter type: ${formatterType}`);
				return [];
		}

		try {
			const result = await execa(command, args, {
				cwd: targetPath,
				timeout: 60000,
				reject: false,
			});

			if (result.exitCode !== 0) {
				// Parse output to find unformatted files
				const output = result.stdout || result.stderr || '';
				const files = this.parseFormatOutput(output, formatterType);

				for (const file of files) {
					results.push({
						file,
						formatted: false,
					});
				}
			}
		} catch (error) {
			this.logger.error('Format check failed', error as Error);
		}

		this.logger.info(
			`Format check complete: ${results.length} files need formatting`,
		);

		return results;
	}

	/**
	 * Detect the formatter used in the project
	 */
	async detectFormatter(projectPath: string): Promise<FormatterType> {
		try {
			const files = await fs.readdir(projectPath);

			// Check for Prettier
			if (
				files.includes('.prettierrc') ||
				files.includes('.prettierrc.json') ||
				files.includes('.prettierrc.js') ||
				files.includes('.prettierrc.yml') ||
				files.includes('prettier.config.js')
			) {
				return 'prettier';
			}

			// Check for Black (Python)
			if (files.includes('pyproject.toml')) {
				try {
					const pyprojectPath = path.join(projectPath, 'pyproject.toml');
					const content = await fs
						.readFile(pyprojectPath, 'utf-8')
						.catch(() => '');

					if (content.includes('black')) {
						return 'black';
					}
				} catch {
					// Fall through
				}
			}

			// Check for Go
			if (files.includes('go.mod')) {
				return 'gofmt';
			}

			// Check for Rust
			if (files.includes('Cargo.toml')) {
				return 'rustfmt';
			}
		} catch (error) {
			this.logger.error('Error detecting formatter', error as Error);
		}

		return 'unknown';
	}

	/**
	 * Parse format check output
	 */
	private parseFormatOutput(
		output: string,
		formatterType: FormatterType,
	): string[] {
		const files: string[] = [];

		switch (formatterType) {
			case 'prettier':
			case 'black':
			case 'gofmt':
				// Each line is a file path
				for (const line of output.split('\n')) {
					const trimmed = line.trim();
					if (
						trimmed &&
						!trimmed.startsWith('Checking') &&
						!trimmed.startsWith('formatted')
					) {
						files.push(trimmed);
					}
				}
				break;

			case 'rustfmt':
				// Rustfmt outputs "Diff in src/main.rs:" format
				const diffMatch = output.matchAll(/Diff in (.+?):/g);
				for (const match of diffMatch) {
					if (match[1]) {
						files.push(match[1]);
					}
				}
				break;
		}

		return files;
	}

	/**
	 * Get test summary from test results
	 */
	getSummary(testResults: TestResult[]): TestSummary {
		const summary: TestSummary = {
			total: testResults.length,
			passed: 0,
			failed: 0,
			skipped: 0,
			duration: 0,
			failures: [],
		};

		for (const result of testResults) {
			summary.duration += result.duration;

			switch (result.status) {
				case 'pass':
					summary.passed++;
					break;
				case 'fail':
					summary.failed++;
					summary.failures.push(result);
					break;
				case 'skip':
					summary.skipped++;
					break;
			}
		}

		return summary;
	}

	/**
	 * Format test results as a string
	 */
	formatResults(summary: TestSummary): string {
		const lines: string[] = [];

		lines.push(`Test Results:`);
		lines.push(`  Total:    ${summary.total}`);
		lines.push(`  Passed:   ${summary.passed}`);
		lines.push(`  Failed:   ${summary.failed}`);
		lines.push(`  Skipped:  ${summary.skipped}`);
		lines.push(`  Duration: ${summary.duration}ms`);

		if (summary.failures.length > 0) {
			lines.push(`\nFailures:`);
			for (const failure of summary.failures.slice(0, 10)) {
				lines.push(`  - ${failure.file || ''}: ${failure.name}`);
				if (failure.error) {
					lines.push(`    ${failure.error.message.split('\n')[0]}`);
				}
			}
			if (summary.failures.length > 10) {
				lines.push(`  ... and ${summary.failures.length - 10} more`);
			}
		}

		return lines.join('\n');
	}
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new TesterWorker instance
 */
export function createTesterWorker(projectRoot?: string): TesterWorker {
	return new TesterWorker(projectRoot);
}

// ============================================================================
// WORKER PROFILE
// ============================================================================

/**
 * Worker profile for agent orchestration
 */
export const TESTER_WORKER_PROFILE = {
	name: 'tester',
	tokenBudget: 50,
	description: 'Test execution and validation specialist',
	capabilities: [
		'detect_framework',
		'run_tests',
		'run_single_test',
		'lint',
		'check_format',
		'parse_test_output',
	],
	tools: [
		{
			name: 'detect_framework',
			description:
				'Auto-detect test framework (jest, vitest, pytest, go test, etc.)',
		},
		{
			name: 'run_tests',
			description: 'Run tests with optional pattern filter',
		},
		{
			name: 'run_single_test',
			description: 'Run a specific test by file and name',
		},
		{
			name: 'lint',
			description: 'Run linter on the project',
		},
		{
			name: 'check_format',
			description: 'Check code formatting',
		},
		{
			name: 'parse_test_output',
			description: 'Parse test output for failures',
		},
	],
	supportedFrameworks: [
		'jest',
		'vitest',
		'mocha',
		'ava',
		'pytest',
		'unittest',
		'go-test',
		'cargo-test',
	],
};

export default TesterWorker;
