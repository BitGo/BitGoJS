import { BIP32Interface } from '@bitgo/utxo-lib';

import { createNamedDescriptorWithSignature, NamedDescriptor } from '../NamedDescriptor';
import { getDescriptorFromBuilder, DescriptorBuilder } from '../builder';

export type DescriptorFromKeys = (userKey: BIP32Interface, cosigners: BIP32Interface[]) => NamedDescriptor[];

/**
 * Create a pair of external and internal descriptors for a 2-of-3 multisig wallet.
 * Overrides the path of the builder to use the external and internal derivation paths (0/* and 1/*).
 *
 * @param builder
 * @param userKey
 */
function createExternalInternalPair(
  builder: DescriptorBuilder,
  userKey: BIP32Interface
): [NamedDescriptor, NamedDescriptor] {
  if (userKey.isNeutered()) {
    throw new Error('User key must be private');
  }
  return [
    createNamedDescriptorWithSignature(
      builder.name + '/external',
      getDescriptorFromBuilder({ ...builder, path: '0/*' }),
      userKey
    ),
    createNamedDescriptorWithSignature(
      builder.name + '/internal',
      getDescriptorFromBuilder({ ...builder, path: '1/*' }),
      userKey
    ),
  ];
}

/**
 * Create a pair of external and internal descriptors for a 2-of-3 multisig wallet.
 *
 * @param userKey
 * @param cosigners
 * @constructor
 */
export const DefaultWsh2Of3: DescriptorFromKeys = (userKey, cosigners) =>
  createExternalInternalPair({ name: 'Wsh2Of3', keys: [userKey.neutered(), ...cosigners], path: '' }, userKey);
