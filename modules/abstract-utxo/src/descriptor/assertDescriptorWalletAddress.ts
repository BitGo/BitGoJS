import assert from 'assert';

import { Descriptor, address, descriptorWallet } from '@bitgo/wasm-utxo';

import { UtxoCoinSpecific, VerifyAddressOptions } from '../abstractUtxoCoin';
import { UtxoCoinName } from '../names';

class DescriptorAddressMismatchError extends Error {
  constructor(descriptor: Descriptor, index: number, derivedAddress: string, expectedAddress: string) {
    super(
      `Address mismatch for descriptor ${descriptor.toString()} at index ${index}: ${derivedAddress} !== ${expectedAddress}`
    );
  }
}

export function assertDescriptorWalletAddress(
  coinName: UtxoCoinName,
  params: VerifyAddressOptions<UtxoCoinSpecific>,
  descriptors: descriptorWallet.DescriptorMap
): void {
  assert(params.coinSpecific);
  assert('descriptorName' in params.coinSpecific);
  assert('descriptorChecksum' in params.coinSpecific);
  const { descriptorName, descriptorChecksum } = params.coinSpecific;
  const descriptor = descriptors.get(params.coinSpecific.descriptorName);
  if (!descriptor) {
    throw new Error(`Descriptor ${descriptorName} not found`);
  }
  const checksum = descriptor.toString().slice(-8);
  if (checksum !== descriptorChecksum) {
    throw new Error(
      `Descriptor checksum mismatch for descriptor name=${descriptorName}: ${checksum} !== ${descriptorChecksum}`
    );
  }
  const derivedScript = Buffer.from(descriptor.atDerivationIndex(params.index).scriptPubkey());
  const derivedAddress = address.fromOutputScriptWithCoin(derivedScript, coinName);
  if (params.address !== derivedAddress) {
    throw new DescriptorAddressMismatchError(descriptor, params.index, derivedAddress, params.address);
  }
}
