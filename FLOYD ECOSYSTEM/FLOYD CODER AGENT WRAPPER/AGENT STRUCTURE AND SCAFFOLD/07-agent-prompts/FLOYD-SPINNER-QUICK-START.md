# Floyd Spinners - Quick Start Guide

**Using Pink Floyd themed spinners in Floyd CLI**

---

## Installation

```bash
cd INK/floyd-cli
npm install cli-spinners ora
```

---

## Basic Usage

### 1. Import and Use

```typescript
import {getRandomFloydSpinner, floydThinkingMessages} from '../utils/floyd-spinners.js';

// Get random message + spinner combo
const {message, spinner} = getRandomFloydSpinner();

console.log(`${spinner.frames[0]} ${message}`);
```

### 2. In Ink Component (React for CLI)

```typescript
import {useEffect, useState} from 'react';
import {Text} from 'ink';
import {getRandomFloydSpinner} from '../utils/floyd-spinners.js';

export const FloydThinkingIndicator: React.FC<{isThinking: boolean}> = ({isThinking}) => {
  const [frame, setFrame] = useState(0);
  const [combo] = useState(() => getRandomFloydSpinner());

  useEffect(() => {
    if (!isThinking) return;

    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % combo.spinner.frames.length);
    }, combo.spinner.interval);

    return () => clearInterval(interval);
  }, [isThinking, combo.spinner]);

  if (!isThinking) return null;

  return (
    <Text dimColor>
      {combo.spinner.frames[frame]} {combo.message}
    </Text>
  );
};
```

### 3. With Ora (Recommended)

```typescript
import ora from 'ora';
import {getRandomFloydSpinner} from '../utils/floyd-spinners.js';

const {message, spinner} = getRandomFloydSpinner();

const loader = ora({
  text: message,
  spinner: spinner,
  color: 'cyan',
});

// Start spinner during model generation
loader.start();

// When complete
await model.generateResponse();
loader.succeed('Response ready!');
```

---

## Spinner Selection

### Automatic (Message-Based)

```typescript
import {getSpinnerForMessage} from '../utils/floyd-spinners.js';

const message = '🌙 Painting brilliant colors on the dark side of the moon...';
const spinner = getSpinnerForMessage(message); // Returns 'moon' spinner
```

### Manual Selection

```typescript
import {cliSpinners, customFloydSpinners} from '../utils/floyd-spinners.js';

// Built-in spinner
const moonSpinner = cliSpinners.moon;

// Custom Floyd spinner
const prismSpinner = customFloydSpinners.floydPrism;
```

---

## All Custom Floyd Spinners

| Name | Theme | Preview |
|------|-------|---------|
| `floydMoon` | Moon phases | 🌑🌒🌓🌔🌕🌖🌗🌘 |
| `floydPrism` | DSOTM prism | △◹◺◸◿🌈 |
| `floydWall` | Wall building | ▓▓▓▓ |
| `floydPig` | Flying pig | 🐷🐷🐷 |
| `floydAtom` | Atom heart | ◉◈◇ |
| `floydBike` | Bike wheel | ╼─╼─ |
| `floydSaucer` | UFO | 🛸✨ |
| `floydRainbow` | Rainbow | ░▓██▓ |
| `floydHammer` | Hammer | 🔨 |
| `floydDiamond` | Diamond sparkle | 💎✨ |
| `floydFlower` | Flower power | ✿ |
| `floydSun` | Sun rise/set | 🌅🌞 |
| `floydWave` | Ocean waves | 〜〜〜 |
| `floydClouds` | Clouds parting | ☁️🌤️ |
| `floydLight` | Light on | 💡✨ |
| `floydRocket` | Rocket launch | 🚀💫 |
| `floydEye` | Eye blinking | 👁️ |
| `floydFire` | Flames | 🔥 |

---

## All Built-in Spinners Available

From `cli-spinners` package:

| Category | Spinners |
|----------|----------|
| **Dots** | `dots`, `dots2`, `dots3`, `dots4`, `dots5`, `dots6`, `dots7`, `dots8`, `dots9`, `dots10`, `dots11`, `dots12`, `dots13`, `dots14`, `dots8Bit`, `dotsCircle`, `sand` |
| **Lines** | `line`, `line2`, `rollingLine`, `pipe` |
| **Simple** | `simpleDots`, `simpleDotsScrolling` |
| **Stars** | `star`, `star2` |
| **Shapes** | `flip`, `hamburger`, `triangle`, `arc`, `circle`, `squareCorners`, `circleQuarters`, `circleHalves` |
| **Bars** | `growVertical`, `growHorizontal`, `bouncingBar`, `material` |
| **Bounce** | `balloon`, `balloon2`, `bounce`, `boxBounce`, `boxBounce2`, `bouncingBall` |
| **Toggle** | `toggle`, `toggle2`, `toggle3`, `toggle4`, `toggle5`, `toggle6`, `toggle7`, `toggle8`, `toggle9`, `toggle10`, `toggle11`, `toggle12`, `toggle13` |
| **Arrows** | `arrow`, `arrow2`, `arrow3` |
| **Emoji** | `smiley`, `monkey`, `hearts`, `clock`, `earth`, `runner`, `weather`, `christmas` |
| **Effects** | `noise`, `binary`, `squish`, `pong`, `shark`, `dqpb`, `grenade`, `point`, `layer`, `betaWave`, `fingerDance`, `fistBump`, `soccerHeader`, `mindblown`, `speaker`, `orangePulse`, `bluePulse`, `orangeBluePulse`, `timeTravel`, `aesthetic`, `dwarfFortress` |

