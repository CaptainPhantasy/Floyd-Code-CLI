/**
 * 🔒 LOCKED FILE - CORE STABILITY
 * This file has been audited and stabilized by Gemini 4.
 * Please do not modify without explicit instruction and regression testing.
 * Ref: geminireport.md
 */

/**
 * Stream Tag Parser
 *
 * Robustly parses XML-style tags in streaming text.
 * Handles split tokens (e.g., "<think" + "ing>") and nested tags.
 */

export interface TagEvent {
	type: 'tag_open' | 'tag_close' | 'text';
	tagName?: string;
	content?: string;
}

export class StreamTagParser {
	private buffer = '';
	private currentTag: string | null = null;
	private tags: string[];

	constructor(tags: string[] = ['thinking']) {
		this.tags = tags;
	}

	/**
	 * Process a chunk of text and yield events
	 */
	*process(chunk: string): Generator<TagEvent> {
		this.buffer += chunk;

		while (this.buffer.length > 0) {
			// If we are inside a tag, look for the closing tag
			if (this.currentTag) {
				const closeTag = `</${this.currentTag}>`;
				const closeIndex = this.buffer.indexOf(closeTag);

				if (closeIndex !== -1) {
					// Found closing tag
					// Yield content before the closing tag
					const content = this.buffer.substring(0, closeIndex);
					if (content) {
						yield { type: 'text', content };
					}
					
					// Yield closing event
					yield { type: 'tag_close', tagName: this.currentTag };
					
					// Advance buffer past the closing tag
					this.buffer = this.buffer.substring(closeIndex + closeTag.length);
					this.currentTag = null;
				} else {
					// Closing tag not found yet
					// Check if the buffer *ends* with a partial closing tag
					// e.g. "some content </thin"
					const partialMatch = this.findPartialTagMatch(this.buffer, `</${this.currentTag}>`);
					
					if (partialMatch) {
						// Yield safe content up to the partial match
						const safeContent = this.buffer.substring(0, this.buffer.length - partialMatch.length);
						if (safeContent) {
							yield { type: 'text', content: safeContent };
						}
						// Keep the partial match in the buffer
						this.buffer = partialMatch;
						return;
					} else {
						// No partial match, safe to yield everything
						yield { type: 'text', content: this.buffer };
						this.buffer = '';
						return;
					}
				}
			} else {
				// We are NOT in a tag, look for an opening tag
				let firstOpenIndex = -1;
				let foundTag = '';

				for (const tag of this.tags) {
					const openTag = `<${tag}>`;
					const index = this.buffer.indexOf(openTag);
					if (index !== -1 && (firstOpenIndex === -1 || index < firstOpenIndex)) {
						firstOpenIndex = index;
						foundTag = tag;
					}
				}

				if (firstOpenIndex !== -1) {
					// Found opening tag
					// Yield content before the tag
					const content = this.buffer.substring(0, firstOpenIndex);
					if (content) {
						yield { type: 'text', content };
					}

					// Yield opening event
					yield { type: 'tag_open', tagName: foundTag };
					this.currentTag = foundTag;

					// Advance buffer past the opening tag
					this.buffer = this.buffer.substring(firstOpenIndex + foundTag.length + 2); // < + tag + >
				} else {
					// No opening tag found
					// Check for partial opening tag at the end
					// e.g. "content <think"
					let longestPartialMatch = '';
					
					for (const tag of this.tags) {
						const openTag = `<${tag}>`;
						const partialMatch = this.findPartialTagMatch(this.buffer, openTag);
						if (partialMatch.length > longestPartialMatch.length) {
							longestPartialMatch = partialMatch;
						}
					}

					if (longestPartialMatch) {
						// Yield safe content up to the partial match
						const safeContent = this.buffer.substring(0, this.buffer.length - longestPartialMatch.length);
						if (safeContent) {
							yield { type: 'text', content: safeContent };
						}
						// Keep the partial match in the buffer
						this.buffer = longestPartialMatch;
						return;
					} else {
						// No partial match, safe to yield everything
						yield { type: 'text', content: this.buffer };
						this.buffer = '';
						return;
					}
				}
			}
		}
	}

	private findPartialTagMatch(text: string, tag: string): string {
		// Check if text ends with a prefix of tag
		for (let i = tag.length - 1; i > 0; i--) {
			const prefix = tag.substring(0, i);
			if (text.endsWith(prefix)) {
				return prefix;
			}
		}
		// Also check if text ends with "<" which is the start of any tag
		if (text.endsWith('<')) {
			return '<';
		}
		return '';
	}
}
