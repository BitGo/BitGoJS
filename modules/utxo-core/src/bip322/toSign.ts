import { Psbt, Transaction } from '@bitgo/utxo-lib';

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
 * @param {string} toSpendTxHex - The hex representation of the `toSpend` transaction.
 * @param {AddressDetails} addressDetails - The details of the address, including redeemScript and/or witnessScript.
 * @returns {string} - The hex representation of the constructed PSBT.
 */
export function buildToSignPsbt(toSpendTx: Transaction<bigint>, addressDetails: AddressDetails): Psbt {
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

  // Set the output
  psbt.addOutput({
    value: BigInt(0), // vout[0].nValue = 0
    script: Buffer.from([0x6a]), // vout[0].scriptPubKey = OP_RETURN
  });
  return psbt;
}
