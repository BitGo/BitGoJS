import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../../bitGoArgs';
import { cmdSign } from './sign';
import { cmdSend } from './send';
import { cmdBuild } from './build';
import { cmdBuildSignSend } from './buildSignSend';

export const cmdTx: CommandModule<BitGoApiArgs, BitGoApiArgs> = {
  command: 'tx',
  describe: 'transaction commands',
  builder(y) {
    return y.command(cmdBuild).command(cmdSign).command(cmdSend).command(cmdBuildSignSend).demandCommand();
  },
  handler() {
    // empty
  },
};
