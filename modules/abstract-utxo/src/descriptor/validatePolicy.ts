import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import { pox5 } from '@bitgo/utxo-descriptors';
import { bip32, Descriptor, descriptorWallet } from '@bitgo/wasm-utxo';

import { DescriptorBuilder, parseDescriptor } from './builder';
import { hasValidSignature, NamedDescriptor, NamedDescriptorNative, toNamedDescriptorNative } from './NamedDescriptor';

import type { DescriptorMap } from './index';

export type KeyTriple = Triple<bip32.BIP32Interface>;

export interface DescriptorValidationPolicy {
  name: string;

  validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean;
}

export const policyAllowAll: DescriptorValidationPolicy = {
  name: 'allowAll',
  validate: () => true,
};

function tryParseDescriptor(descriptor: Descriptor): DescriptorBuilder | undefined {
  try {
    return parseDescriptor(descriptor);
  } catch {
    // not a descriptor we know how to parse: it cannot match any template
    return undefined;
  }
}

export function getValidatorDescriptorTemplate(name: string): DescriptorValidationPolicy {
  return {
    name: 'descriptorTemplate(' + name + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return arr.every((d) => {
        const parsed = tryParseDescriptor(d.value);
        return (
          parsed !== undefined &&
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

function isCanonicalPox5Lockup(descriptor: Descriptor, walletKeys: KeyTriple): boolean {
  try {
    const info = pox5.parsePox5LockupDescriptor(descriptor);
    if (!info) {
      return false;
    }
    // Rebuilding the canonical descriptor from the wallet keys checks both that the
    // staker keys are the wallet keys (with the `/*` derivation) and that the
    // descriptor has no non-canonical encoding.
    const canonical = pox5.createPox5LockupDescriptor({
      unlockHeight: info.unlockHeight,
      stakerCommitment: info.stakerCommitment,
      earlyExitKey: info.earlyExitKey,
      stakerKeys: [walletKeys[0], walletKeys[1], walletKeys[2]],
    });
    return canonical.toString() === descriptor.toString();
  } catch {
    // malformed lockup parameters
    return false;
  }
}

/**
 * Accepts descriptors that are canonical PoX-5 lockup descriptors whose staker keys
 * are the wallet keys.
 */
export function getValidatorPox5Lockup(): DescriptorValidationPolicy {
  return {
    name: 'pox5Lockup',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return arr.every((d) => isCanonicalPox5Lockup(d.value, walletKeys));
    },
  };
}

/**
 * Accepts descriptor groups where each descriptor individually satisfies at least one of
 * the validators. Unlike `getValidatorSome`, different descriptors may match different validators.
 */
export function getValidatorEachOneOf(validators: DescriptorValidationPolicy[]): DescriptorValidationPolicy {
  return {
    name: 'eachOneOf(' + validators.map((v) => v.name).join(',') + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return arr.every((d) => validators.some((v) => v.validate([d], walletKeys)));
    },
  };
}

/**
 * Accepts the descriptors of a PoX-5 staking wallet: the regular 2-of-3 wallet descriptors
 * together with PoX-5 lockup descriptors, all using the wallet keys.
 */
export function getValidatorPox5Wallet(): DescriptorValidationPolicy {
  return getValidatorEachOneOf([getValidatorDescriptorTemplate('Wsh2Of3'), getValidatorPox5Lockup()]);
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
  return descriptorWallet.toDescriptorMap(namedDescriptorsNative);
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
        // allow sBTC peg-in deposit descriptors where the reclaim keys match the wallet keys
        getValidatorDescriptorTemplate('SbtcDeposit'),
        // allow 2-of-3 wallet descriptors together with PoX-5 lockup descriptors (stacks staking)
        getValidatorPox5Wallet(),
        // allow all descriptors signed by the user key
        getValidatorSignedByUserKey(),
      ]);
    default:
      return policyAllowAll;
  }
}
