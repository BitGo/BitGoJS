import * as t from 'io-ts';
import { BIP32Interface, networks } from '@bitgo/utxo-lib';
import { signMessage, verifyMessage } from '@bitgo/sdk-core';
// Changed from direct import to async import (will be imported when used)
// import { Descriptor, DescriptorPkType } from '@bitgo/wasm-miniscript';

// Define types to be used before dynamic import
type Descriptor = any;
type DescriptorPkType = 'derivable' | 'raw' | 'nonparsed' | 'hardware';

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

export async function createNamedDescriptorWithSignature(
  name: string,
  descriptor: string | Descriptor,
  signingKey: BIP32Interface
): Promise<NamedDescriptor> {
  const { Descriptor } = await import('@bitgo/wasm-miniscript');
  
  if (typeof descriptor === 'string') {
    descriptor = Descriptor.fromString(descriptor, 'derivable');
  }
  const value = descriptor.toString();
  const signature = signMessage(value, signingKey, networks.bitcoin).toString('hex');
  return { name, value, signatures: [signature] };
}

export async function toNamedDescriptorNative(e: NamedDescriptor, pkType: DescriptorPkType): Promise<NamedDescriptorNative> {
  const { Descriptor } = await import('@bitgo/wasm-miniscript');
  return { ...e, value: Descriptor.fromString(e.value, pkType) };
}

export async function hasValidSignature(descriptor: string | Descriptor, key: BIP32Interface, signatures: string[]): Promise<boolean> {
  const { Descriptor } = await import('@bitgo/wasm-miniscript');
  
  if (typeof descriptor === 'string') {
    descriptor = Descriptor.fromString(descriptor, 'derivable');
  }

  const message = descriptor.toString();
  return signatures.some((signature) => {
    return verifyMessage(message, key, Buffer.from(signature, 'hex'), networks.bitcoin);
  });
}

export async function assertHasValidSignature(namedDescriptor: NamedDescriptor, key: BIP32Interface): Promise<void> {
  if (!(await hasValidSignature(namedDescriptor.value, key, namedDescriptor.signatures ?? []))) {
    throw new Error(`Descriptor ${namedDescriptor.name} does not have a valid signature (key=${key.toBase58()})`);
  }
}
