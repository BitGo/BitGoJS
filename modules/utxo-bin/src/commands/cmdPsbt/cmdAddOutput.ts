import * as yargs from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { Dimensions } from '@bitgo/unspents';
import { Buffer } from 'buffer';
import { Descriptor, Miniscript } from '@bitgo/wasm-miniscript';

import { withPsbt, withPsbtOptions, WithPsbtOptions } from './withPsbt';

function toScriptPubKey(
  params: {
    address?: string;
    scriptPubKey?: string;
  },
  network: utxolib.Network
): Buffer {
  if (params.address) {
    return utxolib.addressFormat.toOutputScriptTryFormats(params.address, network);
  }
  if (params.scriptPubKey) {
    return Buffer.from(params.scriptPubKey, 'hex');
  }
  throw new Error('address or scriptPubKey is required');
}

type ArgsAddOutput = WithPsbtOptions & {
  address?: string;
  scriptPubKey?: string;
  amount: string;
  feeRateSatB?: number;
};

function getInputWeight(psbt: utxolib.Psbt, inputIndex?: number): number {
  if (inputIndex === undefined) {
    return psbt.txInputs.reduce((sum, input, inputIndex) => sum + getInputWeight(psbt, inputIndex), 0);
  }
  const { redeemScript, witnessScript } = psbt.data.inputs[inputIndex];
  if (redeemScript) {
    throw new Error('redeemScript is not supported');
  }
  if (!witnessScript) {
    throw new Error('witnessScript is required');
  }
  const witnessMiniscript = Miniscript.fromBitcoinScript(witnessScript, 'segwitv0');
  const descriptor = Descriptor.fromString(`wsh(${witnessMiniscript.toString()})`, 'definite');
  return descriptor.maxWeightToSatisfy();
}

function getOutputVsize(psbt: utxolib.Psbt, outputIndex?: number): number {
  if (outputIndex === undefined) {
    return psbt.txOutputs.reduce((sum, output, outputIndex) => sum + getOutputVsize(psbt, outputIndex), 0);
  }
  const { script } = psbt.txOutputs[outputIndex];
  return Dimensions.getVSizeForOutputWithScriptLength(script.length);
}

function getMaxOutputValue(
  psbt: utxolib.Psbt,
  {
    scriptPubKey,
    feeRateSatB,
  }: {
    scriptPubKey: Buffer;
    feeRateSatB: number;
  }
): bigint {
  const inputSum = psbt.data.inputs.reduce((sum, input) => {
    if (!input.witnessUtxo) {
      throw new Error('witnessUtxo is required');
    }
    return sum + input.witnessUtxo.value;
  }, BigInt(0));
  const outputSum = psbt.txOutputs.reduce((sum, output) => sum + output.value, BigInt(0));
  const inputVsize = Math.ceil(getInputWeight(psbt) / 4);
  const outputVsize = getOutputVsize(psbt) + Dimensions.getVSizeForOutputWithScriptLength(scriptPubKey.length);
  const totalVsize = inputVsize + outputVsize + 11;
  const fee = BigInt(totalVsize * feeRateSatB);
  if (inputSum < outputSum + fee) {
    throw new Error(`insufficient funds: [inputSum=${inputSum}, outputSum=${outputSum}, fee=${fee}]`);
  }
  return inputSum - outputSum - fee;
}

function getOutputValue(
  amount: string,
  {
    scriptPubKey,
    psbt,
    feeRateSatB,
  }: {
    scriptPubKey: Buffer;
    psbt: utxolib.Psbt;
    feeRateSatB?: number;
  }
): bigint {
  if (amount === 'max') {
    if (!feeRateSatB) {
      throw new Error('feeRateSatB is required');
    }
    return getMaxOutputValue(psbt, { scriptPubKey, feeRateSatB });
  }
  return BigInt(parseFloat(amount));
}

export const cmdAddOutput: yargs.CommandModule<unknown, ArgsAddOutput> = {
  command: 'addOutput',
  describe: 'add output to psbt',
  builder(b: yargs.Argv<unknown>) {
    return b
      .options(withPsbtOptions)
      .option('address', { type: 'string' })
      .option('scriptPubKey', { type: 'string' })
      .option('amount', { type: 'string', demandOption: true })
      .option('feeRateSatB', { type: 'number' });
  },
  async handler(argv) {
    await withPsbt(argv, async function (psbt) {
      const scriptPubKey = toScriptPubKey(
        {
          address: argv.address,
          scriptPubKey: argv.scriptPubKey,
        },
        argv.network
      );
      const value = getOutputValue(argv.amount, { scriptPubKey, psbt, feeRateSatB: argv.feeRateSatB });
      psbt.addOutput({ script: scriptPubKey, value });
      return psbt;
    });
  },
};
