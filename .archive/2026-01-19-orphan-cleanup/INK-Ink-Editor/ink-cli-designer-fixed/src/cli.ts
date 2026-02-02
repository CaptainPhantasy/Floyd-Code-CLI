#!/usr/bin/env node
import meow from 'meow';
import { runDesign } from './commands/design.js';
import { runInit } from './commands/init.js';
import { runGenerate } from './commands/generate.js';
import { runValidate } from './commands/validate.js';

const cli = meow(`
	Usage
	  $ ink-cli-designer <command> [options]

	Commands
	  design       Launch interactive designer
	  init         Write an empty spec + scaffold generated/ helpers
	  generate     Generate TSX + theme + helpers from a spec
	  validate     Validate a spec and print errors

	Options
	  --image, -i  Path to reference image
	  --cols, -c   Terminal columns (default: 80)
	  --rows, -r   Terminal rows (default: 24)
	  --out, -o    Output path (init: spec path, generate: output dir)
	  --spec       Spec path (generate/validate)

	Examples
	  $ ink-cli-designer design --cols 100 --rows 30
`, {
	importMeta: import.meta,
	flags: {
		image: { type: 'string', shortFlag: 'i' },
		cols: { type: 'number', shortFlag: 'c' },
		rows: { type: 'number', shortFlag: 'r' },
		out: { type: 'string', shortFlag: 'o' },
		spec: { type: 'string' }
	}
});

async function main() {
    const command = cli.input[0];

    try {
      if (command === 'design') {
        await runDesign({
          image: cli.flags.image,
          cols: cli.flags.cols,
          rows: cli.flags.rows,
          out: cli.flags.out,
        });
        return;
      }

      if (command === 'init') {
        await runInit({ cols: cli.flags.cols, rows: cli.flags.rows, out: cli.flags.out });
        // eslint-disable-next-line no-console
        console.log('Initialized: spec + generated helpers written.');
        return;
      }

      if (command === 'generate') {
        await runGenerate({ spec: cli.flags.spec, out: cli.flags.out });
        // eslint-disable-next-line no-console
        console.log('Generated: TSX + helpers written.');
        return;
      }

      if (command === 'validate') {
        await runValidate({ spec: cli.flags.spec });
        // eslint-disable-next-line no-console
        console.log('OK');
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(msg);
      process.exitCode = 1;
      return;
    }

    cli.showHelp();
}

main();
