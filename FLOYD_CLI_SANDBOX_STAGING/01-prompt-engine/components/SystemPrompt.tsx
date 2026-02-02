import React, {type ReactNode} from 'react';

export interface SystemPromptProps {
	children: ReactNode;
	role?: string;
	constraints?: string[];
}

export function SystemPrompt({
	children,
	role = 'Senior Software Engineer',
	constraints = [
		'Ask for clarification if uncertain',
		'No destructive actions without permission',
	],
}: SystemPromptProps) {
	return React.createElement('system', null, [
		React.createElement('role', {key: 'role'}, role),
		React.createElement('instructions', {key: 'instructions'}, children),
		React.createElement(
			'constraints',
			{key: 'constraints'},
			constraints.map((constraint, index) =>
				React.createElement('constraint', {key: index}, constraint),
			),
		),
	]);
}

SystemPrompt.displayName = 'System';
