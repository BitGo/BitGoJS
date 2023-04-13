import { getMainnet, Network, networks } from '../..';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import {
  createKeyPathP2trMusig2,
  createOutputScript2of3,
  createSpendScriptP2tr,
  createSpendScriptP2trMusig2,
  scriptTypeForChain,
  toXOnlyPublicKey,
} from '../outputScripts';
import { toOutputScript } from '../../address';
import { signInput2Of3, verifySignatureWithPublicKeys } from '../signature';
import { WalletUnspentSigner } from './WalletUnspentSigner';
import { KeyName, RootWalletKeys } from './WalletKeys';
import { UtxoTransaction } from '../UtxoTransaction';
import { Triple } from '../types';
import { toOutput, UnspentWithPrevTx, Unspent, isUnspentWithPrevTx, toPrevOutput } from '../Unspent';
import { ChainCode, isSegwit } from './chains';
import { UtxoPsbt } from '../UtxoPsbt';
import { encodePsbtMusig2Participants, sortMusig2ParticipantPubKeys } from '../Musig2';

export interface WalletUnspent<TNumber extends number | bigint = number> extends Unspent<TNumber> {
  chain: ChainCode;
  index: number;
  witnessScript?: string;
  valueString?: string;
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

export function addReplayProtectionUnspentToPsbt(
  psbt: UtxoPsbt,
  u: Unspent<bigint>,
  redeemScript: Buffer,
  /**
   * @deprecated
   */
  network: Network = psbt.network
): void {
  if (network !== psbt.network) {
    throw new Error(`network parameter does not match psbt.network`);
  }
  const { txid, vout } = toPrevOutput(u, psbt.network);
  const isZcash = getMainnet(psbt.network) === networks.zcash;

  // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
  // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
  // segwit transactions
  if (!isUnspentWithPrevTx(u) && !isZcash) {
    throw new Error('Error, require previous tx to add to PSBT');
  }
  psbt.addInput({
    hash: txid,
    index: vout,
    redeemScript,
  });
  if (!isZcash) {
    psbt.updateInput(vout, { nonWitnessUtxo: (u as UnspentWithPrevTx<bigint>).prevTx });
  }
}

export function addWalletUnspentToPsbt(
  psbt: UtxoPsbt,
  u: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName,
  /**
   * @deprecated
   */
  network: Network = psbt.network
): void {
  if (network !== psbt.network) {
    throw new Error(`network parameter does not match psbt.network`);
  }
  const { txid, vout, script, value } = toPrevOutput(u, psbt.network);
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
  // Because Zcash directly hashes the value for non-segwit transactions, we do not need to check indirectly
  // with the previous transaction. Therefore, we can treat Zcash non-segwit transactions as Bitcoin
  // segwit transactions
  if (!isSegwit(u.chain) && getMainnet(psbt.network) !== networks.zcash) {
    if (!isUnspentWithPrevTx(u)) {
      throw new Error('Error, require previous tx to add to PSBT');
    }
    psbt.updateInput(inputIndex, { nonWitnessUtxo: u.prevTx });
  }

  const isBackupFlow = signer === 'backup' || cosigner === 'backup';

  if (scriptType === 'p2tr' || (scriptType === 'p2trMusig2' && isBackupFlow)) {
    const createSpendScriptP2trFn = scriptType === 'p2tr' ? createSpendScriptP2tr : createSpendScriptP2trMusig2;
    const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2trFn(walletKeys.publicKeys, [
      walletKeys[signer].publicKey,
      walletKeys[cosigner].publicKey,
    ]);
    psbt.updateInput(inputIndex, {
      tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      tapBip32Derivation: [signer, cosigner].map((key) => ({
        leafHashes: [leafHash],
        pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], u.chain, u.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else if (scriptType === 'p2trMusig2') {
    const {
      internalPubkey: tapInternalKey,
      outputPubkey: tapOutputKey,
      taptreeRoot,
    } = createKeyPathP2trMusig2(walletKeys.publicKeys);
    const participantPubKeys = sortMusig2ParticipantPubKeys([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
    const participantsKeyValData = encodePsbtMusig2Participants({
      tapOutputKey,
      tapInternalKey,
      participantPubKeys: [participantPubKeys[0], participantPubKeys[1]],
    });
    psbt.addProprietaryKeyValToInput(inputIndex, participantsKeyValData);
    psbt.updateInput(inputIndex, {
      tapInternalKey: tapInternalKey,
      tapMerkleRoot: taptreeRoot,
      tapBip32Derivation: [signer, cosigner].map((key) => ({
        leafHashes: [],
        pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
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
