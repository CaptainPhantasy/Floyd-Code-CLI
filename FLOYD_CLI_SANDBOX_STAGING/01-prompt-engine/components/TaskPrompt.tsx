import React, {type ReactNode} from 'react';

export interface TaskPromptProps {
	children: ReactNode;
}

export function TaskPrompt({children}: TaskPromptProps) {
	return React.createElement('task', null, children);
}

TaskPrompt.displayName = 'Task';
