import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../../bitGoArgs';
import { getBitGoWithUtxoCoin } from '../../util/bitGoInstance';
import { buildTransactionLocal } from './build';
import { signTransactionWithFullnode } from './sign';
import * as utxolib from '@bitgo/utxo-lib';

type ArgsBuildSignSendTransaction = {
  otp: string;
  wallet: string;
  recipient: string;
  amount: string;
  fullnodeUrl: string;
};

export const cmdBuildSignSend: CommandModule<BitGoApiArgs, BitGoApiArgs & ArgsBuildSignSendTransaction> = {
  command: 'buildSignSend',
  builder(y) {
    return y
      .option('wallet', { type: 'string', demandOption: true })
      .option('otp', { type: 'string', default: '000000' })
      .option('recipient', { type: 'string', demandOption: true })
      .option('amount', { type: 'string', demandOption: true })
      .option('fullnodeUrl', { type: 'string', demandOption: true });
  },
  async handler(args) {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    const wallet = await coin.wallets().get({ id: args.wallet });
    let { recipient } = args;
    if (recipient === 'self') {
      recipient = (await wallet.createAddress()).address;
    }
    const recipients = [{ address: recipient, amount: args.amount }];
    const prebuild = await buildTransactionLocal(bitgo, coin, wallet, recipients);
    const halfSigned = await signTransactionWithFullnode(args.fullnodeUrl, prebuild.toBase64());
    if (typeof halfSigned.psbt !== 'string') {
      throw new Error('Expected psbt to be a string');
    }
    await bitgo.unlock({ otp: args.otp });
    const psbt = utxolib.bitgo.createPsbtDecode(halfSigned.psbt, coin.network);
    console.log(
      await bitgo
        .post(coin.url('/wallet/' + wallet.id() + '/tx/send'))
        .send({ txHex: psbt.toHex() })
        .result()
    );
  },
};
