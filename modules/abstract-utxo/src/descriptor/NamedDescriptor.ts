import * as t from 'io-ts';
import { Descriptor, DescriptorPkType, bip32, message } from '@bitgo/wasm-utxo';

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

export type NamedDescriptorNative = NamedDescriptor<Descriptor>;

export function createNamedDescriptorWithSignature(
  name: string,
  descriptor: string | Descriptor,
  signingKey: bip32.BIP32Interface
): NamedDescriptor {
  if (typeof descriptor === 'string') {
    descriptor = Descriptor.fromString(descriptor, 'derivable');
  }
  const value = descriptor.toString();
  const signature = Buffer.from(message.signMessage(value, signingKey.privateKey!)).toString('hex');
  return { name, value, signatures: [signature] };
}

export function toNamedDescriptorNative(e: NamedDescriptor, pkType: DescriptorPkType): NamedDescriptorNative {
  return { ...e, value: Descriptor.fromString(e.value, pkType) };
}

export function hasValidSignature(
  descriptor: string | Descriptor,
  key: bip32.BIP32Interface,
  signatures: string[]
): boolean {
  if (typeof descriptor === 'string') {
    descriptor = Descriptor.fromString(descriptor, 'derivable');
  }

  const descriptorString = descriptor.toString();
  return signatures.some((signature) => {
    return message.verifyMessage(descriptorString, key.publicKey, Buffer.from(signature, 'hex'));
  });
}

export function assertHasValidSignature(namedDescriptor: NamedDescriptor, key: bip32.BIP32Interface): void {
  if (!hasValidSignature(namedDescriptor.value, key, namedDescriptor.signatures ?? [])) {
    throw new Error(`Descriptor ${namedDescriptor.name} does not have a valid signature (key=${key.toBase58()})`);
  }
}
