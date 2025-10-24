import * as utxolib from '@bitgo/utxo-lib';
import { Dimensions, VirtualSizes } from '@bitgo/unspents';
import { Descriptor } from '@bitgo/wasm-utxo';

import { DescriptorMap } from './DescriptorMap';
import { findDescriptorForInput } from './psbt';

function getScriptPubKeyLength(descType: string): number {
  // See https://bitcoinops.org/en/tools/calc-size/
  switch (descType) {
    case 'Wpkh':
      // https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#p2wpkh
      return 22;
    case 'Sh':
    case 'ShWsh':
    case 'ShWpkh':
      // https://github.com/bitcoin/bips/blob/master/bip-0016.mediawiki#specification
      return 23;
    case 'Pkh':
      return 25;
    case 'Wsh':
    case 'Tr':
      // P2WSH: https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#p2wsh
      // P2TR: https://github.com/bitcoin/bips/blob/58ffd93812ff25e87d53d1f202fbb389fdfb85bb/bip-0341.mediawiki#script-validation-rules
      // > A Taproot output is a native SegWit output (see BIP141) with version number 1, and a 32-byte witness program.
      // 32 bytes for the hash, 1 byte for the version, 1 byte for the push opcode
      return 34;
    case 'Bare':
      throw new Error('cannot determine scriptPubKey length for Bare descriptor');
    default:
      throw new Error('unexpected descriptor type ' + descType);
  }
}

function getInputVSizeForDescriptor(descriptor: Descriptor): number {
  // FIXME(BTC-1489): this can overestimate the size of the input significantly
  const maxWeight = descriptor.maxWeightToSatisfy();
  const maxVSize = Math.ceil(maxWeight / 4);
  const sizeOpPushdata1 = 1;
  const sizeOpPushdata2 = 2;
  return (
    // inputId
    32 +
    // vOut
    4 +
    // nSequence
    4 +
    // script overhead
    (maxVSize < 255 ? sizeOpPushdata1 : sizeOpPushdata2) +
    // script
    maxVSize
  );
}

export function getInputVSizesForDescriptors(descriptors: DescriptorMap): Record<string, number> {
  return Object.fromEntries(
    Array.from(descriptors.entries()).map(([name, d]) => {
      return [name, getInputVSizeForDescriptor(d)];
    })
  );
}

export function getChangeOutputVSizesForDescriptor(d: Descriptor): {
  inputVSize: number;
  outputVSize: number;
} {
  return {
    inputVSize: getInputVSizeForDescriptor(d),
    outputVSize: getScriptPubKeyLength(d.descType()),
  };
}

type InputWithDescriptorName = { descriptorName: string };
type OutputWithScript = { script: Buffer };

type Tx<TInput> = {
  inputs: TInput[];
  outputs: OutputWithScript[];
};

export function getVirtualSize(tx: Tx<Descriptor>): number;
export function getVirtualSize(tx: Tx<InputWithDescriptorName>, descriptors: DescriptorMap): number;
export function getVirtualSize(
  tx: Tx<Descriptor> | Tx<InputWithDescriptorName>,
  descriptorMap?: DescriptorMap
): number {
  const lookup = descriptorMap ? getInputVSizesForDescriptors(descriptorMap) : undefined;
  const inputVSize = tx.inputs.reduce((sum, input) => {
    if (input instanceof Descriptor) {
      return sum + getInputVSizeForDescriptor(input);
    }
    if ('descriptorName' in input) {
      if (!lookup) {
        throw new Error('missing descriptorMap');
      }
      const vsize = lookup[input.descriptorName];
      if (!vsize) {
        throw new Error(`Could not find descriptor ${input.descriptorName}`);
      }
      return sum + vsize;
    }
    throw new Error('unexpected input');
  }, 0);
  const outputVSize = tx.outputs.reduce((sum, o) => {
    return sum + Dimensions.getVSizeForOutputWithScriptLength(o.script.length);
  }, 0);
  // we will just assume that we have at least one segwit input
  return inputVSize + outputVSize + VirtualSizes.txSegOverheadVSize;
}

export function getVirtualSizeEstimateForPsbt(psbt: utxolib.Psbt, descriptorMap: DescriptorMap): number {
  const inputs = psbt.data.inputs.map((i) => {
    const result = findDescriptorForInput(i, descriptorMap);
    if (!result) {
      throw new Error('Could not find descriptor for input');
    }
    return result.descriptor;
  });
  const outputs = psbt.txOutputs.map((o) => ({ script: o.script }));
  return getVirtualSize({ inputs, outputs });
}
