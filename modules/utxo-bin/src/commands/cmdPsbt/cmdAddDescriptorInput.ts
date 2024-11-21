import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import * as yargs from 'yargs';

import { toUtxoPsbt, toWrappedPsbt } from './wrap';
import { withPsbt, WithPsbtOptions, withPsbtOptions } from './withPsbt';

/**
 * Non-Final (Replaceable)
 * Reference: https://github.com/bitcoin/bitcoin/blob/v25.1/src/rpc/rawtransaction_util.cpp#L49
 * */
const MAX_BIP125_RBF_SEQUENCE = 0xffffffff - 2;

type ArgsAddDescriptorInput = WithPsbtOptions & {
  outputId: string;
  address?: string;
  scriptPubKey?: string;
  value: string;
  descriptor: string;
  descriptorIndex: number;
};

function getScriptPubKey(
  args: { address?: string; scriptPubKey?: string },
  network: utxolib.Network
): Buffer | undefined {
  if (args.address) {
    return utxolib.addressFormat.toOutputScriptTryFormats(args.address, network);
  }
  if (args.scriptPubKey) {
    return Buffer.from(args.scriptPubKey, 'hex');
  }
  return undefined;
}

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

export const cmdAddDescriptorInput: yargs.CommandModule<unknown, ArgsAddDescriptorInput> = {
  command: 'addDescriptorInput',
  describe: 'add descriptor input to psbt',
  builder(b: yargs.Argv<unknown>) {
    return b
      .options(withPsbtOptions)
      .option('outputId', { type: 'string', demandOption: true })
      .option('address', { type: 'string' })
      .option('scriptPubKey', { type: 'string' })
      .option('value', { type: 'string', demandOption: true })
      .option('descriptor', { type: 'string', demandOption: true })
      .option('descriptorIndex', { type: 'number', demandOption: true });
  },
  async handler(argv) {
    await withPsbt(argv, async function (psbt) {
      addDescriptorInput(
        psbt,
        argv.outputId,
        getScriptPubKey(
          {
            address: argv.address,
            scriptPubKey: argv.scriptPubKey,
          },
          argv.network
        ),
        BigInt(argv.value),
        argv.descriptor,
        argv.descriptorIndex
      );
      return psbt;
    });
  },
};
