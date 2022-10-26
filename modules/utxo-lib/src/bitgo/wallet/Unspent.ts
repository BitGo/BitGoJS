import { Network } from '../..';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import { createOutputScript2of3, createSpendScriptP2tr, scriptTypeForChain } from '../outputScripts';
import { toOutputScript } from '../../address';
import { signInput2Of3, verifySignatureWithPublicKeys } from '../signature';
import { WalletUnspentSigner } from './WalletUnspentSigner';
import { KeyName, RootWalletKeys } from './WalletKeys';
import { UtxoTransaction } from '../UtxoTransaction';
import { Triple } from '../types';
import { toOutput, UnspentWithPrevTx, Unspent, isUnspentWithPrevTx, toPrevOutput } from '../Unspent';
import { ChainCode, isSegwit } from './chains';
import { UtxoPsbt } from '../UtxoPsbt';

export interface WalletUnspent<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  chain: ChainCode;
  index: number;
}

export interface NonWitnessWalletUnspent<TNumber extends number | bigint = number>
  extends UnspentWithPrevTx<TNumber>,
    WalletUnspent<TNumber> {}

export function isWalletUnspent<TNumber extends number | bigint>(u: Unspent<TNumber>): u is WalletUnspent<TNumber> {
  return (u as WalletUnspent<TNumber>).chain !== undefined;
}

export function signInputWithUnspent<TNumber extends number | bigint>(
  txBuilder: UtxoTransactionBuilder<TNumber>,
  inputIndex: number,
  unspent: WalletUnspent<TNumber>,
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
  signInput2Of3<TNumber>(
    txBuilder,
    inputIndex,
    scriptType,
    walletKeys.publicKeys,
    signer,
    cosigner.publicKey,
    unspent.value
  );
}

/**
 * @param tx
 * @param inputIndex
 * @param unspents
 * @param walletKeys
 * @return triple of booleans indicating a valid signature for each pubkey
 */
export function verifySignatureWithUnspent<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  inputIndex: number,
  unspents: Unspent<TNumber>[],
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
export interface WalletUnspentLegacy<TNumber extends number | bigint = number> extends WalletUnspent<TNumber> {
  /** @deprecated - obviated by signWithUnspent */
  redeemScript?: string;
  /** @deprecated - obviated by verifyWithUnspent */
  witnessScript?: string;
}

export function addToPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  u: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName,
  network: Network
): void {
  const { txid, vout, script, value } = toPrevOutput(u, network);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(u.chain, u.index);
  const scriptType = scriptTypeForChain(u.chain);
  psbt.addInput({
    hash: txid,
    index: vout,
    witnessUtxo: {
      script,
      value,
    },
  });
  const inputIndex = psbt.inputCount - 1;
  if (!isSegwit(u.chain)) {
    if (!isUnspentWithPrevTx(u)) {
      throw new Error('Error, require previous tx to add to PSBT');
    }
    psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
  }

  if (scriptType === 'p2tr') {
    const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2tr(walletKeys.publicKeys, [
      walletKeys[signer].publicKey,
      walletKeys[cosigner].publicKey,
    ]);
    psbt.updateInput(inputIndex, {
      tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      tapBip32Derivation: [signer, cosigner].map((key) => ({
        leafHashes: [leafHash],
        pubkey: walletKeys[key].publicKey.slice(1), // 32-byte x-only
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else {
    const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
    psbt.updateInput(inputIndex, {
      bip32Derivation: [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      })),
    });
    if (witnessScript) {
      psbt.updateInput(inputIndex, { witnessScript });
    }
    if (redeemScript) {
      psbt.updateInput(inputIndex, { redeemScript });
    }
  }
}
