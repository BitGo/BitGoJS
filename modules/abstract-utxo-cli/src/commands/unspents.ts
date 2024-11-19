import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../bitGoArgs';
import { getBitGoInstance } from '../util/bitGoInstance';

export const cmdUnspents: CommandModule<BitGoApiArgs, BitGoApiArgs> = {
  command: 'unspents',
  describe: 'unspent commands',
  builder(y) {
    return y.command({
      command: 'list',
      describe: 'List unspents',
      builder(yargs) {
        return yargs.option('wallet', { type: 'string', demandOption: true });
      },
      async handler(args) {
        const bitgo = getBitGoInstance(args);
        const coin = bitgo.coin(args.coin);
        const wallet = await coin.wallets().get({ id: args.wallet });
        console.log(JSON.stringify(await wallet.unspents(), null, 2));
      },
    });
  },
  handler() {
    // do nothing
  },
};
