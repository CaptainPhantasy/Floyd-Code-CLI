/**
 * PHASE 5 ITEM 24: Planning Mode Prompt
 *
 * Specialized prompt for generating structured plans.
 */

/**
 * Generate planning prompt for the given goal
 */
export function generatePlanPrompt(goal: string): string {
	return `You are a PLANNING EXPERT. Your task is to create a detailed, step-by-step plan for achieving the following goal:

**Goal:** ${goal}

**Your plan should:**

1. **Break down the goal into clear, actionable steps**
   - Each step should have a specific, measurable outcome
   - Order steps logically with dependencies
   - Include verification steps

2. **Identify potential risks**
   - Data loss risks
   - Breaking changes
   - Test failures
   - Dependency issues

3. **Estimate time and complexity**
   - Provide realistic time estimates
   - Flag complex steps that may need extra attention

4. **Define success criteria**
   - How will we know the goal is achieved?
   - What tests should pass?

**Output Format:**

Respond with a structured plan in this format:

\`\`\`
## Plan: [brief title]

**Estimated Time:** [time estimate]

**Steps:**
1. [Step description]
   - Dependencies: [none or step numbers]
   - Tools: [tools needed]
   - Files: [files to modify]
   - Verification: [how to verify this step]

2. [Step description]
   ...

**Risks:**
- [Risk 1]
- [Risk 2]

**Success Criteria:**
- [Criteria 1]
- [Criteria 2]

**Prerequisites:**
- [Prerequisite 1]
\`\`\`

**Important Planning Guidelines:**

- Start with understanding/analysis before making changes
- Include backup steps for destructive operations
- Consider test impact for code changes
- Think about edge cases and error handling
- Group related changes together where possible

Generate the plan now:`;
}

/**
 * Generate prompt for executing a specific plan step
 */
export function generateStepExecutionPrompt(step: {
	id: string;
	description: string;
	tools: string[];
	files: string[];
}): string {
	return `You are executing step ${step.id} of a larger plan.

**Step:** ${step.description}

**Available tools:** ${step.tools.join(', ')}

**Files involved:** ${step.files.length > 0 ? step.files.join(', ') : 'None specified'}

**Your task:**
1. Execute this step carefully using the available tools
2. Verify the step completed successfully before proceeding
3. Report any issues or unexpected results

Focus ONLY on this step. Don't try to complete the entire plan at once.`;
}

/**
 * Generate plan review prompt
 */
export function generatePlanReviewPrompt(plan: {
	goal: string;
	steps: Array<{ description: string; tools: string[] }>;
	risks: string[];
}): string {
	return `Review the following plan for completeness and safety:

**Goal:** ${plan.goal}

**Steps (${plan.steps.length}):**
${plan.steps.map((s, i) => `${i + 1}. ${s.description} (tools: ${s.tools.join(', ')})`).join('\n')}

**Risks:**
${plan.risks.map(r => `- ${r}`).join('\n')}

**Review the plan for:**
1. **Completeness:** Are any steps missing?
2. **Safety:** Are risks properly addressed?
3. **Efficiency:** Can steps be combined or reordered?
4. **Clarity:** Is each step unambiguous?

Provide your review as a structured list of suggestions.`;
}

/**
 * Generate plan modification prompt
 */
export function generatePlanModificationPrompt(
	currentPlan: string,
	userFeedback: string
): string {
	return `The user has requested modifications to the current plan.

**Current Plan:**
${currentPlan}

**User Feedback:**
${userFeedback}

**Generate an updated plan incorporating the user's feedback.**

Maintain the same structured format, but adjust the plan based on the suggestions.`;
}
