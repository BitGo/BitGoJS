import { Network } from '../..';
import { UtxoTransactionBuilder } from '../UtxoTransactionBuilder';
import {
  createOutputScript2of3,
  createSpendScriptP2tr,
  getLeafHash,
  parseTaprootScript2of3PubKeys,
  scriptTypeForChain,
  toXOnlyPublicKey,
} from '../outputScripts';
import { toOutputScript } from '../../address';
import { signInput2Of3, verifySignatureWithPublicKeys } from '../signature';
import { WalletUnspentSigner } from './WalletUnspentSigner';
import { indexToKeyName, KeyName, RootWalletKeys } from './WalletKeys';
import { UtxoTransaction } from '../UtxoTransaction';
import { Triple } from '../types';
import {
  toOutput,
  UnspentWithPrevTx,
  Unspent,
  isUnspentWithPrevTx,
  toPrevOutput,
  toPrevOutputWithPrevTx,
} from '../Unspent';
import { ChainCode, isSegwit } from './chains';
import { UtxoPsbt } from '../UtxoPsbt';
import { checkForInput } from 'bip174/src/lib/utils';
import { createPsbtFromTransaction } from '../transaction';
import { BIP32Interface } from 'bip32';

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

export function addWalletUnspentToPsbt(
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

/**
 * @return true iff the PSBT input at inputIndex is not signed.
 */
export function isPsbtInputUnsigned(psbt: UtxoPsbt<UtxoTransaction<bigint>>, inputIndex: number): boolean {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  return (
    (!Array.isArray(input.partialSig) || input.partialSig.length === 0) &&
    (!Array.isArray(input.tapScriptSig) || input.tapScriptSig.length === 0)
  );
}

function parseKeyNames(script: Buffer, walletPublicKeys: Buffer[]): [KeyName, KeyName] {
  const publicKeys = parseTaprootScript2of3PubKeys(script);
  const parsedKeyNames = publicKeys.map((publicKey) => {
    const i = walletPublicKeys.findIndex((walletPublicKey) => toXOnlyPublicKey(walletPublicKey).equals(publicKey));
    return indexToKeyName(i);
  });

  if (parsedKeyNames.length < 2) {
    throw new Error(`P2tr public keys does not match with wallet keys.`);
  }

  return [parsedKeyNames[0], parsedKeyNames[1]];
}

function updateWalletUnspentToPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  inputIndex: number,
  unspent: WalletUnspent<bigint>,
  rootWalletKeys?: RootWalletKeys,
  keyNames?: { signer: KeyName; cosigner: KeyName },
  metadataRequired?: boolean
): void {
  const isUnsignedInput = isPsbtInputUnsigned(psbt, inputIndex);
  if (isUnsignedInput && !metadataRequired) {
    // Received unsigned PSBT without keyNames input, but it's okay to skip most of the metadata.
    // Example use case: WP toPSBT() for parseTransaction
    return;
  }
  if (isUnsignedInput && metadataRequired && !keyNames) {
    throw new Error('keyNames are required for unsigned PSBT when metadataRequired is true');
  }
  if (!rootWalletKeys) {
    throw new Error(
      'rootWalletKeys is required for unsigned tx with metadataRequired=true and partially/fully signed tx'
    );
  }

  const scriptType = scriptTypeForChain(unspent.chain);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);

  if (scriptType === 'p2tr') {
    let signer: KeyName, cosigner: KeyName;
    let leafHashP2tr: Buffer;
    if (isUnsignedInput && keyNames) {
      // Received unsigned PSBT but all metadata should be added. metadataRequired is true
      // Example use case: WP signTxLocal
      signer = keyNames.signer;
      cosigner = keyNames.cosigner;
      const { controlBlock, witnessScript, leafVersion, leafHash } = createSpendScriptP2tr(walletKeys.publicKeys, [
        walletKeys[signer].publicKey,
        walletKeys[cosigner].publicKey,
      ]);
      psbt.updateInput(inputIndex, {
        tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
      });

      leafHashP2tr = leafHash;
    } else {
      const input = psbt.data.inputs[inputIndex];
      // Partially/fully signed PSBT, so only tapBip32Derivation should be added.
      // Other metadata are already added by createPsbtFromTransaction.
      // Example use case: WP toPSBT for parseTransaction
      if (!Array.isArray(input.tapLeafScript) || input.tapLeafScript.length === 0) {
        throw new Error(`Invalid PSBT state. Missing required fields.`);
      }

      if (input.tapLeafScript.length > 1) {
        throw new Error(`Bitgo only supports a single tap leaf script per input`);
      }

      const parsedKeyNames = parseKeyNames(input.tapLeafScript[0].script, walletKeys.publicKeys);

      signer = parsedKeyNames[0];
      cosigner = parsedKeyNames[1];

      leafHashP2tr = getLeafHash({
        publicKeys: walletKeys.publicKeys,
        signer: walletKeys[signer].publicKey,
        cosigner: walletKeys[cosigner].publicKey,
      });
    }

    psbt.updateInput(inputIndex, {
      tapBip32Derivation: [signer, cosigner].map((key) => ({
        leafHashes: [leafHashP2tr],
        pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], unspent.chain, unspent.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else {
    if (isUnsignedInput && keyNames) {
      // Received unsigned PSBT but all metadata should be added. metadataRequired is true
      // Example use case: WP signTxLocal
      const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
      if (witnessScript) {
        psbt.updateInput(inputIndex, { witnessScript });
      }
      if (redeemScript) {
        psbt.updateInput(inputIndex, { redeemScript });
      }
    }

    psbt.updateInput(inputIndex, {
      bip32Derivation: [0, 1, 2].map((idx) => ({
        pubkey: walletKeys.triple[idx].publicKey,
        path: walletKeys.paths[idx],
        masterFingerprint: rootWalletKeys.triple[idx].fingerprint,
      })),
    });
  }
}

/**
 * @param tx unsigned/halfsigned/fullysigned transaction to be coverted to PSBT
 * @param unspents array of WalletUnspents containing required details to populate PSBT metadata
 * @param rootWalletKeys root wallet keys, optional only for input unsigned tx and metadataRequired=false
 * @param keyNames signer and cosigner names. Required for input unsigned Tx and metadataRequired=false
 * @param metadataRequired true for mandating addition of PSBT metadata for unsigned tx input.
 * @return PSBT filled with metatdata as per input params
 */
export function createPsbtFromTransactionWithWalletUnspents(
  tx: UtxoTransaction<bigint>,
  unspents: WalletUnspent<bigint>[],
  rootWalletKeys?: RootWalletKeys,
  keyNames?: { signer: KeyName; cosigner: KeyName },
  metadataRequired?: boolean
): UtxoPsbt<UtxoTransaction<bigint>> {
  const prevOutputs = unspents.map((u) => toPrevOutputWithPrevTx(u, tx.network));
  const psbt = createPsbtFromTransaction(tx, prevOutputs);
  unspents.forEach((u, i) => {
    if (isWalletUnspent(u) && u.index !== undefined) {
      updateWalletUnspentToPsbt(psbt, i, u, rootWalletKeys, keyNames, metadataRequired);
    }
  });
  return psbt;
}

/**
 * @param psbt
 * @param inputIndex
 * @param signer
 * @param unspent
 * @return signed PSBT with signer's key for unspent
 */
export function signPsbtInputWithWalletUnspent(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  inputIndex: number,
  signer: BIP32Interface,
  unspent: WalletUnspent<bigint>
): void {
  if (scriptTypeForChain(unspent.chain) === 'p2tr') {
    psbt.signTaprootInputHD(inputIndex, signer);
  } else {
    psbt.signInputHD(inputIndex, signer);
  }
}
