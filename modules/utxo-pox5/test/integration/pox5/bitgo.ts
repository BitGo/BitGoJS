import { pox5 as descriptors } from '@bitgo/utxo-descriptors';
import { pox5 as staking } from '@bitgo/utxo-staking';
import { Psbt, type Descriptor } from '@bitgo/wasm-utxo';

export type Pox5InputMatch = descriptors.Pox5InputMatch;

export type BitGoPox5Adapter = {
  createDescriptor: typeof descriptors.createPox5LockupDescriptor;
  createScriptPubKey: typeof descriptors.createPox5LockupScriptPubKey;
  matchInput: typeof descriptors.matchPox5Input;
  classifySpend: typeof staking.classifyPox5Spend;
  prepareEarlyExit: typeof staking.preparePox5EarlyExit;
};

export function createBitGoPox5Adapter(): BitGoPox5Adapter {
  return {
    createDescriptor: descriptors.createPox5LockupDescriptor,
    createScriptPubKey: descriptors.createPox5LockupScriptPubKey,
    matchInput: descriptors.matchPox5Input,
    classifySpend: staking.classifyPox5Spend,
    prepareEarlyExit: staking.preparePox5EarlyExit,
  };
}

export function createDescriptorMap(descriptor: Descriptor): Map<string, Descriptor> {
  return new Map([['pox5', descriptor]]);
}

export function createPox5Psbt(descriptor: Descriptor, lockTime: number): Psbt {
  const psbt = Psbt.create(2, lockTime);
  psbt.addInput('01'.repeat(32), 0, 100_000n, descriptor.scriptPubkey(), 0xfffffffe);
  psbt.addOutput(descriptor.scriptPubkey(), 90_000n);
  psbt.updateInputWithDescriptor(0, descriptor);
  return psbt;
}
