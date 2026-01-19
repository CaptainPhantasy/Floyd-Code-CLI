/**
 * Project Detector
 *
 * Detects project type and available commands.
 */

import fs from 'fs-extra';
import path from 'path';

export type ProjectType = 'node' | 'go' | 'rust' | 'python' | 'unknown';

export interface ProjectDetection {
	type: ProjectType;
	confidence: number;
	packageManager?: 'npm' | 'yarn' | 'pnpm' | 'go' | 'cargo' | 'pip' | 'poetry';
	commands: {
		test?: string;
		format?: string;
		lint?: string;
		build?: string;
	};
	hasConfigFiles: string[];
}

export async function detectProject(
	projectPath: string = process.cwd(),
): Promise<ProjectDetection> {
	const result: ProjectDetection = {
		type: 'unknown',
		confidence: 0,
		commands: {},
		hasConfigFiles: [],
	};

	try {
		const files = await fs.readdir(projectPath);

		const hasPackageJson = files.includes('package.json');
		const hasTsConfig = files.includes('tsconfig.json');
		const hasPnpmLock = files.includes('pnpm-lock.yaml');
		const hasYarnLock = files.includes('yarn.lock');
		const hasNpmLock = files.includes('package-lock.json');

		if (hasPackageJson) {
			result.type = 'node';
			result.confidence = 0.8;
			result.hasConfigFiles.push('package.json');

			if (hasTsConfig) {
				result.hasConfigFiles.push('tsconfig.json');
				result.confidence += 0.1;
			}

			if (hasPnpmLock) {
				result.packageManager = 'pnpm';
			} else if (hasYarnLock) {
				result.packageManager = 'yarn';
			} else if (hasNpmLock) {
				result.packageManager = 'npm';
			} else {
				result.packageManager = 'npm';
			}

			const pm = result.packageManager;
			result.commands.test = `${pm} test`;
			result.commands.lint = `${pm} run lint`;
			result.commands.build = `${pm} run build`;

			try {
				const pkgPath = path.join(projectPath, 'package.json');
				const pkg = await fs.readJson(pkgPath);
				if (pkg.scripts) {
					if (pkg.scripts.test) result.commands.test = `${pm} test`;
					if (pkg.scripts.lint) result.commands.lint = `${pm} run lint`;
					if (pkg.scripts.build) result.commands.build = `${pm} run build`;
					if (pkg.scripts.format) result.commands.format = `${pm} run format`;
				}
			} catch {
				// Use defaults
			}
		}

		const hasGoMod = files.includes('go.mod');
		const hasGoSum = files.includes('go.sum');
		const hasMainGo =
			(await fileExists(path.join(projectPath, 'cmd', 'main.go'))) ||
			(await fileExists(path.join(projectPath, 'main.go')));

		if (hasGoMod || hasGoSum || hasMainGo) {
			if (hasGoMod) {
				result.type = 'go';
				result.confidence = 0.95;
				result.packageManager = 'go';
				result.hasConfigFiles.push('go.mod');

				result.commands.test = 'go test ./...';
				result.commands.build = 'go build ./...';
				result.commands.lint = 'golangci-lint run';
				result.commands.format = 'gofmt -w .';
			}
		}

		const hasCargoToml = files.includes('Cargo.toml');
		const hasCargoLock = files.includes('Cargo.lock');
		const hasSrcRs =
			(await fileExists(path.join(projectPath, 'src', 'main.rs'))) ||
			(await fileExists(path.join(projectPath, 'src', 'lib.rs')));

		if (hasCargoToml || hasCargoLock || hasSrcRs) {
			result.type = 'rust';
			result.confidence = 0.95;
			result.packageManager = 'cargo';
			result.hasConfigFiles.push('Cargo.toml');

			result.commands.test = 'cargo test';
			result.commands.build = 'cargo build';
			result.commands.lint = 'cargo clippy';
			result.commands.format = 'cargo fmt';
		}

		const hasPyProject = files.includes('pyproject.toml');
		const hasRequirementsTxt = files.includes('requirements.txt');
		const hasSetupPy = files.includes('setup.py');
		const hasMainPy =
			(await fileExists(path.join(projectPath, 'main.py'))) ||
			(await fileExists(path.join(projectPath, 'app.py')));

		if (hasPyProject || hasRequirementsTxt || hasSetupPy || hasMainPy) {
			result.type = 'python';
			result.confidence = hasPyProject ? 0.9 : 0.7;
			result.hasConfigFiles.push(
				hasPyProject ? 'pyproject.toml' : 'requirements.txt',
			);

			if (hasPyProject) {
				try {
					const pyprojectPath = path.join(projectPath, 'pyproject.toml');
					const content = await fs.readFile(pyprojectPath, 'utf-8');
					if (content.includes('poetry')) {
						result.packageManager = 'poetry';
						result.commands.test = 'poetry run pytest';
						result.commands.lint = 'poetry run pylint';
						result.commands.format = 'poetry run black .';
					}
				} catch {
					// Fall through to pip defaults
				}
			}

			if (!result.packageManager || result.packageManager === 'pip') {
				result.packageManager = 'pip';
				result.commands.test = 'pytest';
				result.commands.lint = 'pylint';
				result.commands.format = 'black .';
			}
		}
	} catch {
		// Return unknown on error
	}

	return result;
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export default {
	detectProject,
};
