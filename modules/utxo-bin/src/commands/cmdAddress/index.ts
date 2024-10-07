import { CommandModule } from 'yargs';

import { cmdGenerateFixedScript } from './cmdGenerate';
import { cmdParse } from './cmdParse';

export const cmdAddress: CommandModule<unknown, unknown> = {
  command: 'address <command>',
  describe: 'address commands',
  builder(b) {
    return b.strict().command(cmdGenerateFixedScript).command(cmdParse).demandCommand();
  },
  handler() {
    // do nothing
  },
};
