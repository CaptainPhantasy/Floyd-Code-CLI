import React, {type ReactNode} from 'react';
import {SystemPrompt, type SystemPromptProps} from './SystemPrompt.js';
import {TaskPrompt, type TaskPromptProps} from './TaskPrompt.js';
import {ContextPrompt, type ContextPromptProps} from './ContextPrompt.js';
import {ToolsPrompt, type ToolsPromptProps} from './ToolsPrompt.js';

type PromptNode = ReactNode;

function renderPromptNode(node: PromptNode): string {
	if (node === null || node === undefined || typeof node === 'boolean') {
		return '';
	}

	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map(renderPromptNode).join('');
	}

	if (React.isValidElement(node)) {
		const type = node.type;
		const tag =
			typeof type === 'string'
				? type
				: (type as {displayName?: string; name?: string}).displayName ||
					(type as {name?: string}).name ||
					'node';

		const children = renderPromptNode(node.props.children);
		return `<${tag}>${children}</${tag}>`;
	}

	return '';
}

export const PromptBuilder = {
	System: (props: SystemPromptProps) => React.createElement(SystemPrompt, props),
	Task: (props: TaskPromptProps) => React.createElement(TaskPrompt, props),
	Context: (props: ContextPromptProps) =>
		React.createElement(ContextPrompt, props),
	Tools: (props: ToolsPromptProps) => React.createElement(ToolsPrompt, props),
	format: (prompt: PromptNode): string => renderPromptNode(prompt),
};

export default PromptBuilder;
