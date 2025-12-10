import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../../bitGoArgs';
import { cmdCreateStakingWallet } from './createWallet';
import { cmdStakingCreateTx } from './createStakingTransaction';

export const cmdStaking = {
  command: 'staking',
  describe: 'Staking commands',
  builder(y) {
    return y.strict().command(cmdCreateStakingWallet).command(cmdStakingCreateTx).demandCommand();
  },
  handler() {
    // empty
  },
} satisfies CommandModule<BitGoApiArgs, BitGoApiArgs>;
