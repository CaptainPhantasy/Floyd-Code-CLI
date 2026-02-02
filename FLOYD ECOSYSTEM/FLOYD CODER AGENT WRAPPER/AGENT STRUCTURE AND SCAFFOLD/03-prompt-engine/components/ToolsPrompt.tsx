import React from 'react';

export interface ToolsPromptProps {
	tools?: string[];
}

export function ToolsPrompt({tools = []}: ToolsPromptProps) {
	return React.createElement(
		'tools',
		null,
		React.createElement(
			'available',
			null,
			tools.map(tool => React.createElement('tool', {key: tool}, tool)),
		),
	);
}

ToolsPrompt.displayName = 'Tools';
