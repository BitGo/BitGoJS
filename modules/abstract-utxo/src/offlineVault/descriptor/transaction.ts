import * as t from 'io-ts';
import { bip32, Psbt } from '@bitgo/wasm-utxo';

import { DescriptorMap, NamedDescriptor } from '../../descriptor';
import { OfflineVaultSignable, toKeyTriple } from '../OfflineVaultSignable';
import {
  getValidatorOneOfTemplates,
  getValidatorPox5Wallet,
  getValidatorSignedByUserKey,
  getValidatorSome,
  toDescriptorMapValidate,
} from '../../descriptor/validatePolicy';
import { explainPsbt, signPsbt } from '../../transaction/descriptor';
import { TransactionExplanation } from '../TransactionExplanation';
import { UtxoCoinName } from '../../names';
import { assertPox5SpendPolicy } from '../../descriptor/pox5SpendPolicy';

export const DescriptorTransaction = t.intersection(
  [OfflineVaultSignable, t.type({ descriptors: t.array(NamedDescriptor) })],
  'DescriptorTransaction'
);

export type DescriptorTransaction = t.TypeOf<typeof DescriptorTransaction>;

export function getDescriptorsFromDescriptorTransaction(tx: DescriptorTransaction): DescriptorMap {
  const { descriptors, xpubsWithDerivationPath } = tx;
  const pubkeys = toKeyTriple(xpubsWithDerivationPath);
  const policy = getValidatorSome([
    // allow all 2-of-3-ish descriptors where the keys match the wallet keys
    getValidatorOneOfTemplates(['Wsh2Of3', 'Wsh2Of3CltvDrop', 'ShWsh2Of3CltvDrop']),
    // allow 2-of-3 wallet descriptors together with PoX-5 lockup descriptors where the keys match the wallet keys
    getValidatorPox5Wallet(),
    // allow all descriptors signed by the user key
    getValidatorSignedByUserKey(),
  ]);
  return toDescriptorMapValidate(descriptors, pubkeys, policy);
}

export function getHalfSignedPsbt(tx: DescriptorTransaction, prv: bip32.BIP32Interface, coinName: UtxoCoinName): Psbt {
  const psbt = Psbt.deserialize(Buffer.from(tx.coinSpecific.txHex, 'hex'));
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  assertPox5SpendPolicy(psbt, descriptorMap);
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
    locktime: psbt.lockTime(),
    fee: {
      /* network fee */
      fee,
      /* TODO */
      payGoFeeString: undefined,
      payGoFeeAddress: undefined,
    },
  };
}
