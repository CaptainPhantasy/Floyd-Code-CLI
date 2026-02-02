#!/usr/bin/env node
import meow from 'meow';
import { runDesign } from './commands/design.js';
import fs from 'fs-extra';
import { emitTheme } from './generator/emitTheme.js';

const cli = meow(`
	Usage
	  $ ink-cli-designer <command> [options]

	Commands
	  design       Launch interactive designer
	  init         Create scaffold files (theme, ui components)

	Options
	  --image, -i  Path to reference image
	  --cols, -c   Terminal columns (default: 80)
	  --rows, -r   Terminal rows (default: 24)
	  --out, -o    Output spec file (default: design-spec.json)

	Examples
	  $ ink-cli-designer design --cols 100 --rows 30
`, {
	importMeta: import.meta,
	flags: {
		image: { type: 'string', shortFlag: 'i' },
		cols: { type: 'number', shortFlag: 'c' },
		rows: { type: 'number', shortFlag: 'r' },
        out: { type: 'string', shortFlag: 'o' }
	}
});

async function main() {
    const command = cli.input[0];

    if (command === 'design') {
        await runDesign({
            image: cli.flags.image,
            cols: cli.flags.cols,
            rows: cli.flags.rows,
            out: cli.flags.out
        });
    } else if (command === 'init') {
        console.log("Initializing project components...");
        fs.ensureDirSync('generated/ui');
        // We write the Frame component and theme to the current dir for usage
        fs.writeFileSync('generated/theme.ts', emitTheme());
        fs.writeFileSync('generated/ui/Frame.tsx', `// Copy content from src/ui/Frame.tsx manually or via design save
import React from 'react';
import { Box, Text } from 'ink';
export const Frame = ({ title, width, height, border, color, children }: any) => (
  <Box borderStyle={border ? 'round' : undefined} borderColor={color} width={width} height={height} flexDirection="column" paddingX={1}>
    {title && <Box marginTop={-1}><Text bold color={color}> {title} </Text></Box>}
    {children}
  </Box>
);`);
        console.log("Done. Created generated/ folder.");
    } else {
        cli.showHelp();
    }
}

main();
