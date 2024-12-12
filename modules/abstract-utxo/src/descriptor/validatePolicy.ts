import { Descriptor } from '@bitgo/wasm-miniscript';
import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { DescriptorBuilder, parseDescriptor } from './builder';
import { NamedDescriptor } from './NamedDescriptor';
import { DescriptorMap, toDescriptorMap } from '../core/descriptor';

export type DescriptorValidationPolicy = { allowedTemplates: DescriptorBuilder['name'][] } | 'allowAll';

export type KeyTriple = Triple<utxolib.BIP32Interface>;

function isDescriptorWithTemplate(
  d: Descriptor,
  name: DescriptorBuilder['name'],
  walletKeys: Triple<utxolib.BIP32Interface>
): boolean {
  const parsed = parseDescriptor(d);
  if (parsed.name !== name) {
    return false;
  }
  if (parsed.keys.length !== walletKeys.length) {
    return false;
  }
  return parsed.keys.every((k, i) => k.toBase58() === walletKeys[i].toBase58());
}

export function assertDescriptorPolicy(
  descriptor: Descriptor,
  policy: DescriptorValidationPolicy,
  walletKeys: Triple<utxolib.BIP32Interface>
): void {
  if (policy === 'allowAll') {
    return;
  }

  if ('allowedTemplates' in policy) {
    const allowed = policy.allowedTemplates;
    if (!allowed.some((t) => isDescriptorWithTemplate(descriptor, t, walletKeys))) {
      throw new Error(`Descriptor ${descriptor.toString()} does not match any allowed template`);
    }
  }

  throw new Error(`Unknown descriptor validation policy: ${policy}`);
}

export function toDescriptorMapValidate(
  descriptors: NamedDescriptor[],
  walletKeys: KeyTriple,
  policy: DescriptorValidationPolicy
): DescriptorMap {
  const map = toDescriptorMap(descriptors);
  for (const descriptor of map.values()) {
    assertDescriptorPolicy(descriptor, policy, walletKeys);
  }
  return map;
}

export function getPolicyForEnv(env: EnvironmentName): DescriptorValidationPolicy {
  switch (env) {
    case 'adminProd':
    case 'prod':
      return {
        allowedTemplates: ['Wsh2Of3', 'ShWsh2Of3CltvDrop'],
      };
    default:
      return 'allowAll';
  }
}
