import * as assert from 'assert';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { getBitGoInstance } from '../../util/bitGoInstance';
import { CommandModule } from 'yargs';
import { BitGoApiArgs } from '../../bitGoArgs';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { toUtxoPsbt, toWrappedPsbt } from './wrap';
import { getDescriptors } from '../descriptorWallet';

/**
 * Non-Final (Replaceable)
 * Reference: https://github.com/bitcoin/bitcoin/blob/v25.1/src/rpc/rawtransaction_util.cpp#L49
 * */
const MAX_BIP125_RBF_SEQUENCE = 0xffffffff - 2;

type ArgsBuildTransaction = {
  coin: string;
  wallet: string;
  recipient: string;
  amount: string;
};

type Recipient = {
  address: string;
  amount: string;
};

function addDescriptorInput(
  psbt: utxolib.Psbt,
  outputId: string,
  scriptPubKey: Buffer | undefined,
  value: bigint,
  descriptorString: string,
  descriptorIndex: number,
  { sequence = MAX_BIP125_RBF_SEQUENCE } = {}
): void {
  const { txid, vout } = utxolib.bitgo.parseOutputId(outputId);
  const descriptor = Descriptor.fromString(descriptorString, 'derivable');
  const derivedDescriptor = descriptor.atDerivationIndex(descriptorIndex);
  if (scriptPubKey === undefined) {
    scriptPubKey = Buffer.from(derivedDescriptor.scriptPubkey());
  }
  psbt.addInput({
    hash: txid,
    index: vout,
    sequence,
    witnessUtxo: {
      script: scriptPubKey,
      value,
    },
  });
  const inputIndex = psbt.txInputs.length - 1;
  const wrappedPsbt = toWrappedPsbt(psbt);
  wrappedPsbt.updateInputWithDescriptor(inputIndex, derivedDescriptor);
  const utxoPsbt = toUtxoPsbt(wrappedPsbt);
  psbt.data.inputs[inputIndex] = utxoPsbt.data.inputs[inputIndex];
}

export async function buildTransactionLocal(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  recipients: Recipient[]
): Promise<utxolib.Psbt> {
  type Unspent = {
    id: string;
    address: string;
    valueString: string;
    descriptorName: string;
    index: number;
  };
  // throw new Error('Not implemented');
  const unspents: { unspents: Unspent[] } = await wallet.unspents();
  const descriptors = getDescriptors(wallet);
  const psbt = new utxolib.Psbt({ network: coin.network });
  unspents.unspents.forEach((unspent) => {
    const descriptor = descriptors.find((d) => d.name === unspent.descriptorName);
    if (!descriptor) {
      throw new Error('Descriptor not found');
    }
    addDescriptorInput(psbt, unspent.id, undefined, BigInt(unspent.valueString), descriptor.value, unspent.index);
  });
  recipients.forEach((recipient) => {
    psbt.addOutput({
      address: recipient.address,
      value: BigInt(recipient.amount),
    });
  });
  return psbt;
}

export const cmdBuild: CommandModule<BitGoApiArgs, BitGoApiArgs & ArgsBuildTransaction> = {
  command: 'create',
  describe: 'Create a new transaction using the wallet-platform tx/build route',
  builder(yargs) {
    return yargs
      .option('wallet', { type: 'string', demandOption: true })
      .option('recipient', { type: 'string', demandOption: true })
      .option('amount', { type: 'string', demandOption: true })
      .option('local', { type: 'boolean', default: false })
      .option('fullnodeUrl', { type: 'string' });
  },
  async handler(args) {
    const bitgo = getBitGoInstance(args);
    const coin = bitgo.coin(args.coin);
    const wallet = await coin.wallets().get({ id: args.wallet });
    let { recipient } = args;
    if (recipient === 'self') {
      recipient = (await wallet.createAddress()).address;
    }
    const recipients = [{ address: recipient, amount: args.amount }];
    if (args.local) {
      assert(coin instanceof AbstractUtxoCoin);
      const psbt = buildTransactionLocal(bitgo, coin, wallet, recipients, args);
      console.log(psbt.toBase64());
    }

    return await wallet.prebuildTransaction({
      recipients,
    });
  },
};
