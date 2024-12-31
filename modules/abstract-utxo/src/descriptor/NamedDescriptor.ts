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

export type NamedDescriptor = t.TypeOf<typeof NamedDescriptor>;

export function createNamedDescriptorWithSignature(
  name: string,
  descriptor: Descriptor,
  signingKey: BIP32Interface
): NamedDescriptor {
  const value = descriptor.toString();
  const signature = signMessage(value, signingKey, networks.bitcoin).toString('hex');
  return { name, value, signatures: [signature] };
}

export function assertHasValidSignature(namedDescriptor: NamedDescriptor, key: BIP32Interface): void {
  if (namedDescriptor.signatures === undefined) {
    throw new Error(`Descriptor ${namedDescriptor.name} does not have a signature`);
  }
  const isValid = namedDescriptor.signatures.some((signature) => {
    return verifyMessage(namedDescriptor.value, key, Buffer.from(signature, 'hex'), networks.bitcoin);
  });
  if (!isValid) {
    throw new Error(`Descriptor ${namedDescriptor.name} does not have a valid signature (key=${key.toBase58()})`);
  }
}