---

## Complete Mapping Example

```typescript
import {floydThinkingMessages, floydSpinnerMapping, cliSpinners, customFloydSpinners} from '../utils/floyd-spinners.js';

// Show all message → spinner mappings
floydThinkingMessages.forEach(message => {
  const spinnerKey = floydSpinnerMapping[message];
  const spinner = spinnerKey in cliSpinners
    ? cliSpinners[spinnerKey as keyof typeof cliSpinners]
    : customFloydSpinners[spinnerKey as keyof typeof customFloydSpinners];

  console.log(`Message: ${message}`);
  console.log(`Spinner: ${spinnerKey}`);
  console.log(`Frames:`, spinner.frames);
  console.log(`Interval: ${spinner.interval}ms`);
  console.log('---');
});
```

---

## Integration Points

### 1. In `floyd-store.ts`

```typescript
import {getRandomFloydSpinner} from '../utils/floyd-spinners.js';

interface FloydStore {
  // Add spinner state
  spinner: {
    message: string;
    frame: number;
    isSpinning: boolean;
    frames: string[];
    interval: number;
  };
  startSpinner: () => void;
  stopSpinner: () => void;
}

export const useFloydStore = create<FloydStore>((set, get) => ({
  // ... existing store

  spinner: {
    message: '',
    frame: 0,
    isSpinning: false,
    frames: [],
    interval: 80,
  },

  startSpinner: () => {
    const combo = getRandomFloydSpinner();
    set({
      spinner: {
        message: combo.message,
        frame: 0,
        isSpinning: true,
        frames: combo.spinner.frames,
        interval: combo.spinner.interval,
      },
    });

    // Start frame animation
    const interval = setInterval(() => {
      set(state => ({
        spinner: {
          ...state.spinner,
          frame: (state.spinner.frame + 1) % state.spinner.frames.length,
        },
      }));
    }, combo.spinner.interval);

    // Store interval ID for cleanup
    set({spinnerIntervalId: interval});
  },

  stopSpinner: () => {
    const {spinnerIntervalId} = get();
    if (spinnerIntervalId) {
      clearInterval(spinnerIntervalId);
    }
    set({
      spinner: {
        ...get().spinner,
        isSpinning: false,
      },
      spinnerIntervalId: undefined,
    });
  },
}));
```

### 2. In `SessionPanel.tsx` (UI Component)

```typescript
import {Text} from 'ink';
import {useFloydStore} from '../store/floyd-store.js';

export const SessionPanel: React.FC = () => {
  const {spinner} = useFloydStore();

  return (
    <Box flexDirection="column">
      {/* ... existing session UI */}

      {/* Thinking indicator */}
      {spinner.isSpinning && (
        <Text dimColor>
          {spinner.frames[spinner.frame]} {spinner.message}
        </Text>
      )}
    </Box>
  );
};
```

### 3. In `app.tsx` (Main Application)

```typescript
// When model starts generating
const startGeneration = async () => {
  useFloydStore.getState().startSpinner();

  try {
    await agentEngine.generateResponse();
  } finally {
    useFloydStore.getState().stopSpinner();
  }
};
```

---

## Testing

```bash
# Test spinner animations
cd INK/floyd-cli
npm run dev

# Or test directly with Node
node -e "
import {getRandomFloydSpinner} from './dist/utils/floyd-spinners.js';
const {message, spinner} = getRandomFloydSpinner();
console.log(message);
console.log(spinner.frames.join(' '));
"
```

---

## Customization

### Add Custom Message

```typescript
// In floyd-spinners.ts
export const floydThinkingMessages = [
  // ... existing messages
  '🎵 Your custom message here...',
];

// Add spinner mapping
export const floydSpinnerMapping = {
  // ... existing mappings
  '🎵 Your custom message here...': 'dots', // or any spinner name
};
```

### Add Custom Spinner

```typescript
// In floyd-spinners.ts
export const customFloydSpinners = {
  // ... existing spinners

  // Your custom spinner
  myCustomSpinner: {
    interval: 100,
    frames: ['░', '▒', '▓', '█', '▓', '▒', '░'],
  },
};
```

---

## Performance Tips

1. **Use faster intervals for quick operations** (50-80ms)
2. **Use slower intervals for longer operations** (120-200ms)
3. **Emoji spinners** are wider, adjust text layout accordingly
4. **Test in terminal** - some terminals render emoji differently

---

## Troubleshooting

**Q: Spinner not animating?**
A: Check that interval is set correctly and cleanup is proper.

**Q: Emoji displaying as squares?**
A: Terminal doesn't support emoji. Use ASCII fallback spinners (`dots`, `line`, etc.).

**Q: Spinner too fast/slow?**
A: Adjust `interval` in spinner config (lower = faster).

**Q: Frame order wrong?**
A: Check `frames` array order and ensure modulo arithmetic is correct.

---

## Sources

- **cli-spinners package**: https://github.com/sindresorhus/cli-spinners
- **ora package**: https://github.com/sindresorhus/ora
- **Custom Floyd spinners**: Hand-crafted for Floyd CLI

**Theme**: Pink Floyd discography (1967-2014)
**Total combinations**: 80+ messages × 100+ spinners = 8,000+ possibilities
