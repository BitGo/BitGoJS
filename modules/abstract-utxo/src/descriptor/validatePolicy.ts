import { Descriptor } from '@bitgo/wasm-miniscript';
import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { DescriptorMap, toDescriptorMap } from '../core/descriptor';

import { parseDescriptor } from './builder';
import { NamedDescriptor } from './NamedDescriptor';

export type KeyTriple = Triple<utxolib.BIP32Interface>;

export interface DescriptorValidationPolicy {
  name: string;
  validate(d: Descriptor, walletKeys: KeyTriple): boolean;
}

export const policyAllowAll: DescriptorValidationPolicy = {
  name: 'allowAll',
  validate: () => true,
};

export function getValidatorDescriptorTemplate(name: string): DescriptorValidationPolicy {
  return {
    name: 'descriptorTemplate(' + name + ')',
    validate(d: Descriptor, walletKeys: KeyTriple): boolean {
      const parsed = parseDescriptor(d);
      return (
        parsed.name === name &&
        parsed.keys.length === walletKeys.length &&
        parsed.keys.every((k, i) => k.toBase58() === walletKeys[i].neutered().toBase58())
      );
    },
  };
}

export function getValidatorEvery(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'every(' + validators.map((v) => v.name).join(',') + ')',
    validate(d: Descriptor, walletKeys: KeyTriple): boolean {
      return validators.every((v) => v.validate(d, walletKeys));
    },
  };
}

export function getValidatorSome(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'some(' + validators.map((v) => v.name).join(',') + ')',
    validate(d: Descriptor, walletKeys: KeyTriple): boolean {
      return validators.some((v) => v.validate(d, walletKeys));
    },
  };
}

export function getValidatorOneOfTemplates(names: string[]): DescriptorValidationPolicy {
  return getValidatorSome(names.map(getValidatorDescriptorTemplate));
}

export class DescriptorPolicyValidationError extends Error {
  constructor(descriptor: Descriptor, policy: DescriptorValidationPolicy) {
    super(`Descriptor ${descriptor.toString()} does not match policy ${policy.name}`);
  }
}

export function assertDescriptorPolicy(
  descriptor: Descriptor,
  policy: DescriptorValidationPolicy,
  walletKeys: KeyTriple
): void {
  if (!policy.validate(descriptor, walletKeys)) {
    throw new DescriptorPolicyValidationError(descriptor, policy);
  }
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
      return getValidatorOneOfTemplates(['Wsh2Of3', 'Wsh2Of3CltvDrop', 'ShWsh2Of3CltvDrop']);
    default:
      return policyAllowAll;
  }
}
