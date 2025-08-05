import { Hash } from 'fast-sha256';
import { Psbt, Transaction, bitgo, networks } from '@bitgo/utxo-lib';

export const BIP322_TAG = 'BIP0322-signed-message';

/**
 * Perform a tagged hash
 *
 * @param {string | Buffer} message - The message to hash as a Buffer or utf-8 string
 * @param {Buffer} [tag=BIP322_TAG] - The tag to use for hashing, defaults to BIP322_TAG.
 * @returns {Buffer} - The resulting hash of the message with the tag.
 */
export function hashMessageWithTag(message: string | Buffer, tag = BIP322_TAG): Buffer {
  // Compute the message hash - SHA256(SHA256(tag) || SHA256(tag) || message)
  // Reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#full
  const tagHasher = new Hash();
  tagHasher.update(Buffer.from(BIP322_TAG));
  const tagHash = tagHasher.digest();
  const messageHasher = new Hash();
  messageHasher.update(tagHash);
  messageHasher.update(tagHash);
  messageHasher.update(Buffer.from(message));
  const messageHash = messageHasher.digest();
  return Buffer.from(messageHash);
}

/**
 * Build a BIP322 "to spend" transaction
 * Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#full
 *
 * @param {Buffer} scriptPubKey - The scriptPubKey to use for the output
 * @param {string | Buffer} message - The message to include in the transaction
 * @param {Buffer} [tag=BIP322_TAG] - The tag to use for hashing, defaults to BIP322_TAG.
 * @returns {Transaction} - The constructed transaction
 */
export function buildToSpendTransaction(
  scriptPubKey: Buffer,
  message: string | Buffer,
  tag = BIP322_TAG
): Transaction<bigint> {
  // Create PSBT object for constructing the transaction
  const psbt = new Psbt();
  // Set default value for nVersion and nLockTime
  psbt.setVersion(0); // nVersion = 0
  psbt.setLocktime(0); // nLockTime = 0
  // Compute the message hash - SHA256(SHA256(tag) || SHA256(tag) || message)
  const messageHash = hashMessageWithTag(message, tag);
  // Construct the scriptSig - OP_0 PUSH32[ message_hash ]
  const scriptSigPartOne = new Uint8Array([0x00, 0x20]); // OP_0 PUSH32
  const scriptSig = new Uint8Array(scriptSigPartOne.length + messageHash.length);
  scriptSig.set(scriptSigPartOne);
  scriptSig.set(messageHash, scriptSigPartOne.length);
  // Set the input
  psbt.addInput({
    hash: '0'.repeat(64), // vin[0].prevout.hash = 0000...000
    index: 0xffffffff, // vin[0].prevout.n = 0xFFFFFFFF
    sequence: 0, // vin[0].nSequence = 0
    finalScriptSig: Buffer.from(scriptSig), // vin[0].scriptSig = OP_0 PUSH32[ message_hash ]
    witnessScript: Buffer.from([]), // vin[0].scriptWitness = []
  });
  // Set the output
  psbt.addOutput({
    value: BigInt(0), // vout[0].nValue = 0
    script: scriptPubKey, // vout[0].scriptPubKey = message_challenge
  });
  // Return transaction
  return psbt.extractTransaction();
}

export function buildToSpendTransactionFromChainAndIndex(
  rootWalletKeys: bitgo.RootWalletKeys,
  chain: bitgo.ChainCode,
  index: number,
  message: string | Buffer,
  tag = BIP322_TAG
): Transaction<bigint> {
  const taprootChains = [...bitgo.chainCodesP2tr, ...bitgo.chainCodesP2trMusig2];
  if (taprootChains.some((tc) => tc === chain)) {
    throw new Error('BIP322 is not supported for Taproot script types.');
  }

  const outputScript = bitgo.outputScripts.createOutputScript2of3(
    rootWalletKeys.deriveForChainAndIndex(chain, index).publicKeys,
    bitgo.scriptTypeForChain(chain),
    networks.bitcoin
  );
  return buildToSpendTransaction(outputScript.scriptPubKey, message, tag);
}
