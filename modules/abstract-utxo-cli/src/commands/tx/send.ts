import * as utxolib from '@bitgo/utxo-lib';
import * as fs from 'fs/promises';
import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../../bitGoArgs';
import { getBitGoInstance } from '../../util/bitGoInstance';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import assert = require('node:assert');

type ArgsSendTransaction = {
  wallet: string;
  otp: string;
  psbt: string;
};

export const cmdSend: CommandModule<BitGoApiArgs, BitGoApiArgs & ArgsSendTransaction> = {
  command: 'send',
  describe: 'Send a half-signed transaction using the wallet-platform tx/send route',
  builder(yargs) {
    return yargs
      .option('wallet', { type: 'string', demandOption: true })
      .option('otp', { type: 'string', default: '000000' })
      .option('psbt', { type: 'string', demandOption: true });
  },
  async handler(args) {
    const bitgo = getBitGoInstance(args);
    const coin = bitgo.coin(args.coin);
    assert(coin instanceof AbstractUtxoCoin);
    const wallet = await coin.wallets().get({ id: args.wallet });
    await bitgo.unlock({ otp: args.otp });
    const psbt = utxolib.bitgo.createPsbtDecode(await fs.readFile(args.psbt, 'utf-8'), coin.network);
    // console.log(await wallet.send({ psbt }));
    console.log(await bitgo.post(coin.url('/wallet/' + wallet.id() + '/tx/send')).send({ txHex: psbt.toHex() }));
  },
};
