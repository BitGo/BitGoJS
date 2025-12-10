import * as fs from 'fs/promises';
import { getBitGoInstance } from '../../util/bitGoInstance';
import { BitGoApiArgs } from '../../bitGoArgs';
import { CommandModule } from 'yargs';
import { RpcClient } from '../RpcClient';

type ArgsSignTransaction = {
  coin: string;
  psbt: string;
  wallet: string;
  walletPassphrase: string;
  fullnodeUrl?: string;
};

export async function signTransactionWithFullnode(url: string, psbt: string): Promise<unknown> {
  const rpcClient = new RpcClient(url);
  return await rpcClient.exec('walletprocesspsbt', psbt);
}

export const cmdSign: CommandModule<BitGoApiArgs, BitGoApiArgs & ArgsSignTransaction> = {
  command: 'sign',
  describe: 'Sign a PSBT',
  builder(yargs) {
    return yargs
      .option('psbt', { type: 'string', demandOption: true })
      .option('wallet', { type: 'string', demandOption: true })
      .option('walletPassphrase', { type: 'string', default: 'setec astronomy' })
      .option('fullnodeUrl', { type: 'string' });
  },
  async handler(args) {
    const psbt = await fs.readFile(args.psbt, 'utf-8');
    if (args.fullnodeUrl) {
      const result = await signTransactionWithFullnode(args.fullnodeUrl, psbt);
      console.log(result);
      return;
    }
    const bitgo = getBitGoInstance(args);
    const coin = bitgo.coin(args.coin);
    const wallet = await coin.wallets().get({ id: args.wallet });
    const userKey = await coin.keychains().get({ id: wallet.keyIds()[0] });
    const key = wallet.getUserPrv({ keychain: userKey, walletPassphrase: args.walletPassphrase });
    console.log(key);
  },
};
