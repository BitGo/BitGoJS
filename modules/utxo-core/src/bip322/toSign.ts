import { Psbt, bitgo } from '@bitgo/utxo-lib';

import { addBip322ProofMessage, isTaprootChain } from './utils';
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
export function createBaseToSignPsbt(rootWalletKeys?: bitgo.RootWalletKeys): Psbt {
  // Create PSBT object for constructing the transaction
  const psbt = new Psbt();
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
  psbt: Psbt,
  message: string,
  rootWalletKeys: bitgo.RootWalletKeys,
  chain: bitgo.ChainCode,
  index: number
): Psbt {
  if (isTaprootChain(chain)) {
    throw new Error('BIP322 is not supported for Taproot script types.');
  }
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(chain, index);
  const output = bitgo.outputScripts.createOutputScript2of3(walletKeys.publicKeys, bitgo.scriptTypeForChain(chain));

  addBip322Input(psbt, message, {
    scriptPubKey: output.scriptPubKey,
    redeemScript: output.redeemScript,
    witnessScript: output.witnessScript,
  });

  const inputIndex = psbt.data.inputs.length - 1;
  psbt.updateInput(
    inputIndex,
    bitgo.getPsbtBip32DerivationOutputUpdate(rootWalletKeys, walletKeys, bitgo.scriptTypeForChain(chain))
  );

  return psbt;
}
