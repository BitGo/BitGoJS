import { Network } from '../..';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { createOutputScript2of3, scriptTypeForChain } from '../outputScripts';
import { toOutputScript } from '../../address';
import { signInput2Of3, verifySignatureWithPublicKeys } from '../signature';
import { WalletUnspentSigner } from './WalletUnspentSigner';
import { RootWalletKeys } from './WalletKeys';
import { UtxoTransaction } from '../UtxoTransaction';
import { Triple } from '../types';
import { toOutput, Unspent } from '../Unspent';
import { ChainCode } from './chains';

export interface WalletUnspent extends Unspent {
  chain: ChainCode;
  index: number;
}

export function isWalletUnspent(u: Unspent): u is WalletUnspent {
  return (u as WalletUnspent).chain !== undefined;
}

export function signInputWithUnspent(
  txBuilder: UtxoTransactionBuilder,
  inputIndex: number,
  unspent: WalletUnspent,
  unspentSigner: WalletUnspentSigner<RootWalletKeys>
): void {
  const { walletKeys, signer, cosigner } = unspentSigner.deriveForChainAndIndex(unspent.chain, unspent.index);
  const scriptType = scriptTypeForChain(unspent.chain);
  const pubScript = createOutputScript2of3(walletKeys.publicKeys, scriptType).scriptPubKey;
  const pubScriptExpected = toOutputScript(unspent.address, txBuilder.network as Network);
  if (!pubScript.equals(pubScriptExpected)) {
    throw new Error(
      `pubscript mismatch: expected ${pubScriptExpected.toString('hex')} got ${pubScript.toString('hex')}`
    );
  }
  signInput2Of3(txBuilder, inputIndex, scriptType, walletKeys.publicKeys, signer, cosigner.publicKey, unspent.value);
}

/**
 * @param tx
 * @param inputIndex
 * @param unspents
 * @param walletKeys
 * @return triple of booleans indicating a valid signature for each pubkey
 */
export function verifySignatureWithUnspent(
  tx: UtxoTransaction,
  inputIndex: number,
  unspents: Unspent[],
  walletKeys: RootWalletKeys
): Triple<boolean> {
  if (tx.ins.length !== unspents.length) {
    throw new Error(`input length must match unspents length`);
  }
  const unspent = unspents[inputIndex];
  if (!isWalletUnspent(unspent)) {
    return [false, false, false];
  }
  return verifySignatureWithPublicKeys(
    tx,
    inputIndex,
    unspents.map((u) => toOutput(u, tx.network)),
    walletKeys.deriveForChainAndIndex(unspent.chain, unspent.index).publicKeys
  ) as Triple<boolean>;
}

/**
 * @deprecated
 * Used in certain legacy signing methods that do not derive signing data from index/chain
 */
export interface WalletUnspentLegacy extends WalletUnspent {
  /** @deprecated - obviated by signWithUnspent */
  redeemScript?: string;
  /** @deprecated - obviated by verifyWithUnspent */
  witnessScript?: string;
}
