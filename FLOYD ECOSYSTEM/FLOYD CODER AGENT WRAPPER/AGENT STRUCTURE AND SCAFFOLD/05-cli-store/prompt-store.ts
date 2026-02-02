/**
 * Prompt Store
 *
 * Zustand store for prompt template library management.
 * Handles prompt templates, examples, and categories.
 *
 * @module store/prompt-store
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import fs from 'fs-extra';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prompt template category
 */
export type PromptCategory =
	| 'coding'
	| 'debug'
	| 'refactor'
	| 'explain'
	| 'review'
	| 'custom';

/**
 * Prompt template variable
 */
export interface PromptVariable {
	/** Variable name */
	name: string;
	/** Variable description */
	description: string;
	/** Default value */
	defaultValue?: string;
	/** Whether variable is required */
	required: boolean;
}

/**
 * Prompt example
 */
export interface PromptExample {
	/** Example input */
	input: string;
	/** Example output */
	output: string;
	/** Example description */
	description?: string;
}

/**
 * Prompt template
 */
export interface PromptTemplate {
	/** Unique identifier */
	id: string;
	/** Template name */
	name: string;
	/** Template category */
	category: PromptCategory;
	/** Template content (supports variables like {{variableName}}) */
	template: string;
	/** Available variables */
	variables: PromptVariable[];
	/** Few-shot examples */
	examples: PromptExample[];
	/** Template description */
	description?: string;
	/** Tags for search */
	tags: string[];
	/** Created timestamp */
	created: number;
	/** Last modified timestamp */
	modified: number;
	/** Usage count */
	usageCount: number;
	/** Whether template is favorite */
	favorite: boolean;
}

/**
 * Prompt store state and actions
 */
