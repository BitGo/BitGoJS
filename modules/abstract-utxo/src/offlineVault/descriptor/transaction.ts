import * as utxolib from '@bitgo/utxo-lib';
import * as t from 'io-ts';

import { NamedDescriptor } from '../../descriptor';
import { OfflineVaultSignable, toKeyTriple } from '../OfflineVaultSignable';
import {
  getValidatorOneOfTemplates,
  getValidatorSignedByUserKey,
  getValidatorSome,
  toDescriptorMapValidate,
} from '../../descriptor/validatePolicy';
import { DescriptorMap } from '../../core/descriptor';
import { explainPsbt, signPsbt } from '../../transaction/descriptor';
import { TransactionExplanation } from '../TransactionExplanation';

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
    // allow all descriptors signed by the user key
    getValidatorSignedByUserKey(),
  ]);
  return toDescriptorMapValidate(descriptors, pubkeys, policy);
}

export function getHalfSignedPsbt(
  tx: DescriptorTransaction,
  prv: utxolib.BIP32Interface,
  network: utxolib.Network
): utxolib.Psbt {
  const psbt = utxolib.bitgo.createPsbtDecode(tx.coinSpecific.txHex, network);
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  signPsbt(psbt, descriptorMap, prv, { onUnknownInput: 'throw' });
  return psbt;
}

export function getTransactionExplanationFromPsbt(
  tx: DescriptorTransaction,
  network: utxolib.Network
): TransactionExplanation {
  const psbt = utxolib.bitgo.createPsbtDecode(tx.coinSpecific.txHex, network);
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  const { outputs, changeOutputs, fee } = explainPsbt(psbt, descriptorMap);
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
  };
}
