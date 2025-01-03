import { Descriptor } from '@bitgo/wasm-miniscript';
import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { DescriptorMap, toDescriptorMap } from '../core/descriptor';

import { parseDescriptor } from './builder';
import { hasValidSignature, NamedDescriptor } from './NamedDescriptor';

export type KeyTriple = Triple<utxolib.BIP32Interface>;

export interface DescriptorValidationPolicy {
  name: string;
  validate(d: Descriptor, walletKeys: KeyTriple, signatures: string[]): boolean;
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
    validate(d: Descriptor, walletKeys: KeyTriple, signatures: string[]): boolean {
      return validators.every((v) => v.validate(d, walletKeys, signatures));
    },
  };
}

export function getValidatorSome(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'some(' + validators.map((v) => v.name).join(',') + ')',
    validate(d: Descriptor, walletKeys: KeyTriple, signatures: string[]): boolean {
      return validators.some((v) => v.validate(d, walletKeys, signatures));
    },
  };
}

export function getValidatorOneOfTemplates(names: string[]): DescriptorValidationPolicy {
  return getValidatorSome(names.map(getValidatorDescriptorTemplate));
}

export function getValidatorSignedByUserKey(): DescriptorValidationPolicy {
  return {
    name: 'signedByUser',
    validate(d: Descriptor, walletKeys: KeyTriple, signatures: string[]): boolean {
      // the first key is the user key, by convention
      return hasValidSignature(d, walletKeys[0], signatures);
    },
  };
}

export class DescriptorPolicyValidationError extends Error {
  constructor(descriptor: Descriptor, policy: DescriptorValidationPolicy) {
    super(`Descriptor ${descriptor.toString()} does not match policy ${policy.name}`);
  }
}

export function assertDescriptorPolicy(
  descriptor: Descriptor,
  policy: DescriptorValidationPolicy,
  walletKeys: KeyTriple,
  signatures: string[]
): void {
  if (!policy.validate(descriptor, walletKeys, signatures)) {
    throw new DescriptorPolicyValidationError(descriptor, policy);
  }
}

export function toDescriptorMapValidate(
  descriptors: NamedDescriptor[],
  walletKeys: KeyTriple,
  policy: DescriptorValidationPolicy
): DescriptorMap {
  return toDescriptorMap(
    descriptors.map((namedDescriptor) => {
      const d = Descriptor.fromString(namedDescriptor.value, 'derivable');
      assertDescriptorPolicy(d, policy, walletKeys, namedDescriptor.signatures ?? []);
      return { name: namedDescriptor.name, value: d };
    })
  );
}

export function getPolicyForEnv(env: EnvironmentName): DescriptorValidationPolicy {
  switch (env) {
    case 'adminProd':
    case 'prod':
      return getValidatorSome([
        // allow all 2-of-3-ish descriptors where the keys match the wallet keys
        getValidatorOneOfTemplates(['Wsh2Of3', 'Wsh2Of3CltvDrop', 'ShWsh2Of3CltvDrop']),
        // allow all descriptors signed by the user key
        getValidatorSignedByUserKey(),
      ]);
    default:
      return policyAllowAll;
  }
}
