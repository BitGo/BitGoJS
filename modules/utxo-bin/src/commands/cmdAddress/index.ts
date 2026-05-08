import { CommandModule } from 'yargs';

import { cmdFromDescriptor, cmdGenerateFixedScript } from './cmdGenerate';
import { cmdParse } from './cmdParse';

export const cmdAddress: CommandModule<unknown, unknown> = {
  command: 'address <command>',
  describe: 'address commands',
  builder(b) {
    return b.strict().command(cmdGenerateFixedScript).command(cmdFromDescriptor).command(cmdParse).demandCommand();
  },
  handler() {
    // do nothing
  },
};
