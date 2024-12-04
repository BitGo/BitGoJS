import assert from 'assert';
import * as t from 'io-ts';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { UtxoCoinSpecific, VerifyAddressOptions } from '../abstractUtxoCoin';
import { NamedDescriptor } from './NamedDescriptor';

class DescriptorAddressMismatchError extends Error {
  constructor(descriptor: Descriptor, index: number, derivedAddress: string, expectedAddress: string) {
    super(
      `Address mismatch for descriptor ${descriptor.toString()} at index ${index}: ${derivedAddress} !== ${expectedAddress}`
    );
  }
}

export function assertDescriptorWalletAddress(
  network: utxolib.Network,
  params: VerifyAddressOptions<UtxoCoinSpecific>,
  descriptors: unknown
): void {
  assert(params.coinSpecific);
  assert(t.array(NamedDescriptor).is(descriptors));
  assert('descriptorName' in params.coinSpecific);
  assert('descriptorChecksum' in params.coinSpecific);
  const descriptorName = params.coinSpecific.descriptorName;
  const descriptorChecksum = params.coinSpecific.descriptorChecksum;
  const namedDescriptor = descriptors.find((d) => d.name === descriptorName);
  if (!namedDescriptor) {
    throw new Error(`Descriptor ${descriptorName} not found`);
  }
  const descriptor = Descriptor.fromString(namedDescriptor.value, 'derivable');
  const checksum = descriptor.toString().slice(-8);
  if (checksum !== descriptorChecksum) {
    throw new Error(
      `Descriptor checksum mismatch for descriptor name=${descriptorName}: ${checksum} !== ${descriptorChecksum}`
    );
  }
  const derivedScript = Buffer.from(descriptor.atDerivationIndex(params.index).scriptPubkey());
  const derivedAddress = utxolib.address.fromOutputScript(derivedScript, network);
  if (params.address !== derivedAddress) {
    throw new DescriptorAddressMismatchError(descriptor, params.index, derivedAddress, params.address);
  }
}
