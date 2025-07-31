import { Hash } from 'fast-sha256';

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
