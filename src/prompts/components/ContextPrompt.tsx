import React from 'react';

export interface ContextPromptProps {
	files?: string[];
	history?: string[];
}

export function ContextPrompt({files = [], history = []}: ContextPromptProps) {
	return React.createElement('context', null, [
		React.createElement(
			'files',
			{key: 'files'},
			files.map(file => React.createElement('file', {key: file}, file)),
		),
		React.createElement(
			'history',
			{key: 'history'},
			history.map((item, index) =>
				React.createElement('history-item', {key: index}, item),
			),
		),
	]);
}

ContextPrompt.displayName = 'Context';
