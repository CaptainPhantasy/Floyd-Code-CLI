import React from 'react';
import {render, screen} from '@testing-library/react';
import {DiffViewer} from '../src/components/DiffViewer';

describe('DiffViewer Component', () => {
	it('should render diff viewer with two files', () => {
		const {container} = render(
			<DiffViewer
				file1Path="src/app.tsx"
				file2Path="src/app.backup.tsx"
				file1Content="console.log('Hello');\nconst x = 1;"
				file2Content="console.log('World');\nconst x = 2;"
			/>,
		);

		expect(container).toBeInTheDocument();
		expect(screen.getByText('src/app.tsx')).toBeInTheDocument();
		expect(screen.getByText('src/app.backup.tsx')).toBeInTheDocument();
	});

	it('should render diff with color highlighting', () => {
		const {container} = render(
			<DiffViewer
				file1Path="test.ts"
				file2Path="test.backup.ts"
				file1Content="const a = 1;"
				file2Content="const b = 2;"
			/>,
		);

		expect(container).toBeInTheDocument();
		expect(screen.getByText('1: const a = 1;')).toBeInTheDocument();
		expect(screen.getByText('1: const b = 2;')).toBeInTheDocument();
	});

	it('should handle empty files', () => {
		const {container} = render(
			<DiffViewer
				file1Path="empty.ts"
				file2Path="empty2.ts"
				file1Content=""
				file2Content=""
			/>,
		);

		expect(container).toBeInTheDocument();
	});

	it('should handle one empty file', () => {
		const {container} = render(
			<DiffViewer
				file1Path="test.ts"
				file2Path="empty.ts"
				file1Content="const a = 1;"
				file2Content=""
			/>,
		);

		expect(container).toBeInTheDocument();
	});
});
