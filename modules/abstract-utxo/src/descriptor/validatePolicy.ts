import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { DescriptorMap, toDescriptorMap } from '@bitgo/utxo-core/descriptor';

import { parseDescriptor } from './builder';
import { hasValidSignature, NamedDescriptor, NamedDescriptorNative, toNamedDescriptorNative } from './NamedDescriptor';

export type KeyTriple = Triple<utxolib.BIP32Interface>;

export interface DescriptorValidationPolicy {
  name: string;

  validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean;
}

export const policyAllowAll: DescriptorValidationPolicy = {
  name: 'allowAll',
  validate: () => true,
};

export function getValidatorDescriptorTemplate(name: string): DescriptorValidationPolicy {
  return {
    name: 'descriptorTemplate(' + name + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return arr.every((d) => {
        const parsed = parseDescriptor(d.value);
        return (
          parsed.name === name &&
          parsed.keys.length === walletKeys.length &&
          parsed.keys.every((k, i) => k.toBase58() === walletKeys[i].neutered().toBase58())
        );
      });
    },
  };
}

export function getValidatorEvery(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'every(' + validators.map((v) => v.name).join(',') + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return validators.every((v) => v.validate(arr, walletKeys));
    },
  };
}

export function getValidatorSome(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'some(' + validators.map((v) => v.name).join(',') + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return validators.some((v) => v.validate(arr, walletKeys));
    },
  };
}

export function getValidatorOneOfTemplates(names: string[]): DescriptorValidationPolicy {
  return getValidatorSome(names.map(getValidatorDescriptorTemplate));
}

export function getValidatorSignedByUserKey(): DescriptorValidationPolicy {
  return {
    name: 'signedByUser',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      // the first key is the user key, by convention
      return arr.every((d) => hasValidSignature(d.value, walletKeys[0], d.signatures ?? []));
    },
  };
}

export class DescriptorPolicyValidationError extends Error {
  constructor(ds: NamedDescriptorNative[], policy: DescriptorValidationPolicy) {
    super(`Descriptors ${ds.map((d) => d.value.toString())} does not match policy ${policy.name}`);
  }
}

export function assertDescriptorPolicy(
  descriptors: NamedDescriptorNative[],
  policy: DescriptorValidationPolicy,
  walletKeys: KeyTriple
): void {
  if (!policy.validate(descriptors, walletKeys)) {
    throw new DescriptorPolicyValidationError(descriptors, policy);
  }
}

export function toDescriptorMapValidate(
  descriptors: NamedDescriptor[],
  walletKeys: KeyTriple,
  policy: DescriptorValidationPolicy
): DescriptorMap {
  const namedDescriptorsNative: NamedDescriptorNative[] = descriptors.map((v) =>
    toNamedDescriptorNative(v, 'derivable')
  );
  assertDescriptorPolicy(namedDescriptorsNative, policy, walletKeys);
  return toDescriptorMap(namedDescriptorsNative);
}

export function getPolicyForEnv(env: EnvironmentName): DescriptorValidationPolicy {
  switch (env) {
    case 'adminProd':
    case 'prod':
      return getValidatorSome([
        // allow all 2-of-3-ish descriptors where the keys match the wallet keys
        getValidatorOneOfTemplates(['Wsh2Of3', 'Wsh2Of3CltvDrop']),
        // allow all descriptors signed by the user key
        getValidatorSignedByUserKey(),
      ]);
    default:
      return policyAllowAll;
  }
}
