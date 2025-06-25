import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { DescriptorMap, toDescriptorMap } from '@bitgo/utxo-core/descriptor';

import { parseDescriptor } from './builder';
import { hasValidSignature, NamedDescriptor, NamedDescriptorNative, toNamedDescriptorNative } from './NamedDescriptor';

export type KeyTriple = Triple<utxolib.BIP32Interface>;

export interface DescriptorValidationPolicy {
  name: string;

  validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean | Promise<boolean>;
}

export const policyAllowAll: DescriptorValidationPolicy = {
  name: 'allowAll',
  validate: () => true,
};

export function getValidatorDescriptorTemplate(name: string): DescriptorValidationPolicy {
  return {
    name: 'descriptorTemplate(' + name + ')',
    async validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): Promise<boolean> {
      for (const d of arr) {
        const parsed = await parseDescriptor(d.value);
        if (
          parsed.name !== name ||
          parsed.keys.length !== walletKeys.length ||
          !parsed.keys.every((k, i) => k.toBase58() === walletKeys[i].neutered().toBase58())
        ) {
          return false;
        }
      }
      return true;
    },
  };
}

export function getValidatorEvery(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'every(' + validators.map((v) => v.name).join(',') + ')',
    async validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): Promise<boolean> {
      for (const validator of validators) {
        const result = await validator.validate(arr, walletKeys);
        if (!result) {
          return false;
        }
      }
      return true;
    },
  };
}

export function getValidatorSome(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'some(' + validators.map((v) => v.name).join(',') + ')',
    async validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): Promise<boolean> {
      for (const validator of validators) {
        const result = await validator.validate(arr, walletKeys);
        if (result) {
          return true;
        }
      }
      return false;
    },
  };
}

export function getValidatorOneOfTemplates(names: string[]): DescriptorValidationPolicy {
  return getValidatorSome(names.map(getValidatorDescriptorTemplate));
}

export function getValidatorSignedByUserKey(): DescriptorValidationPolicy {
  return {
    name: 'signedByUser',
    async validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): Promise<boolean> {
      // the first key is the user key, by convention
      for (const d of arr) {
        if (!(await hasValidSignature(d.value, walletKeys[0], d.signatures ?? []))) {
          return false;
        }
      }
      return true;
    },
  };
}

export class DescriptorPolicyValidationError extends Error {
  constructor(ds: NamedDescriptorNative[], policy: DescriptorValidationPolicy) {
    super(`Descriptors ${ds.map((d) => d.value.toString())} does not match policy ${policy.name}`);
  }
}

export async function assertDescriptorPolicy(
  descriptors: NamedDescriptorNative[],
  policy: DescriptorValidationPolicy,
  walletKeys: KeyTriple
): Promise<void> {
  if (!(await policy.validate(descriptors, walletKeys))) {
    throw new DescriptorPolicyValidationError(descriptors, policy);
  }
}

export async function toDescriptorMapValidate(
  descriptors: NamedDescriptor[],
  walletKeys: KeyTriple,
  policy: DescriptorValidationPolicy
): Promise<DescriptorMap> {
  const namedDescriptorsNative: NamedDescriptorNative[] = [];
  
  for (const descriptor of descriptors) {
    namedDescriptorsNative.push(await toNamedDescriptorNative(descriptor, 'derivable'));
  }
  
  await assertDescriptorPolicy(namedDescriptorsNative, policy, walletKeys);
  return toDescriptorMap(namedDescriptorsNative);
}

export function getPolicyForEnv(env: EnvironmentName): DescriptorValidationPolicy {
  switch (env) {
    case 'adminProd':
    case 'prod':
      return getValidatorSome([
        // allow 2-of-3-ish descriptor groups where the keys match the wallet keys
        getValidatorDescriptorTemplate('Wsh2Of3'),
        // allow descriptor groups where all keys match the wallet keys plus OP_DROP (coredao staking)
        getValidatorDescriptorTemplate('Wsh2Of3CltvDrop'),
        // allow all descriptors signed by the user key
        getValidatorSignedByUserKey(),
      ]);
    default:
      return policyAllowAll;
  }
}
