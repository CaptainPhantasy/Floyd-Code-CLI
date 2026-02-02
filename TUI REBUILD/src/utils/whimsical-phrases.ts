/**
 * Whimsical thinking phrases for Floyd
 *
 * These phrases appear when Floyd is "thinking" to add personality
 * and charm to the TUI experience.
 */

export const WHIMSICAL_PHRASES = [
  // Computing/Processing
  'Computing the answer to life, the universe, and everything...',
  'Crunching numbers and contemplating existence...',
  'Consulting the oracle of bits...',
  'Parsing the fabric of reality...',
  'Compiling my thoughts...',
  'Running mental heuristics...',

  // Pondering/Thinking
  'Pondering the ineffable...',
  'Meditating on your query...',
  'Engaging neural pathways...',
  'Synthesizing a response...',
  'Marshaling my cognitive resources...',
  'Ruminating on the possibilities...',

  // Floyd-specific
  'Floyd is thinking...',
  'Floyd ponders...',
  'Consulting the Floyd knowledge base...',
  'Tapping into the Floyd hive mind...',

  // Tech/Code themed
  'Traversing the abstract syntax tree of knowledge...',
  'Garbage collecting irrelevant thoughts...',
  'Optimizing my response algorithm...',
  'Running semantic analysis...',
  'Loading relevant context into working memory...',

  // Philosophical
  'Contemplating the nature of your request...',
  'Seeking wisdom in the codebase...',
  'Bridging the gap between question and answer...',
  'Weaving threads of understanding...',

  // Short & punchy
  'Thinking...',
  'Processing...',
  'Computing...',
  'Analyzing...',
  'Synthesizing...',

  // Playful
  'Doing some Floyd magic...',
  'Applying cognitive lubricant...',
  'Warming up the logic circuits...',
  'Tuning into your frequency...',
] as const;

/**
 * Get a random whimsical phrase
 */
export function getRandomPhrase(): string {
  const idx = Math.floor(Math.random() * WHIMSICAL_PHRASES.length);
  return WHIMSICAL_PHRASES[idx];
}

/**
 * Get a random whimsical phrase, optionally avoiding repeats
 */
export function getRandomPhraseUnique(lastPhrase?: string): string {
  let phrase = getRandomPhrase();
  let attempts = 0;
  const maxAttempts = 10;

  while (lastPhrase && phrase === lastPhrase && attempts < maxAttempts) {
    phrase = getRandomPhrase();
    attempts++;
  }

  return phrase;
}

/**
 * Get a phrase by category (loose grouping based on content)
 */
export function getPhraseByCategory(category: 'computing' | 'pondering' | 'short' | 'playful'): string {
  const categories: Record<string, readonly string[]> = {
    computing: [
      'Computing the answer to life, the universe, and everything...',
      'Crunching numbers and contemplating existence...',
      'Consulting the oracle of bits...',
      'Parsing the fabric of reality...',
      'Compiling my thoughts...',
    ],
    pondering: [
      'Pondering the ineffable...',
      'Meditating on your query...',
      'Engaging neural pathways...',
      'Synthesizing a response...',
      'Marshaling my cognitive resources...',
    ],
    short: [
      'Thinking...',
      'Processing...',
      'Computing...',
      'Analyzing...',
      'Synthesizing...',
    ],
    playful: [
      'Doing some Floyd magic...',
      'Applying cognitive lubricant...',
      'Warming up the logic circuits...',
      'Tuning into your frequency...',
    ],
  };

  const phrases = categories[category] || categories.pondering;
  const idx = Math.floor(Math.random() * phrases.length);
  return phrases[idx];
}
