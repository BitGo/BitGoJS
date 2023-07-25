import * as assert from 'assert';

import { ScriptType, ScriptType2Of3, scriptTypeP2shP2pk, scriptTypes2Of3 } from '../bitgo/outputScripts';
import {
  getExternalChainCode,
  isWalletUnspent,
  KeyName,
  getInternalChainCode,
  RootWalletKeys,
  Unspent,
  UtxoTransactionBuilder,
  createTransactionBuilderForNetwork,
  addToTransactionBuilder,
  getWalletAddress,
  signInputP2shP2pk,
  signInputWithUnspent,
  WalletUnspentSigner,
} from '../bitgo';
import { Network } from '../networks';
import { mockReplayProtectionUnspent, mockWalletUnspent } from './mock';

/**
 * input script type and value.
 */
export type TxnInputScriptType = Exclude<ScriptType, 'p2trMusig2'>;
export type TxnOutputScriptType = ScriptType2Of3;

/**
 * output script type and value
 */
export interface TxnInput<TNumber extends number | bigint> {
  scriptType: TxnInputScriptType;
  value: TNumber;
}

/**
 * should set either address or scriptType, never both.
 * set isInternalAddress=true for internal output address
 */
export interface TxnOutput<TNumber extends number | bigint> {
  address?: string;
  scriptType?: TxnOutputScriptType;
  value: TNumber;
  isInternalAddress?: boolean;
}

/**
 * array of supported input script types.
 */
export const txnInputScriptTypes = ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', scriptTypeP2shP2pk] as const;

/**
 * array of supported output script types.
 */
export const txnOutputScriptTypes = scriptTypes2Of3;

/**
 * create unspent object from input script type, index, network and root wallet key.
 */
export function toTxnUnspent<TNumber extends number | bigint>(
  input: TxnInput<TNumber>,
  index: number,
  network: Network,
  rootWalletKeys: RootWalletKeys
): Unspent<TNumber> {
  if (input.scriptType === 'p2shP2pk') {
    return mockReplayProtectionUnspent<TNumber>(network, input.value, { key: rootWalletKeys['user'], vout: index });
  } else {
    return mockWalletUnspent<TNumber>(network, input.value, {
      chain: getInternalChainCode(input.scriptType),
      vout: index,
      keys: rootWalletKeys,
      index,
    });
  }
}

/**
 * returns signer and cosigner names for TxnInputScriptType.
 * user and undefined as signer and cosigner respectively for p2shP2pk.
 * user and bitgo as signer and cosigner respectively for other input script types.
 */
export function getTxnSigners(inputType: TxnInputScriptType): { signerName: KeyName; cosignerName?: KeyName } {
  return {
    signerName: 'user',
    cosignerName: inputType === 'p2shP2pk' ? undefined : 'bitgo',
  };
}

/**
 * signs with first or second signature for single input.
 * p2shP2pk is signed only with first sign.
 */
export function signTxnInput<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
  input: TxnInput<TNumber>,
  inputIndex: number,
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned',
  signers?: { signerName: KeyName; cosignerName?: KeyName }
): void {
  const { signerName, cosignerName } = signers ? signers : getTxnSigners(input.scriptType);
  const unspent = toTxnUnspent(input, inputIndex, txb.network, rootWalletKeys);
  if (sign === 'halfsigned') {
    if (input.scriptType === 'p2shP2pk') {
      signInputP2shP2pk(txb, inputIndex, rootWalletKeys[signerName]);
    } else if (isWalletUnspent(unspent) && cosignerName) {
      signInputWithUnspent(
        txb,
        inputIndex,
        unspent,
        WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signerName], rootWalletKeys[cosignerName])
      );
    }
  }
  if (isWalletUnspent(unspent) && sign === 'fullsigned' && cosignerName) {
    signInputWithUnspent(
      txb,
      inputIndex,
      unspent,
      WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[cosignerName], rootWalletKeys[signerName])
    );
  }
}

/**
 * signs with first or second signature for all inputs.
 * p2shP2pk is signed only with first sign.
 */
export function signAllTxnInputs<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber>,
  inputs: TxnInput<TNumber>[],
  rootWalletKeys: RootWalletKeys,
  sign: 'halfsigned' | 'fullsigned',
  signers?: { signerName: KeyName; cosignerName?: KeyName }
): void {
  inputs.forEach((input, index) => {
    signTxnInput(txb, input, index, rootWalletKeys, sign, signers);
  });
}

/**
 * construct transaction for given inputs, outputs, network and root wallet keys.
 */
export function constructTxnBuilder<TNumber extends number | bigint>(
  inputs: TxnInput<TNumber>[],
  outputs: TxnOutput<TNumber>[],
  network: Network,
  rootWalletKeys: RootWalletKeys,
  sign: 'unsigned' | 'halfsigned' | 'fullsigned',
  signers?: { signerName: KeyName; cosignerName?: KeyName }
): UtxoTransactionBuilder<TNumber> {
  const totalInputAmount = inputs.reduce((sum, input) => sum + BigInt(input.value), BigInt(0));
  const outputInputAmount = outputs.reduce((sum, output) => sum + BigInt(output.value), BigInt(0));
  assert(totalInputAmount >= outputInputAmount, 'total output can not exceed total input');
  assert(
    !outputs.some((o) => (o.scriptType && o.address) || (!o.scriptType && !o.address)),
    'only either output script type or address should be provided'
  );

  const txb = createTransactionBuilderForNetwork<TNumber>(network);

  const unspents = inputs.map((input, i) => toTxnUnspent(input, i, network, rootWalletKeys));

  unspents.forEach((u, i) => {
    addToTransactionBuilder(txb, u);
  });

  outputs.forEach((output, i) => {
    const address = output.scriptType
      ? getWalletAddress(
          rootWalletKeys,
          output.isInternalAddress ? getInternalChainCode(output.scriptType) : getExternalChainCode(output.scriptType),
          i,
          network
        )
      : output.address;
    if (!address) {
      throw new Error('address is missing');
    }
    txb.addOutput(address, output.value);
  });

  if (sign === 'unsigned') {
    return txb;
  }

  signAllTxnInputs(txb, inputs, rootWalletKeys, 'halfsigned', signers);

  if (sign === 'fullsigned') {
    signAllTxnInputs(txb, inputs, rootWalletKeys, sign, signers);
  }

  return txb;
}
