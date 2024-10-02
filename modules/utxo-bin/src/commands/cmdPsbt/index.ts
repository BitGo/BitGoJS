import { Argv, CommandModule } from 'yargs';

import { cmdSignPsbt } from './cmdPsbtSign';
import { cmdCreateFixedScriptTx } from './cmdPsbtCreate';

export const cmdPsbt: CommandModule<unknown, unknown> = {
  command: 'psbt <command>',
  describe: 'psbt commands',
  builder(b: Argv<unknown>): Argv<unknown> {
    return b.strict().command(cmdCreateFixedScriptTx).command(cmdSignPsbt);
  },
  handler(): void {
    // do nothing
  },
};
