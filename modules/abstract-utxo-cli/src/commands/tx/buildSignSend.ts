import { CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { getBitGoWithUtxoCoin, selectWallet } from '../../util/bitGoInstance';
import { BitGoApiArgs } from '../../bitGoArgs';

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
  message: string | undefined;
  sdkBackend: 'utxolib' | 'wasm-utxo' | undefined;
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
    message: { type: 'string', description: 'Message to include in an OP_RETURN output' },
    sdkBackend: { choices: ['utxolib', 'wasm-utxo'], description: 'SDK backend to use' },
  },
  async handler(args) {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    if (args.sdkBackend) {
      coin.defaultSdkBackend = args.sdkBackend;
    }
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

    // Add OP_RETURN output if message is provided
    if (args.message) {
      const messageBuffer = Buffer.from(args.message, 'utf8');
      const opReturnScript = utxolib.script.compile([utxolib.opcodes.OP_RETURN, messageBuffer]);
      const scriptPubKey = `scriptPubKey:${opReturnScript.toString('hex')}`;
      recipients.push({ address: scriptPubKey, amount: '0' });
    }

    await bitgo.unlock({ otp: args.otp });
    await wallet.sendMany({ recipients, walletPassphrase, feeRate: args.feeRateSatB * 1000 });
    console.log('Transaction sent successfully');
  },
};
