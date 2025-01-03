import * as t from 'io-ts';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { BIP32Interface, networks } from '@bitgo/utxo-lib';
import { signMessage, verifyMessage } from '@bitgo/sdk-core';

export const NamedDescriptor = t.intersection(
  [
    t.type({
      name: t.string,
      value: t.string,
    }),
    t.partial({
      signatures: t.union([t.array(t.string), t.undefined]),
    }),
  ],
  'NamedDescriptor'
);

export type NamedDescriptor<T = string> = {
  name: string;
  value: T;
  signatures?: string[];
};

export function createNamedDescriptorWithSignature(
  name: string,
  descriptor: Descriptor,
  signingKey: BIP32Interface
): NamedDescriptor {
  const value = descriptor.toString();
  const signature = signMessage(value, signingKey, networks.bitcoin).toString('hex');
  return { name, value, signatures: [signature] };
}

export function hasValidSignature(descriptor: string | Descriptor, key: BIP32Interface, signatures: string[]): boolean {
  if (typeof descriptor === 'string') {
    descriptor = Descriptor.fromString(descriptor, 'derivable');
  }

  const message = descriptor.toString();
  return signatures.some((signature) => {
    return verifyMessage(message, key, Buffer.from(signature, 'hex'), networks.bitcoin);
  });
}

export function assertHasValidSignature(namedDescriptor: NamedDescriptor, key: BIP32Interface): void {
  if (!hasValidSignature(namedDescriptor.value, key, namedDescriptor.signatures ?? [])) {
    throw new Error(`Descriptor ${namedDescriptor.name} does not have a valid signature (key=${key.toBase58()})`);
  }
}