interface PromptStore {
	/** All prompt templates */
	templates: PromptTemplate[];
	/** Get template by ID */
	getTemplate: (id: string) => PromptTemplate | null;
	/** Get templates by category */
	getTemplatesByCategory: (category: PromptCategory) => PromptTemplate[];
	/** Search templates */
	searchTemplates: (query: string) => PromptTemplate[];
	/** Add template */
	addTemplate: (template: Omit<PromptTemplate, 'id' | 'created' | 'modified' | 'usageCount'>) => void;
	/** Update template */
	updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
	/** Remove template */
	removeTemplate: (id: string) => void;
	/** Render template with variables */
	renderTemplate: (id: string, variables: Record<string, string>) => string;
	/** Increment usage count */
	incrementUsage: (id: string) => void;
	/** Toggle favorite */
	toggleFavorite: (id: string) => void;
	/** Get favorites */
	getFavorites: () => PromptTemplate[];
	/** Load from file */
	loadFromFile: (filePath: string) => Promise<void>;
	/** Save to file */
	saveToFile: (filePath: string) => Promise<void>;
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const defaultTemplates: PromptTemplate[] = [
	{
		id: 'default-coding',
		name: 'Code Generation',
		category: 'coding',
		template: 'Generate code for: {{task}}\n\nRequirements:\n{{requirements}}\n\nLanguage: {{language}}',
		variables: [
			{name: 'task', description: 'What to build', required: true},
			{name: 'requirements', description: 'Requirements and constraints', required: false},
			{name: 'language', description: 'Programming language', defaultValue: 'TypeScript', required: false},
		],
		examples: [
			{
				input: 'Create a React component',
				output: 'Here\'s a React component...',
				description: 'Basic component generation',
			},
		],
		description: 'Generate clean, well-documented code',
		tags: ['code', 'generation', 'typescript'],
		created: Date.now(),
		modified: Date.now(),
		usageCount: 0,
		favorite: true,
	},
	{
		id: 'default-debug',
		name: 'Debug Error',
		category: 'debug',
		template: 'Debug this error:\n\n```\n{{error}}\n```\n\nContext:\n{{context}}',
		variables: [
			{name: 'error', description: 'Error message or stack trace', required: true},
			{name: 'context', description: 'Additional context', required: false},
		],
		examples: [
			{
				input: 'TypeError: Cannot read property...',
				output: 'The error occurs because...',
			},
		],
		description: 'Debug and fix errors',
		tags: ['debug', 'error', 'fix'],
		created: Date.now(),
		modified: Date.now(),
		usageCount: 0,
		favorite: true,
	},
	{
		id: 'default-refactor',
		name: 'Refactor Code',
		category: 'refactor',
		template: 'Refactor the following code:\n\n```{{language}}\n{{code}}\n```\n\nGoals:\n{{goals}}',
		variables: [
			{name: 'code', description: 'Code to refactor', required: true},
			{name: 'language', description: 'Programming language', required: true},
			{name: 'goals', description: 'Refactoring goals', required: false},
		],
		examples: [],
		description: 'Refactor code for better quality',
		tags: ['refactor', 'improve', 'clean'],
		created: Date.now(),
		modified: Date.now(),
		usageCount: 0,
		favorite: false,
	},
];

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get prompt templates file path in .floyd directory
 */
function getTemplatesPath(): string {
	const cwd = process.cwd();
	const floydDir = path.join(cwd, '.floyd');
	return path.join(floydDir, 'prompt-templates.json');
}

/**
 * Render template with variables
 */
function renderTemplateContent(
	template: string,
	variables: Record<string, string>,
): string {
	let rendered = template;
	for (const [key, value] of Object.entries(variables)) {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
		rendered = rendered.replace(regex, value);
	}
	return rendered;
}

/**
 * Create the prompt store
 */
export const usePromptStore = create<PromptStore>()(
	persist(
		(set, get) => ({
			templates: defaultTemplates,

			getTemplate: id => {
				return get().templates.find(t => t.id === id) || null;
			},

			getTemplatesByCategory: category => {
				return get().templates.filter(t => t.category === category);
			},

			searchTemplates: query => {
				const lowerQuery = query.toLowerCase();
				return get().templates.filter(
					t =>
						t.name.toLowerCase().includes(lowerQuery) ||
						t.description?.toLowerCase().includes(lowerQuery) ||
						t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)),
				);
			},

			addTemplate: template =>
				set(state => {
					const newTemplate: PromptTemplate = {
						...template,
						id: generateId(),
						created: Date.now(),
						modified: Date.now(),
						usageCount: 0,
					};
					return {
						templates: [...state.templates, newTemplate],
					};
				}),

			updateTemplate: (id, updates) =>
				set(state => ({
					templates: state.templates.map(t =>
						t.id === id ? {...t, ...updates, modified: Date.now()} : t,
					),
				})),

			removeTemplate: id =>
				set(state => ({
					templates: state.templates.filter(t => t.id !== id),
				})),

			renderTemplate: (id, variables) => {
				const template = get().getTemplate(id);
				if (!template) return '';
				return renderTemplateContent(template.template, variables);
			},

			incrementUsage: id =>
				set(state => ({
					templates: state.templates.map(t =>
						t.id === id ? {...t, usageCount: t.usageCount + 1} : t,
					),
				})),

			toggleFavorite: id =>
				set(state => ({
					templates: state.templates.map(t =>
						t.id === id ? {...t, favorite: !t.favorite} : t,
					),
				})),

			getFavorites: () => {
				return get().templates.filter(t => t.favorite);
			},

			loadFromFile: async filePath => {
				try {
					if (await fs.pathExists(filePath)) {
						const data = await fs.readJson(filePath);
						set({templates: data.templates || defaultTemplates});
					}
				} catch (error) {
					console.error('Failed to load prompt templates:', error);
				}
			},

			saveToFile: async filePath => {
				try {
					await fs.ensureDir(path.dirname(filePath));
					const state = get();
					await fs.writeJson(
						filePath,
						{templates: state.templates},
						{spaces: 2},
					);
				} catch (error) {
					console.error('Failed to save prompt templates:', error);
				}
			},
		}),
		{
			name: 'floyd-prompt-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					try {
						const filePath = getTemplatesPath();
						if (fs.existsSync(filePath)) {
							const data = fs.readFileSync(filePath, 'utf-8');
							return data;
						}
					} catch {
						// Fallback to memory
					}
					const data = globalThis.__floydPromptStoreMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					try {
						const filePath = getTemplatesPath();
						fs.ensureDirSync(path.dirname(filePath));
						fs.writeFileSync(filePath, value, 'utf-8');
					} catch {
						// Fallback to memory
					}
					if (!globalThis.__floydPromptStoreMemory) {
						globalThis.__floydPromptStoreMemory = {};
					}
					try {
						globalThis.__floydPromptStoreMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydPromptStoreMemory[name] = value;
					}
				},
				removeItem: name => {
					try {
						const filePath = getTemplatesPath();
						if (fs.existsSync(filePath)) {
							fs.removeSync(filePath);
						}
					} catch {
						// Ignore
					}
					if (globalThis.__floydPromptStoreMemory) {
						delete globalThis.__floydPromptStoreMemory[name];
					}
				},
			})),
			partialize: state => ({
				templates: state.templates,
			}),
		},
	),
);

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydPromptStoreMemory: Record<string, unknown> | undefined;
}
