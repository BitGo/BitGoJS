import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../bitGoArgs';
import { getBitGoInstance } from '../util/bitGoInstance';

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
          return yargs.option('wallet', { type: 'string', demandOption: true });
        },
        async handler(args) {
          const bitgo = getBitGoInstance(args);
          const coin = bitgo.coin(args.coin);
          const wallet = await coin.wallets().get({ id: args.wallet });
          console.log(await wallet.createAddress());
        },
      });
  },
  handler() {
    // do nothing
  },
};
