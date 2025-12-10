import axios from 'axios';
import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { getBitGoWithUtxoCoin, selectWallet } from '../../util/bitGoInstance';
import { signTransactionWithFullnode } from './sign';
import { BitGoApiArgs } from '../../bitGoArgs';
import { buildTransactionLocal } from './build';
import { getXprv } from '../xprv';

type Args = BitGoApiArgs & {
  walletId: string | undefined;
  walletLabel: string | undefined;
  xprv: string | undefined;
  walletPassphrase: string;
  buildMode: 'local' | 'http' | 'wallet';
  sendMode: 'bitgo' | 'mempool';
  feeRateSatB: number;
  otp: string;
  recipient: string;
  amount: string;
  fullnodeUrl: string | undefined;
};

export const cmdBuildSignSend: CommandModule<BitGoApiArgs, Args> = {
  command: 'buildSignSend',
  builder: {
    walletId: { type: 'string' },
    walletLabel: { type: 'string' },
    xprv: { type: 'string' },
    walletPassphrase: { type: 'string', default: 'setec astronomy' },
    buildMode: { choices: ['local', 'http', 'wallet'], default: 'wallet' },
    sendMode: { choices: ['bitgo', 'mempool'], default: 'bitgo' },
    otp: { type: 'string', default: '0000000' },
    recipient: { type: 'string', demandOption: true },
    feeRateSatB: { type: 'number', default: 10 },
    amount: { type: 'string', demandOption: true },
    fullnodeUrl: { type: 'string' },
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

    if (!psbt) {
      throw new Error('PSBT not found');
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
        await axios.post('https://mempool.space/testnet/api/tx', tx.toHex());
        break;
    }
  },
};
