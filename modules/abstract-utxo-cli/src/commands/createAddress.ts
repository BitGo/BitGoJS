import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../bitGoArgs';
import { getBitGoWithUtxoCoin, selectWallet } from '../util/bitGoInstance';
import { optionsWallet } from './args/wallet';

export const cmdAddress: CommandModule<BitGoApiArgs, BitGoApiArgs> = {
  command: 'address',
  describe: 'address commands',
  builder(y) {
    return y
      .strict()
      .demandCommand()
      .command({
        command: 'create',
        describe: 'Create a new address',
        builder(yargs) {
          return yargs.options(optionsWallet);
        },
        async handler(args) {
          const { bitgo, coin } = getBitGoWithUtxoCoin(args);
          const wallet = await selectWallet(bitgo, coin, args);
          console.log(await wallet.createAddress());
        },
      });
  },
  handler() {
    // do nothing
  },
};
