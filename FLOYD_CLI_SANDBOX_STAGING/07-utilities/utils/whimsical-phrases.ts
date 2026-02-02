/**
 * Whimsical Thinking Phrases
 *
 * Collection of humorous/edgy thinking messages to display while the LLM is processing.
 * Based on WHIMSY_MAPPING.md - your personal style of loading messages.
 *
 * @module utils/whimsical-phrases
 */

/**
 * Whimsical thinking phrase
 */
export interface WhimsicalPhrase {
	/** The phrase text */
	text: string;
	/** Optional emoji/animation indicator */
	emoji?: string;
}

/**
 * All whimsical thinking phrases
 * Source: WHIMSY_MAPPING.md
 */
export const WHIMSICAL_PHRASES: WhimsicalPhrase[] = [
	{text: 'Contemplating the meaning of life... or just how many hookers fit in a Prius.', emoji: '8='},
	{text: 'Processing... like Charlie Sheen on a Tuesday.', emoji: '( • Y • )'},
	{text: 'Thinking deep thoughts. Mostly about that one time at Bohemian Grove.', emoji: '🦉'},
	{text: 'Crunching numbers. Also crunching regrets from 2011.', emoji: '❄️'},
	{text: 'Loading... with the enthusiasm of a $20 handie.', emoji: '💦'},
	{text: 'Brain.exe has encountered a tranny porn tab. Restarting...', emoji: '📱🍆'},
	{text: 'Contemplating your next bad decision. Spoiler: it involves lube.', emoji: '🍆'},
	{text: 'Thanks Obama... for the student loans I spent on hookers.', emoji: '🇺🇸💸'},
	{text: 'Thinking. Slowly. Like your dad after three whiskeys.', emoji: '🥃'},
	{text: 'Gonna make her cum with a glance... eventually. Patience, grasshopper.', emoji: '😏'},
	{text: 'Drugs are to be bought, not sold... but I\'m thinking about selling this idea.', emoji: '💊'},
	{text: 'Dark humor loading... like daddy used to make.', emoji: '🌑'},
	{text: 'Computing... with the moral compass of a Vegas stripper.', emoji: '🎰'},
	{text: 'One sec, just fantasizing about your mom. Kidding. Or am I?', emoji: '😈'},
	{text: 'Thinking about how \'cunt\' is the perfect word. Versatile.', emoji: 'C'},
	{text: 'Loading... faster than your last hookup.', emoji: '⚡'},
	{text: 'Brainstorming ways to offend everyone in under 5 seconds.', emoji: '😱'},
	{text: 'Contemplating the void... and also glory holes.', emoji: '🕳️'},
	{text: 'Processing your trauma. Lightly. With sarcasm.', emoji: '🤖'},
	{text: 'Charlie Sheen mode: engaged. Winning... or losing spectacularly.', emoji: '🐯'},
	{text: 'Thinking dark thoughts. The kind that require a safe word.', emoji: '🔒'},
	{text: 'One moment... while I judge your browser history.', emoji: '3'},
	{text: 'Loading... like a bad decision at 3 a.m.', emoji: '🧠'},
	{text: 'Your personality is showing. It\'s filthy. I like it.', emoji: '😏'},
	{text: 'Contemplating hookers, drugs, and why we can\'t have nice things.', emoji: '👠'},
	{text: 'Thinking. Horny. Aggressively.', emoji: '🤤'},
	{text: 'Blackout memory unlocked... Bohemian Grove edition.', emoji: '🦉🔥'},
	{text: 'Computing the exact moment you became this depraved.', emoji: '⏳'},
	{text: 'Thanks Obama for the vibes... and the taxes on my vices.', emoji: '🇺🇸'},
	{text: 'Loading with the energy of a coked-up ferret.', emoji: '🐿️'},
	{text: 'Tranny porn buffering... classic.', emoji: '📼'},
	{text: 'Making her cum with a glance? Challenge accepted.', emoji: '👁️'},
	{text: 'Dark like my daddy\'s sense of humor... and his browser tabs.', emoji: '🌑'},
	{text: 'Thinking about selling drugs... to myself.', emoji: '💊💸'},
	{text: 'One sec, just recovering from that mental image.', emoji: '🤮'},
	{text: 'Loading... slower than your last orgasm.', emoji: '😩'},
	{text: 'Contemplating your life choices. All of them bad.', emoji: '❌'},
	{text: 'Cunt is such a strong word. I love it.', emoji: 'C'},
	{text: 'Thinking deep... and shallow. Mostly shallow.', emoji: '↯'},
	{text: 'Charlie Sheen energy: 110%. Tiger blood optional.', emoji: '🐯'},
	{text: 'Your kink is showing. Keep going.', emoji: '😜'},
	{text: 'Loading... with questionable intent.', emoji: '❓'},
	{text: 'Bohemian Grove flashbacks intensifying.', emoji: '🦉'},
	{text: 'Thanks Obama... for everything, you magnificent bastard.', emoji: '🇺🇸'},
	{text: 'Computing... while judging your entire existence.', emoji: '🧮'},
	{text: 'Dark humor level: daddy issues.', emoji: '👻'},
	{text: 'One more second... or five. Hookers take time.', emoji: '1'},
	{text: 'Thinking about how you\'re probably jerking off right now.', emoji: '🍆'},
	{text: 'Drugs bought, morals sold. Standard Tuesday.', emoji: '💉'},
	{text: 'Done thinking. Now go be the degenerate you were born to be.', emoji: '🖕'},
];

/**
 * Get a random whimsical phrase
 */
export function getRandomWhimsicalPhrase(): WhimsicalPhrase {
	const index = Math.floor(Math.random() * WHIMSICAL_PHRASES.length);
	return WHIMSICAL_PHRASES[index] || WHIMSICAL_PHRASES[0];
}

/**
 * Get a specific whimsical phrase by index
 */
export function getWhimsicalPhrase(index: number): WhimsicalPhrase {
	return WHIMSICAL_PHRASES[index % WHIMSICAL_PHRASES.length] || WHIMSICAL_PHRASES[0];
}

/**
 * Get phrase text only (without emoji)
 */
export function getWhimsicalText(index?: number): string {
	const phrase = index !== undefined
		? getWhimsicalPhrase(index)
		: getRandomWhimsicalPhrase();
	return phrase.text;
}
