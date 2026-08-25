import { ast, bip32, Descriptor } from '@bitgo/wasm-utxo';

type BIP32Interface = bip32.BIP32Interface;

export type Pox5StakerKey = BIP32Interface | Buffer;

export type Pox5LockupDescriptorParams = {
  unlockHeight: number;
  /** sha256(sha256(Clarity consensus principal bytes)). */
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
  /** User, backup, and BitGo keys, all BIP32 or all concrete compressed keys. */
  stakerKeys: [Pox5StakerKey, Pox5StakerKey, Pox5StakerKey];
};

function validateCompressedKey(key: Buffer, field: string): void {
  if (key.length !== 33 || (key[0] !== 0x02 && key[0] !== 0x03)) {
    throw new Error(`${field} must be a 33-byte compressed public key`);
  }
}

function isBip32Triple(
  keys: Pox5LockupDescriptorParams['stakerKeys']
): keys is [BIP32Interface, BIP32Interface, BIP32Interface] {
  return keys.every((key) => !Buffer.isBuffer(key));
}

function asDescriptorKey(key: Pox5StakerKey, field: string): string {
  if (Buffer.isBuffer(key)) {
    validateCompressedKey(key, field);
    return key.toString('hex');
  }
  return key.neutered().toBase58() + '/*';
}

function validateParams(params: Pox5LockupDescriptorParams): void {
  if (!Number.isSafeInteger(params.unlockHeight) || params.unlockHeight <= 0 || params.unlockHeight >= 500_000_000) {
    throw new Error(`unlockHeight (${params.unlockHeight}) must be a positive block height below 500000000`);
  }
  if (params.stakerCommitment.length !== 32) {
    throw new Error(`stakerCommitment must be 32 bytes (got ${params.stakerCommitment.length})`);
  }
  validateCompressedKey(params.earlyExitKey, 'earlyExitKey');

  const bufferCount = params.stakerKeys.filter(Buffer.isBuffer).length;
  if (bufferCount !== 0 && bufferCount !== params.stakerKeys.length) {
    throw new Error('stakerKeys must contain either three BIP32 keys or three compressed public keys');
  }
  params.stakerKeys.forEach((key, index) => {
    if (Buffer.isBuffer(key)) {
      validateCompressedKey(key, `stakerKeys[${index}]`);
    }
  });
}

/**
 * Build the canonical PoX-5 P2WSH descriptor. The post-CLTV and early-exit
 * paths share BitGo's standard 2-of-3 compressed-key multisig tail.
 */
export function createPox5LockupDescriptor(params: Pox5LockupDescriptorParams): string {
  validateParams(params);
  const stakerKeys = params.stakerKeys.map((key, index) => asDescriptorKey(key, `stakerKeys[${index}]`));
  const miniscript: ast.MiniscriptNode = {
    and_v: [
      {
        'v:or_i': [
          { after: params.unlockHeight },
          {
            and_v: [
              { 'v:sha256': params.stakerCommitment.toString('hex') },
              { pk: params.earlyExitKey.toString('hex') },
            ],
          },
        ],
      },
      { multi: [2, ...stakerKeys] },
    ],
  };
  return ast.formatNode({ wsh: miniscript });
}

/** Compile the PoX-5 P2WSH scriptPubKey at a BIP32 derivation index. */
export function createPox5LockupScriptPubKey(params: Pox5LockupDescriptorParams, derivationIndex = 0): Buffer {
  const descriptor = createPox5LockupDescriptor(params);
  if (isBip32Triple(params.stakerKeys)) {
    return Buffer.from(
      Descriptor.fromString(descriptor, 'derivable').atDerivationIndex(derivationIndex).scriptPubkey()
    );
  }
  return Buffer.from(Descriptor.fromString(descriptor, 'definite').scriptPubkey());
}

/** Derive the compressed staker keys needed to prepare a witness at an index. */
export function derivePox5StakerKeys(
  stakerKeys: [BIP32Interface, BIP32Interface, BIP32Interface],
  index: number
): [Buffer, Buffer, Buffer] {
  const keys = stakerKeys.map((key) => Buffer.from(key.derive(index).publicKey));
  return [keys[0], keys[1], keys[2]];
}
