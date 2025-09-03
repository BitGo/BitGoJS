import { Psbt, bitgo, networks, Transaction } from '@bitgo/utxo-lib';
import { toXOnlyPublicKey } from '@bitgo/utxo-lib/dist/src/bitgo/outputScripts';

import { addBip322ProofMessage } from './utils';
import { BIP322_TAG, buildToSpendTransaction } from './toSpend';

export type AddressDetails = {
  redeemScript?: Buffer;
  witnessScript?: Buffer;
  scriptPubKey: Buffer;
};
export const MAX_NUM_BIP322_INPUTS = 200;

/**
 * Create the base PSBT for the to_sign transaction for BIP322 signing.
 * There will be ever 1 output.
 */
export function createBaseToSignPsbt(
  rootWalletKeys?: bitgo.RootWalletKeys,
  network = networks.bitcoin
): bitgo.UtxoPsbt {
  // Create PSBT object for constructing the transaction
  const psbt = bitgo.createPsbtForNetwork({ network });
  // Set default value for nVersion and nLockTime
  psbt.setVersion(0); // nVersion = 0
  psbt.setLocktime(0); // nLockTime = 0

  // Set the output
  psbt.addOutput({
    value: BigInt(0), // vout[0].nValue = 0
    script: Buffer.from([0x6a]), // vout[0].scriptPubKey = OP_RETURN
  });

  // If rootWalletKeys are provided, add them to the PSBT as global xpubs
  if (rootWalletKeys) {
    bitgo.addXpubsToPsbt(psbt, rootWalletKeys);
  }

  return psbt;
}

/**
 * Add a BIP322 input to the PSBT.
 * Source implementation:
 * https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#full
 *
 * @param {string} message - The message that is hashed into the `to_spend` transaction.
 * @param {AddressDetails} addressDetails - The details of the address, including redeemScript and/or witnessScript.
 * @param {string} [tag=BIP322_TAG] - The tag to use for hashing, defaults to BIP322_TAG.
 * @returns {Psbt} - The hex representation of the constructed PSBT.
 */
export function addBip322Input(psbt: Psbt, message: string, addressDetails: AddressDetails, tag = BIP322_TAG): void {
  const toSpendTx = buildToSpendTransaction(addressDetails.scriptPubKey, message, tag);
  if (psbt.data.inputs.length >= MAX_NUM_BIP322_INPUTS) {
    throw new Error(`Exceeded maximum number of BIP322 inputs (${MAX_NUM_BIP322_INPUTS})`);
  }

  psbt.addInput({
    hash: toSpendTx.getId(), // vin[0].prevout.hash = to_spend.txid
    index: 0, // vin[0].prevout.n = 0
    sequence: 0, // vin[0].nSequence = 0
    nonWitnessUtxo: toSpendTx.toBuffer(), // previous transaction for us to rebuild later to verify
    sighashType: Transaction.SIGHASH_ALL,
  });
  const inputIndex = psbt.data.inputs.length - 1;
  psbt.updateInput(inputIndex, {
    witnessUtxo: { value: BigInt(0), script: addressDetails.scriptPubKey },
  });

  if (addressDetails.redeemScript) {
    psbt.updateInput(inputIndex, { redeemScript: addressDetails.redeemScript });
  }
  if (addressDetails.witnessScript) {
    psbt.updateInput(inputIndex, {
      witnessScript: addressDetails.witnessScript,
    });
  }

  // Add the message as a proprietary key value to the PSBT so we can verify it later
  addBip322ProofMessage(psbt, inputIndex, Buffer.from(message));
}

export function addBip322InputWithChainAndIndex(
  psbt: bitgo.UtxoPsbt,
  message: string,
  rootWalletKeys: bitgo.RootWalletKeys,
  scriptId: bitgo.ScriptId
): void {
  const scriptType = bitgo.scriptTypeForChain(scriptId.chain);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(scriptId.chain, scriptId.index);
  const output = bitgo.outputScripts.createOutputScript2of3(
    walletKeys.publicKeys,
    bitgo.scriptTypeForChain(scriptId.chain)
  );

  addBip322Input(psbt as Psbt, message, {
    scriptPubKey: output.scriptPubKey,
    redeemScript: output.redeemScript,
    witnessScript: output.witnessScript,
  });

  const inputIndex = psbt.data.inputs.length - 1;

  // When adding the taproot metadata, we assume that we are NOT using the backup path
  // For script type p2tr, it means that we are using signer and bitgo keys when creating the tap tree
  // spending paths. For p2trMusig2, it means that we are using the taproot key path spending
  const keyNames = ['user', 'bitgo'] as bitgo.KeyName[];
  if (scriptType === 'p2tr') {
    const { controlBlock, witnessScript, leafVersion, leafHash } = bitgo.outputScripts.createSpendScriptP2tr(
      walletKeys.publicKeys,
      [walletKeys.user.publicKey, walletKeys.bitgo.publicKey]
    );
    psbt.updateInput(inputIndex, {
      tapLeafScript: [{ controlBlock, script: witnessScript, leafVersion }],
    });

    psbt.updateInput(inputIndex, {
      tapBip32Derivation: keyNames.map((key) => ({
        leafHashes: [leafHash],
        pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], scriptId.chain, scriptId.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else if (scriptType === 'p2trMusig2') {
    const {
      internalPubkey: tapInternalKey,
      outputPubkey: tapOutputKey,
      taptreeRoot,
    } = bitgo.outputScripts.createKeyPathP2trMusig2(walletKeys.publicKeys);

    const participantsKeyValData = bitgo.musig2.encodePsbtMusig2Participants({
      tapOutputKey,
      tapInternalKey,
      participantPubKeys: [walletKeys.user.publicKey, walletKeys.bitgo.publicKey],
    });
    bitgo.addProprietaryKeyValuesFromUnknownKeyValues(psbt, 'input', inputIndex, participantsKeyValData);

    psbt.updateInput(inputIndex, {
      tapInternalKey: tapInternalKey,
    });

    psbt.updateInput(inputIndex, {
      tapMerkleRoot: taptreeRoot,
    });

    psbt.updateInput(inputIndex, {
      tapBip32Derivation: keyNames.map((key) => ({
        leafHashes: [],
        pubkey: toXOnlyPublicKey(walletKeys[key].publicKey),
        path: rootWalletKeys.getDerivationPath(rootWalletKeys[key], scriptId.chain, scriptId.index),
        masterFingerprint: rootWalletKeys[key].fingerprint,
      })),
    });
  } else {
    // Add bip32 derivation information for the input
    psbt.updateInput(
      inputIndex,
      bitgo.getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, bitgo.scriptTypeForChain(scriptId.chain))
    );
  }
}
