import axios from 'axios';
import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';

import { BitGoApiArgs } from '../../bitGoArgs';
import { getBitGoWithUtxoCoin, selectWallet } from '../../util/bitGoInstance';
import { signTransactionWithFullnode } from './sign';
import { optionsWallet, optionWalletPassphrase, WalletArgs, WalletPassphraseArgs } from '../args/wallet';
import { buildTransactionLocal } from './build';
import { getXprv } from '../xprv';

type ArgsBuildSignSendTransaction = WalletArgs &
  WalletPassphraseArgs & {
    buildMode: 'local' | 'http' | 'wallet';
    sendMode: 'bitgo' | 'mempool';
    feeRateSatB: number;
    otp: string;
    recipient: string;
    amount: string;
    fullnodeUrl: string;
  };

// export async function buildSignSendNoVerify() {}

export const cmdBuildSignSend: CommandModule<BitGoApiArgs, BitGoApiArgs & ArgsBuildSignSendTransaction> = {
  command: 'buildSignSend',
  builder(y) {
    return y
      .options(optionsWallet)
      .options(optionWalletPassphrase)
      .option('buildMode', { choices: ['local', 'http', 'wallet'] as const, default: 'wallet' })
      .option('sendMode', { choices: ['bitgo', 'mempool'] as const, default: 'bitgo' })
      .option('otp', { type: 'string', default: '0000000' })
      .option('recipient', { type: 'string', demandOption: true })
      .option('feeRateSatB', { type: 'number', default: 10 })
      .option('amount', { type: 'string', demandOption: true })
      .option('fullnodeUrl', { type: 'string' });
  },
  async handler(args) {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    const wallet = await selectWallet(bitgo, coin, args);
    const { walletPassphrase } = args;
    let { recipient } = args;
    if (recipient === 'self') {
      recipient = (await wallet.createAddress()).address;
    }
    if (recipient.startsWith('wallet:')) {
      const walletLabel = recipient.slice('wallet:'.length);
      const recipientWallet = await selectWallet(bitgo, coin, { walletLabel });
      recipient = (await recipientWallet.createAddress()).address;
    }
    const recipients = [{ address: recipient, amount: args.amount }];
    let psbt: utxolib.Psbt | undefined;
    switch (args.buildMode) {
      case 'local':
        psbt = await buildTransactionLocal(bitgo, coin, wallet, recipients);
        break;
      case 'http':
        const result = await bitgo
          .post(coin.url('/wallet/' + wallet.id() + '/tx/build'))
          .send({ recipients, feeRate: args.feeRateSatB * 1000 })
          .result();
        if ('txBase64' in result && typeof result.txBase64 === 'string') {
          psbt = utxolib.bitgo.createPsbtDecode(result.txBase64, coin.network);
        } else {
          throw new Error('Expected psbt to be a string');
        }
        if (args.fullnodeUrl) {
          const halfSigned = await signTransactionWithFullnode(args.fullnodeUrl, psbt.toBase64());
          if (typeof halfSigned !== 'object' || halfSigned === null) {
            throw new Error('Expected halfSigned to be an object');
          }
          if (!('psbt' in halfSigned) || typeof halfSigned.psbt !== 'string') {
            throw new Error('Expected psbt to be a string');
          }
          psbt = utxolib.bitgo.createPsbtDecode(halfSigned.psbt, coin.network);
        } else {
          const key = await getXprv(coin, wallet, args);
          psbt.signAllInputsHD(key);
        }
        break;
      case 'wallet':
        return console.dir(await wallet.sendMany({ recipients, walletPassphrase, feeRate: args.feeRateSatB * 1000 }), {
          depth: 99,
        });
    }

    switch (args.sendMode) {
      case 'bitgo':
        try {
          await bitgo.unlock({ otp: args.otp });
        } catch (e) {
          if (!e.message.includes('Token is already unlocked longer')) {
            throw e;
          }
        }
        console.log(
          await bitgo
            .post(coin.url('/wallet/' + wallet.id() + '/tx/send'))
            .send({ txHex: psbt.toHex() })
            .result()
        );
        break;
      case 'mempool':
        const tx = psbt.finalizeAllInputs().extractTransaction();
        // console.log(await request('https://mempool.space/api/tx').post(psbt.toHex()));
        await axios.post('https://mempool.space/testnet/api/tx', tx.toHex());
        break;
    }
  },
};
