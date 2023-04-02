import * as assert from 'assert';
import { UtxoPsbt } from '../UtxoPsbt';
import { UtxoTransaction } from '../UtxoTransaction';
import { createOutputScript2of3, getLeafHash, scriptTypeForChain, toXOnlyPublicKey } from '../outputScripts';
import { DerivedWalletKeys, RootWalletKeys } from './WalletKeys';
import { toPrevOutputWithPrevTx } from '../Unspent';
import { createPsbtFromTransaction } from '../transaction';
import { BIP32Interface } from 'bip32';
import { isWalletUnspent, WalletUnspent } from './Unspent';
import { checkForInput } from 'bip174/src/lib/utils';
import { PartialSig, PsbtInput, TapScriptSig } from 'bip174/src/lib/interfaces';
import {
  getLeafVersion,
  calculateScriptPathLevel,
  isValidControlBock,
  ParsedPubScriptP2ms,
  ParsedPubScriptTaprootScriptPath,
  parsePubScript,
  ParsedPubScriptTaproot,
  ParsedPubScriptTaprootKeyPath,
  ParsedScriptType2Of3,
} from '../parseInput';
import { parsePsbtMusig2PartialSigs } from '../Musig2';
import { isTuple } from '../types';
import { createTaprootOutputScript } from '../../taproot';

export interface Signatures {
  signatures: [Buffer] | [Buffer, Buffer] | undefined;
}

/**
 * To hold parsed signature data for TaprootKeyPathSpend script type.
 * signatures and participantPublicKeys (signer pub keys)
 */
export interface TaprootKeyPathSignatures {
  signatures: [Buffer] | [Buffer, Buffer] | undefined;
  // signer pub keys.
  participantPublicKeys: [Buffer] | [Buffer, Buffer] | undefined;
}

/**
 * To hold parsed psbt data for p2ms based script types - p2sh, p2wsh, and p2shP2wsh
 */
export interface ParsedPsbtP2ms extends ParsedPubScriptP2ms, Signatures {}

/**
 * To hold parsed psbt data for TaprootKeyPathSpend script type.
 */
export interface ParsedPsbtTaprootKeyPath extends ParsedPubScriptTaprootKeyPath, TaprootKeyPathSignatures {}

/**
 * To hold parsed psbt data for TaprootScriptPathSpend script path script type.
 */
export interface ParsedPsbtTaprootScriptPath extends ParsedPubScriptTaprootScriptPath, Signatures {
  controlBlock: Buffer;
  leafVersion: number;
  /** Indicates the level inside the taptree. */
  scriptPathLevel: number;
}

export type ParsedPsbtTaproot = ParsedPsbtTaprootKeyPath | ParsedPsbtTaprootScriptPath;

interface WalletSigner {
  walletKey: BIP32Interface;
  rootKey: BIP32Interface;
}

function getTaprootSigners(script: Buffer, walletKeys: DerivedWalletKeys): [WalletSigner, WalletSigner] {
  const parsedPublicKeys = parsePubScript(script, 'taprootScriptPathSpend').publicKeys;
  const walletSigners = parsedPublicKeys.map((publicKey) => {
    const index = walletKeys.publicKeys.findIndex((walletPublicKey) =>
      toXOnlyPublicKey(walletPublicKey).equals(publicKey)
    );
    if (index >= 0) {
      return { walletKey: walletKeys.triple[index], rootKey: walletKeys.parent.triple[index] };
    }
    throw new Error('Taproot public key is not a wallet public key');
  });
  return [walletSigners[0], walletSigners[1]];
}

