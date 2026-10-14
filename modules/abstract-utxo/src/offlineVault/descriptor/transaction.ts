import * as t from 'io-ts';
import { pox5 } from '@bitgo/utxo-descriptors';
import { pox5 as pox5Staking } from '@bitgo/utxo-staking';
import { bip32, Psbt } from '@bitgo/wasm-utxo';

import { DescriptorMap, NamedDescriptor } from '../../descriptor';
import { OfflineVaultSignable, toKeyTriple } from '../OfflineVaultSignable';
import {
  getValidatorOneOfTemplates,
  getValidatorPox5Lockup,
  getValidatorSignedByUserKey,
  getValidatorSome,
  toDescriptorMapValidate,
} from '../../descriptor/validatePolicy';
import { explainPsbt, signPsbt } from '../../transaction/descriptor';
import { TransactionExplanation } from '../TransactionExplanation';
import { UtxoCoinName } from '../../names';

export const DescriptorTransaction = t.intersection(
  [OfflineVaultSignable, t.type({ descriptors: t.array(NamedDescriptor) })],
  'DescriptorTransaction'
);

export type DescriptorTransaction = t.TypeOf<typeof DescriptorTransaction>;

const descriptorTemplates = ['Wsh2Of3', 'Wsh2Of3CltvDrop', 'ShWsh2Of3CltvDrop'];

export function getDescriptorsFromDescriptorTransaction(tx: DescriptorTransaction): DescriptorMap {
  const { descriptors, xpubsWithDerivationPath } = tx;
  const pubkeys = toKeyTriple(xpubsWithDerivationPath);
  const policy = getValidatorSome([
    // allow all 2-of-3-ish descriptors where the keys match the wallet keys
    getValidatorOneOfTemplates(descriptorTemplates),
    // allow PoX-5 staking groups: canonical lockup descriptors with wallet staker
    // keys alongside the wallet's external/internal descriptors
    getValidatorPox5Lockup(descriptorTemplates),
    // allow all descriptors signed by the user key
    getValidatorSignedByUserKey(),
  ]);
  return toDescriptorMapValidate(descriptors, pubkeys, policy);
}

function getPox5InputMatches(psbt: Psbt, descriptorMap: DescriptorMap): pox5.Pox5InputMatch[] {
  const matches: pox5.Pox5InputMatch[] = [];
  for (let vin = 0; vin < psbt.inputCount(); vin++) {
    const match = pox5.matchPox5Input(psbt, vin, descriptorMap);
    if (match) {
      matches.push(match);
    }
  }
  return matches;
}

/**
 * Apply the BitGoJS PoX-5 staking policy (WAL-2022) before half-signing a late
 * exit: the spend must use the post-CLTV branch over exactly one lockup input.
 * Early exits (principal preimage branch) are out of scope for the offline vault.
 */
function assertPox5LateExitSpend(psbt: Psbt, descriptorMap: DescriptorMap): void {
  const matches = getPox5InputMatches(psbt, descriptorMap);
  if (matches.length === 0) {
    return;
  }
  if (matches.length > 1) {
    throw new Error(`PoX-5 late exit must spend exactly one lockup input, found ${matches.length}`);
  }
  const [match] = matches;
  if (pox5Staking.classifyPox5Spend(psbt, match) !== 'locktime') {
    throw new Error('PoX-5 early exit spends are not supported by the offline vault');
  }
  pox5Staking.assertPox5LocktimeSpend(psbt, matches);
}

export function getHalfSignedPsbt(tx: DescriptorTransaction, prv: bip32.BIP32Interface, coinName: UtxoCoinName): Psbt {
  const psbt = Psbt.deserialize(Buffer.from(tx.coinSpecific.txHex, 'hex'));
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  assertPox5LateExitSpend(psbt, descriptorMap);
  signPsbt(psbt, descriptorMap, prv, { onUnknownInput: 'throw' });
  return psbt;
}

export function getTransactionExplanationFromPsbt(
  tx: DescriptorTransaction,
  coinName: UtxoCoinName
): TransactionExplanation<string> {
  const psbt = Psbt.deserialize(Buffer.from(tx.coinSpecific.txHex, 'hex'));
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  const { outputs, changeOutputs, fee } = explainPsbt(psbt, descriptorMap, coinName);
  return {
    outputs,
    changeOutputs,
    fee: {
      /* network fee */
      fee,
      /* TODO */
      payGoFeeString: undefined,
      payGoFeeAddress: undefined,
    },
    locktime: psbt.lockTime(),
  };
}
