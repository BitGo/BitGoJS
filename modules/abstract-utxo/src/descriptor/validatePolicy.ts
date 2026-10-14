import { EnvironmentName, Triple } from '@bitgo/sdk-core';
import { pox5 } from '@bitgo/utxo-descriptors';
import { BIP32, bip32, descriptorWallet } from '@bitgo/wasm-utxo';

import { parseDescriptor } from './builder';
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

function tryParseDescriptor(descriptor: NamedDescriptorNative['value']) {
  try {
    return parseDescriptor(descriptor);
  } catch {
    // probing a template is fallible: a descriptor that cannot be parsed is
    // simply not a match so that `some(...)` falls through to the next validator
    return undefined;
  }
}

function matchesDescriptorTemplate(
  descriptor: NamedDescriptorNative['value'],
  name: string,
  walletKeys: KeyTriple
): boolean {
  const parsed = tryParseDescriptor(descriptor);
  return (
    parsed !== undefined &&
    parsed.name === name &&
    parsed.keys.length === walletKeys.length &&
    parsed.keys.every((k, i) => k.toBase58() === walletKeys[i].neutered().toBase58())
  );
}

export function getValidatorDescriptorTemplate(name: string): DescriptorValidationPolicy {
  return {
    name: 'descriptorTemplate(' + name + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      return arr.every((d) => matchesDescriptorTemplate(d.value, name, walletKeys));
    },
  };
}

function tryParsePox5Lockup(descriptor: NamedDescriptorNative['value']): pox5.Pox5DescriptorInfo | undefined {
  try {
    return pox5.parsePox5LockupDescriptor(descriptor);
  } catch {
    // malformed lockups are not canonical PoX-5 descriptors
    return undefined;
  }
}

function hasPox5WalletStakerKeys(info: pox5.Pox5DescriptorInfo, walletKeys: KeyTriple): boolean {
  return (
    info.stakerKeyStrings.length === walletKeys.length &&
    info.stakerKeyStrings.every((keyString, i) => {
      // staker keys are `<xpub>/<path>` entries; the wallet key identity is the xpub root
      const [xpub] = keyString.split('/');
      try {
        return BIP32.fromBase58(xpub).toBase58() === walletKeys[i].neutered().toBase58();
      } catch {
        // raw pubkey staker keys cannot be matched against the wallet key triple
        return false;
      }
    })
  );
}

/**
 * Accepts PoX-5 staking descriptor groups: at least one canonical PoX-5 lockup
 * descriptor whose staker keys match the wallet key triple, with every remaining
 * descriptor matching one of `templateNames` (e.g. the wallet's external and
 * internal descriptors).
 */
export function getValidatorPox5Lockup(templateNames: string[]): DescriptorValidationPolicy {
  const templatesPolicy = getValidatorOneOfTemplates(templateNames);
  return {
    name: 'pox5Lockup(' + templateNames.join(',') + ')',
    validate(arr: NamedDescriptorNative[], walletKeys: KeyTriple): boolean {
      const rest: NamedDescriptorNative[] = [];
      let lockupCount = 0;
      for (const d of arr) {
        const info = tryParsePox5Lockup(d.value);
        if (info === undefined) {
          rest.push(d);
          continue;
        }
        lockupCount++;
        if (!hasPox5WalletStakerKeys(info, walletKeys)) {
          return false;
        }
      }
      return lockupCount > 0 && templatesPolicy.validate(rest, walletKeys);
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
        // allow PoX-5 staking groups: canonical lockup descriptors with wallet
        // staker keys alongside the wallet's regular descriptors
        getValidatorPox5Lockup(['Wsh2Of3', 'Wsh2Of3CltvDrop', 'SbtcDeposit']),
        // allow all descriptors signed by the user key
        getValidatorSignedByUserKey(),
      ]);
    default:
      return policyAllowAll;
  }
}