function updatePsbtInput(
  psbt: UtxoPsbt,
  inputIndex: number,
  unspent: WalletUnspent<bigint>,
  rootWalletKeys: RootWalletKeys
): void {
  const signatureCount = psbt.getSignatureCount(inputIndex);
  const scriptType = scriptTypeForChain(unspent.chain);
  if (signatureCount === 0 && scriptType === 'p2tr') {
    return;
  }
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);

  if (scriptType === 'p2tr') {
    const input = psbt.data.inputs[inputIndex];

    if (!Array.isArray(input.tapLeafScript) || input.tapLeafScript.length === 0) {
      throw new Error('Invalid PSBT state. Missing required fields.');
    }

    if (input.tapLeafScript.length > 1) {
      throw new Error('Bitgo only supports a single tap leaf script per input');
    }

    const [signer, cosigner] = getTaprootSigners(input.tapLeafScript[0].script, walletKeys);

    const leafHash = getLeafHash({
      publicKeys: walletKeys.publicKeys,
      signer: signer.walletKey.publicKey,
      cosigner: cosigner.walletKey.publicKey,
    });

    psbt.updateInput(inputIndex, {
      tapBip32Derivation: [signer, cosigner].map((walletSigner) => ({
        leafHashes: [leafHash],
        pubkey: toXOnlyPublicKey(walletSigner.walletKey.publicKey),
        path: rootWalletKeys.getDerivationPath(walletSigner.rootKey, unspent.chain, unspent.index),
        masterFingerprint: walletSigner.rootKey.fingerprint,
      })),
    });
  } else {
    if (signatureCount === 0) {
      const { witnessScript, redeemScript } = createOutputScript2of3(walletKeys.publicKeys, scriptType);
      if (witnessScript && psbt.data.inputs[inputIndex].witnessScript === undefined) {
        psbt.updateInput(inputIndex, { witnessScript });
      }
      if (redeemScript && psbt.data.inputs[inputIndex].redeemScript === undefined) {
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
 * @return PSBT filled with metatdata as per input params tx, unspents and rootWalletKeys.
 * Unsigned PSBT for taproot input with witnessUtxo
 * Unsigned PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation
 * Signed PSBT for taproot input with witnessUtxo, tapLeafScript, tapBip32Derivation, tapScriptSig
 * Signed PSBT for other input with witnessUtxo/nonWitnessUtxo, redeemScript/witnessScript, bip32Derivation, partialSig
 */
export function toWalletPsbt(
  tx: UtxoTransaction<bigint>,
  unspents: WalletUnspent<bigint>[],
  rootWalletKeys: RootWalletKeys
): UtxoPsbt {
  const prevOutputs = unspents.map((u) => {
    assert.notStrictEqual(scriptTypeForChain(u.chain), 'p2trMusig2');
    return toPrevOutputWithPrevTx(u, tx.network);
  });
  const psbt = createPsbtFromTransaction(tx, prevOutputs);
  unspents.forEach((u, i) => {
    if (isWalletUnspent(u) && u.index !== undefined) {
      updatePsbtInput(psbt, i, u, rootWalletKeys);
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
export function signWalletPsbt(
  psbt: UtxoPsbt,
  inputIndex: number,
  signer: BIP32Interface,
  unspent: WalletUnspent<bigint>
): void {
  const scriptType = scriptTypeForChain(unspent.chain);
  if (scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
    psbt.signTaprootInputHD(inputIndex, signer);
  } else {
    psbt.signInputHD(inputIndex, signer);
  }
}

function getScriptType(input: PsbtInput): ParsedScriptType2Of3 | undefined {
  let scriptType: ParsedScriptType2Of3 | undefined;
  if (Buffer.isBuffer(input.redeemScript) && Buffer.isBuffer(input.witnessScript)) {
    scriptType = 'p2shP2wsh';
  } else if (Buffer.isBuffer(input.redeemScript)) {
    scriptType = 'p2sh';
  } else if (Buffer.isBuffer(input.witnessScript)) {
    scriptType = 'p2wsh';
  }
  if (Array.isArray(input.tapLeafScript) && input.tapLeafScript.length > 0) {
    if (scriptType) {
      throw new Error(`Found both ${scriptType} and taprootScriptPath PSBT metadata.`);
    }
    if (input.tapLeafScript.length > 1) {
      throw new Error('Bitgo only supports a single tap leaf script per input.');
    }
    scriptType = 'taprootScriptPathSpend';
  }
  if (input.tapInternalKey) {
    if (scriptType) {
      throw new Error(`Found both ${scriptType} and taprootKeyPath PSBT metadata.`);
    }
    scriptType = 'taprootKeyPathSpend';
  }
  return scriptType;
}

function parseTaprootKeyPathSignatures(psbt: UtxoPsbt, inputIndex: number): TaprootKeyPathSignatures {
  const partialSigs = parsePsbtMusig2PartialSigs(psbt, inputIndex);
  if (!partialSigs) {
    return { signatures: undefined, participantPublicKeys: undefined };
  }
  const signatures = partialSigs.map((pSig) => pSig.partialSig);
  const participantPublicKeys = partialSigs.map((pSig) => pSig.participantPubKey);
  return isTuple<Buffer>(signatures) && isTuple<Buffer>(participantPublicKeys)
    ? { signatures, participantPublicKeys }
    : { signatures: [signatures[0]], participantPublicKeys: [participantPublicKeys[0]] };
}

function parsePartialOrTapScriptSignatures(sig: PartialSig[] | TapScriptSig[] | undefined): Signatures {
  if (!sig?.length) {
    return { signatures: undefined };
  }
  if (sig.length > 2) {
    throw new Error('unexpected signature count');
  }
  const signatures = sig.map((tSig) => tSig.signature);
  return isTuple<Buffer>(signatures) ? { signatures } : { signatures: [signatures[0]] };
}

function parseSignatures(
  psbt: UtxoPsbt,
  inputIndex: number,
  scriptType: ParsedScriptType2Of3
): Signatures | TaprootKeyPathSignatures {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  return scriptType === 'taprootKeyPathSpend'
    ? parseTaprootKeyPathSignatures(psbt, inputIndex)
    : scriptType === 'taprootScriptPathSpend'
    ? parsePartialOrTapScriptSignatures(input.tapScriptSig)
    : parsePartialOrTapScriptSignatures(input.partialSig);
}

function parseScript(input: PsbtInput, scriptType: ParsedScriptType2Of3): ParsedPubScriptP2ms | ParsedPubScriptTaproot {
  let pubScript: Buffer | undefined;
  if (scriptType === 'p2sh') {
    pubScript = input.redeemScript;
  } else if (scriptType === 'p2wsh' || scriptType === 'p2shP2wsh') {
    pubScript = input.witnessScript;
  } else if (scriptType === 'taprootScriptPathSpend') {
    pubScript = input.tapLeafScript ? input.tapLeafScript[0].script : undefined;
  } else if (scriptType === 'taprootKeyPathSpend') {
    if (input.witnessUtxo?.script) {
      pubScript = input.witnessUtxo.script;
    } else if (input.tapInternalKey && input.tapMerkleRoot) {
      pubScript = createTaprootOutputScript({ internalPubKey: input.tapInternalKey, taptreeRoot: input.tapMerkleRoot });
    }
  }
  if (!pubScript) {
    throw new Error(`Invalid PSBT state for ${scriptType}. Missing required fields.`);
  }
  return parsePubScript(pubScript, scriptType);
}

function parseInputMetadata(
  psbt: UtxoPsbt,
  inputIndex: number,
  scriptType: ParsedScriptType2Of3
): ParsedPsbtP2ms | ParsedPsbtTaproot {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  const parsedPubScript = parseScript(input, scriptType);
  const signatures = parseSignatures(psbt, inputIndex, scriptType);

  if (parsedPubScript.scriptType === 'taprootKeyPathSpend' && 'participantPublicKeys' in signatures) {
    return {
      ...parsedPubScript,
      ...signatures,
    };
  }
  if (parsedPubScript.scriptType === 'taprootScriptPathSpend') {
    if (!input.tapLeafScript) {
      throw new Error('Invalid PSBT state for taprootScriptPathSpend. Missing required fields.');
    }
    const controlBlock = input.tapLeafScript[0].controlBlock;
    if (!isValidControlBock(controlBlock)) {
      throw new Error('Invalid PSBT taprootScriptPathSpend controlBlock.');
    }
    const scriptPathLevel = calculateScriptPathLevel(controlBlock);
    const leafVersion = getLeafVersion(controlBlock);
    return {
      ...parsedPubScript,
      ...signatures,
      controlBlock,
      scriptPathLevel,
      leafVersion,
    };
  }
  if (
    parsedPubScript.scriptType === 'p2sh' ||
    parsedPubScript.scriptType === 'p2wsh' ||
    parsedPubScript.scriptType === 'p2shP2wsh'
  ) {
    if (parsedPubScript.scriptType === 'p2shP2wsh') {
      parsedPubScript.redeemScript = input.redeemScript;
    }
    return {
      ...parsedPubScript,
      ...signatures,
    };
  }
  throw new Error('invalid pub script');
}

/**
 * @return psbt metadata are parsed as per below conditions.
 * redeemScript/witnessScript/tapLeafScript matches BitGo.
 * signature and public key count matches BitGo.
 * P2SH => scriptType, redeemScript, public keys, signatures.
 * PW2SH => scriptType, witnessScript, public keys, signatures.
 * P2SH-PW2SH => scriptType, redeemScript, witnessScript, public keys, signatures.
 * P2TR and P2TR MUSIG2 script path => scriptType (taprootScriptPathSpend), pubScript (leaf script), controlBlock,
 * scriptPathLevel, leafVersion, public keys, signatures.
 * P2TR MUSIG2 kep path => scriptType (taprootKeyPathSpend), pubScript (scriptPubKey), participant pub keys (signer),
 * public key (tapOutputkey), signatures (partial signer sigs).
 * Any unsigned PSBT and without required metadata is returned with undefined.
 */
export function parsePsbtInput(psbt: UtxoPsbt, inputIndex: number): ParsedPsbtP2ms | ParsedPsbtTaproot | undefined {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (psbt.isInputFinalized(inputIndex)) {
    throw new Error('Finalized PSBT parsing is not supported');
  }
  const scriptType = getScriptType(input);
  if (!scriptType) {
    if (psbt.getSignatureCount(inputIndex) > 0) {
      throw new Error('Invalid PSBT state. Signatures found without scripts.');
    }
    return undefined;
  }
  return parseInputMetadata(psbt, inputIndex, scriptType);
}
