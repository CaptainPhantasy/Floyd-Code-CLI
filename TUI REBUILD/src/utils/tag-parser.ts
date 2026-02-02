/**
 * Thinking Tag Parser for TUI
 * 
 * Extracts <thinking> tags from the stream and handles state transitions.
 */

export interface StreamEvent {
  type: 'text' | 'tag_open' | 'tag_close';
  tagName?: string;
  content?: string;
}

export class TuiTagParser {
  private tags: string[];
  private buffer: string = '';
  private activeTags: Set<string> = new Set();

  constructor(tags: string[] = ['thinking']) {
    this.tags = tags;
  }

  /**
   * Process a chunk of text and yield events
   */
  *process(chunk: string): IterableIterator<StreamEvent> {
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      const openMatch = this.buffer.match(/<([a-zA-Z0-9]+)>/);
      const closeMatch = this.buffer.match(/<\/([a-zA-Z0-9]+)>/);

      // Find the earliest match
      const openIdx = openMatch?.index ?? Infinity;
      const closeIdx = closeMatch?.index ?? Infinity;

      if (openIdx === Infinity && closeIdx === Infinity) {
        // No tags found, yield remaining text if it's safe (not a partial tag)
        const partialTagStart = this.buffer.lastIndexOf('<');
        if (partialTagStart !== -1 && partialTagStart > this.buffer.length - 10) {
          // Might be a partial tag at the end, yield up to it
          const text = this.buffer.substring(0, partialTagStart);
          if (text) yield { type: 'text', content: text };
          this.buffer = this.buffer.substring(partialTagStart);
          break;
        } else {
          yield { type: 'text', content: this.buffer };
          this.buffer = '';
          break;
        }
      }

      if (openIdx < closeIdx) {
        // Tag open
        const tagName = openMatch![1];
        if (openIdx > 0) {
          yield { type: 'text', content: this.buffer.substring(0, openIdx) };
        }
        
        if (this.tags.includes(tagName)) {
          this.activeTags.add(tagName);
          yield { type: 'tag_open', tagName };
        } else {
          // Unknown tag, treat as text
          yield { type: 'text', content: `<${tagName}>` };
        }
        
        this.buffer = this.buffer.substring(openIdx + tagName.length + 2);
      } else {
        // Tag close
        const tagName = closeMatch![1];
        if (closeIdx > 0) {
          yield { type: 'text', content: this.buffer.substring(0, closeIdx) };
        }
        
        if (this.tags.includes(tagName)) {
          this.activeTags.delete(tagName);
          yield { type: 'tag_close', tagName };
        } else {
          // Unknown tag, treat as text
          yield { type: 'text', content: `</${tagName}>` };
        }
        
        this.buffer = this.buffer.substring(closeIdx + tagName.length + 3);
      }
    }
  }

  /**
   * Reset the parser state
   */
  reset(): void {
    this.buffer = '';
    this.activeTags.clear();
  }

  /**
   * Check if any tag is currently active
   */
  isInTag(tagName: string): boolean {
    return this.activeTags.has(tagName);
  }
}
