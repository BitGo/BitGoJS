import * as t from 'io-ts';
import { bip32, Psbt } from '@bitgo/wasm-utxo';

import { DescriptorMap, NamedDescriptor } from '../../descriptor';
import { OfflineVaultSignable, toKeyTriple } from '../OfflineVaultSignable';
import {
  getValidatorOneOfTemplates,
  getValidatorSignedByUserKey,
  getValidatorSome,
  toDescriptorMapValidate,
} from '../../descriptor/validatePolicy';
import { explainPsbt, signPsbt } from '../../transaction/descriptor';
import { TransactionExplanation } from '../TransactionExplanation';
import { UtxoCoinName } from '../../names';
import { toWasmPsbt } from '../../wasmUtil';

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

export function getHalfSignedPsbt(tx: DescriptorTransaction, prv: bip32.BIP32Interface, coinName: UtxoCoinName): Psbt {
  const psbt = toWasmPsbt(Buffer.from(tx.coinSpecific.txHex, 'hex'));
  const descriptorMap = getDescriptorsFromDescriptorTransaction(tx);
  signPsbt(psbt, descriptorMap, prv, { onUnknownInput: 'throw' });
  return psbt;
}

export function getTransactionExplanationFromPsbt(
  tx: DescriptorTransaction,
  coinName: UtxoCoinName
): TransactionExplanation<string> {
  const psbt = toWasmPsbt(Buffer.from(tx.coinSpecific.txHex, 'hex'));
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
  };
}
