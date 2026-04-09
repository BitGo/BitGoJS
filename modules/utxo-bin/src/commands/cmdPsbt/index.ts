import { Argv, CommandModule } from 'yargs';

import { cmdSign } from './cmdSign';
import { cmdAddOutput } from './cmdAddOutput';
import { cmdAddDescriptorInput } from './cmdAddDescriptorInput';
import { cmdExtract, cmdFinalize } from './cmdFinalize';
import { cmdCreate } from './cmdCreate';

export const cmdPsbt = {
  command: 'psbt <command>',
  describe: 'psbt commands',
  builder(b: Argv<unknown>): Argv<unknown> {
    return b
      .strict()
      .command(cmdCreate)
      .command(cmdAddDescriptorInput)
      .command(cmdAddOutput)
      .command(cmdSign)
      .command(cmdFinalize)
      .command(cmdExtract)
      .demandCommand();
  },
  handler(): void {
    // do nothing
  },
} satisfies CommandModule<unknown, unknown>;
