import { Psbt, bitgo } from '@bitgo/utxo-lib';

import { addBip322ProofMessage, isTaprootChain } from './utils';
import { BIP322_TAG, buildToSpendTransaction } from './toSpend';

export type AddressDetails = {
  redeemScript?: Buffer;
  witnessScript?: Buffer;
  scriptPubKey: Buffer;
};

/**
 * Construct the toSign PSBT for a BIP322 verification.
 * Source implementation:
 * https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#full
 *
 * @param {string} message - The message that is hashed into the `to_spend` transaction.
 * @param {AddressDetails} addressDetails - The details of the address, including redeemScript and/or witnessScript.
 * @param {string} [tag=BIP322_TAG] - The tag to use for hashing, defaults to BIP322_TAG.
 * @returns {Psbt} - The hex representation of the constructed PSBT.
 */
export function buildToSignPsbt(message: string, addressDetails: AddressDetails, tag = BIP322_TAG): Psbt {
  const toSpendTx = buildToSpendTransaction(addressDetails.scriptPubKey, message, tag);

  // Create PSBT object for constructing the transaction
  const psbt = new Psbt();
  // Set default value for nVersion and nLockTime
  psbt.setVersion(0); // nVersion = 0
  psbt.setLocktime(0); // nLockTime = 0
  // Set the input
  psbt.addInput({
    hash: toSpendTx.getId(), // vin[0].prevout.hash = to_spend.txid
    index: 0, // vin[0].prevout.n = 0
    sequence: 0, // vin[0].nSequence = 0
    nonWitnessUtxo: toSpendTx.toBuffer(), // previous transaction for us to rebuild later to verify
  });
  psbt.updateInput(0, {
    witnessUtxo: { value: BigInt(0), script: addressDetails.scriptPubKey },
  });

  if (addressDetails.redeemScript) {
    psbt.updateInput(0, { redeemScript: addressDetails.redeemScript });
  }
  if (addressDetails.witnessScript) {
    psbt.updateInput(0, { witnessScript: addressDetails.witnessScript });
  }

  // Add the message as a proprietary key value to the PSBT so we can verify it later
  addBip322ProofMessage(psbt, 0, Buffer.from(message));

  // Set the output
  psbt.addOutput({
    value: BigInt(0), // vout[0].nValue = 0
    script: Buffer.from([0x6a]), // vout[0].scriptPubKey = OP_RETURN
  });
  return psbt;
}

export function buildToSignPsbtForChainAndIndex(
  message: string,
  rootWalletKeys: bitgo.RootWalletKeys,
  chain: bitgo.ChainCode,
  index: number
): Psbt {
  if (isTaprootChain(chain)) {
    throw new Error('BIP322 is not supported for Taproot script types.');
  }
  const output = bitgo.outputScripts.createOutputScript2of3(
    rootWalletKeys.deriveForChainAndIndex(chain, index).publicKeys,
    bitgo.scriptTypeForChain(chain)
  );

  return buildToSignPsbt(message, {
    scriptPubKey: output.scriptPubKey,
    redeemScript: output.redeemScript,
    witnessScript: output.witnessScript,
  });
}
