/**
 * Prompt Library
 *
 * Configuration page for prompt template management.
 * Browse, create, edit, and preview prompt templates.
 *
 * @module config/PromptLibrary
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import {SimpleTable} from '../ui/components/SimpleTable.js';
import {ConfirmInput} from '../ui/components/ConfirmInput.js';
import SyntaxHighlight from 'ink-syntax-highlight';
import Markdown from 'ink-markdown';
import {Tabs, Tab} from 'ink-tab';
import {usePromptStore} from '../store/prompt-store.js';
import {floydTheme, roleColors} from '../theme/crush-theme.js';
import type {PromptCategory, PromptTemplate} from '../store/prompt-store.js';

// ============================================================================
// COMPONENT
// ============================================================================

const CATEGORIES: Array<{label: string; value: PromptCategory}> = [
	{label: 'Coding', value: 'coding'},
	{label: 'Debug', value: 'debug'},
	{label: 'Refactor', value: 'refactor'},
	{label: 'Explain', value: 'explain'},
	{label: 'Review', value: 'review'},
	{label: 'Custom', value: 'custom'},
];

/**
 * PromptLibrary - Prompt template management interface
 */
export function PromptLibrary() {
	const {isFocused} = useFocus({autoFocus: true});
	const {
		templates,
		getTemplatesByCategory,
		searchTemplates,
		addTemplate,
		updateTemplate,
		removeTemplate,
		getFavorites,
		saveToFile,
	} = usePromptStore();

	const [activeCategory, setActiveCategory] = useState<PromptCategory>('coding');
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	// Form state
	const [formName, setFormName] = useState('');
	const [formCategory, setFormCategory] = useState<PromptCategory>('coding');
	const [formTemplate, setFormTemplate] = useState('');
	const [formDescription, setFormDescription] = useState('');

	const {loadFromFile} = usePromptStore();

	// Load templates on mount
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/prompt-templates.json`;
		void loadFromFile(filePath);
	}, [loadFromFile]);

	// Save on changes
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/prompt-templates.json`;
		void saveToFile(filePath);
	}, [templates, saveToFile]);

	// Handle input
	useInput((input, key) => {
		if (!isFocused) return;

		if (key.escape) {
			setShowAddForm(false);
			setEditingId(null);
			setPreviewId(null);
			setShowDeleteConfirm(false);
			setSearchQuery('');
			return;
		}

		// Add template shortcut
		if (input === 'a' && !showAddForm && !showDeleteConfirm) {
			setShowAddForm(true);
			return;
		}

		// Clear search
		if (input === 'c' && !showAddForm && !showDeleteConfirm) {
			setSearchQuery('');
			return;
		}

		// Show favorites
		if (input === 'f' && !showAddForm && !showDeleteConfirm) {
			const favorites = getFavorites();
			if (favorites.length > 0) {
				setPreviewId(favorites[0].id);
			}
			return;
		}
	});

	const handleAddTemplate = () => {
		if (formName.trim() && formTemplate.trim()) {
			addTemplate({
				name: formName.trim(),
				category: formCategory,
				template: formTemplate.trim(),
				variables: [],
				examples: [],
				description: formDescription.trim() || undefined,
				tags: [],
				favorite: false,
			});
			// Reset form
			setFormName('');
			setFormCategory('coding');
			setFormTemplate('');
			setFormDescription('');
			setShowAddForm(false);
		}
	};

	const handleDelete = (id: string) => {
		setDeleteTargetId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = () => {
		if (deleteTargetId) {
			removeTemplate(deleteTargetId);
			setDeleteTargetId(null);
		}
		setShowDeleteConfirm(false);
	};

	// Get displayed templates
	const displayedTemplates = searchQuery
		? searchTemplates(searchQuery)
		: getTemplatesByCategory(activeCategory);

	// Prepare table data
	const templateTableData = displayedTemplates.map(t => [
		t.favorite ? '★' : ' ',
		t.name,
		t.category,
		t.usageCount.toString(),
		t.examples.length.toString(),
	]);

	const previewTemplate = previewId
		? templates.find(t => t.id === previewId)
		: null;

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Search */}
			<Box
				flexDirection="row"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
				marginBottom={1}
				gap={1}
			>
				<Text color={roleColors.inputPrompt}>Search:</Text>
				<TextInput
					value={searchQuery}
					onChange={setSearchQuery}
					placeholder="Search templates..."
				/>
			</Box>

			{/* Category Tabs */}
			<Box flexDirection="row" marginBottom={1}>
				<Tabs
					onChange={name => setActiveCategory(name as PromptCategory)}
					flexDirection="row"
				>
					{CATEGORIES.map(cat => (
						<Tab key={cat.value} name={cat.value}>
							{cat.label}
						</Tab>
					))}
				</Tabs>
			</Box>

			{/* Templates List */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
				marginBottom={1}
				flexGrow={1}
			>
				<Text bold color={roleColors.headerTitle}>
					Prompt Templates ({displayedTemplates.length})
				</Text>

				{displayedTemplates.length > 0 ? (
					<Box marginTop={1}>
						<SimpleTable
							data={templateTableData}
							columns={['★', 'Name', 'Category', 'Uses', 'Examples']}
						/>
					</Box>
				) : (
					<Box marginTop={1}>
						<Text color={roleColors.hint} dimColor>
							No templates found. Press 'a' to add one.
						</Text>
					</Box>
				)}
			</Box>

			{/* Preview */}
			{previewTemplate && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
					marginBottom={1}
				>
					<Text bold color={roleColors.headerTitle}>
						Preview: {previewTemplate.name}
					</Text>
					{previewTemplate.description && (
						<Text color={roleColors.hint} dimColor>
							{previewTemplate.description}
						</Text>
					)}
					<Box marginTop={1} borderStyle="single" paddingX={1}>
						<SyntaxHighlight
							code={previewTemplate.template}
							language="markdown"
						/>
					</Box>
				</Box>
			)}

			{/* Add Template Form */}
			{showAddForm && (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
					marginBottom={1}
					gap={1}
				>
					<Text bold color={roleColors.headerTitle}>
						Add New Prompt Template
					</Text>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Name:</Text>
						<TextInput
							value={formName}
							onChange={setFormName}
							placeholder="Template name"
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Category:</Text>
						<SelectInput
							items={CATEGORIES}
							onSelect={item => setFormCategory(item.value)}
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Description:</Text>
						<TextInput
							value={formDescription}
							onChange={setFormDescription}
							placeholder="Optional description"
						/>
					</Box>

					<Box flexDirection="column" gap={1}>
						<Text color={roleColors.inputPrompt}>Template:</Text>
						<TextInput
							value={formTemplate}
							onChange={setFormTemplate}
							placeholder="Template content (use {{variable}} for variables)"
						/>
					</Box>

					<Text color={roleColors.hint} dimColor>
						Press Enter to save, Esc to cancel
					</Text>
				</Box>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<Box marginTop={1}>
					<ConfirmInput
						message="Delete this prompt template?"
						onConfirm={confirmDelete}
						onCancel={() => {
							setShowDeleteConfirm(false);
							setDeleteTargetId(null);
						}}
					/>
				</Box>
			)}

			{/* Help Text */}
			{!showAddForm && !showDeleteConfirm && (
				<Box marginTop={1} flexDirection="column" gap={0}>
					<Text color={roleColors.hint} dimColor>
						Press 'a' to add • 'f' to view favorites • 'c' to clear search • Esc to cancel
					</Text>
				</Box>
			)}
		</Box>
	);
}
