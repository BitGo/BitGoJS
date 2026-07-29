import { ast, bip32 } from '@bitgo/wasm-utxo';

import { MAX_FEE_BYTE_LENGTH, STACKS_RECIPIENT_BYTE_LENGTH, UNSPENDABLE_INTERNAL_KEY } from './constants';

type BIP32Interface = bip32.BIP32Interface;

/**
 * A reclaim key entry — either a BIP32 xpub/xprv (derivable) or a concrete
 * 32-byte x-only public key (definite).
 */
export type SbtcReclaimKey = BIP32Interface | Buffer;

export type SbtcDepositDescriptorParams = {
  /**
   * The three reclaim keys (user, backup, bitgo). Used in the reclaim leaf as
   * a 2-of-3 Tapscript multisig (`multi_a`). If a key is a `BIP32Interface`,
   * it is rendered as `<xpub>/*` and the descriptor is derivable. If a key is
   * a 32-byte `Buffer`, it is rendered as a concrete x-only hex key and the
   * descriptor is definite.
   */
  walletKeys: [SbtcReclaimKey, SbtcReclaimKey, SbtcReclaimKey];
  /**
   * Number of Bitcoin blocks the depositor must wait (relative timelock) before
   * the reclaim leaf becomes spendable.
   */
  lockTime: number;
  /** Max satoshis the sBTC signers may take. Encoded big-endian u64 (8 bytes). */
  maxFee: number | bigint;
  /**
   * Stacks recipient bytes — 22 bytes:
   *   byte 0      = Clarity principal type (0x05 standard, 0x06 contract)
   *   byte 1      = Stacks address version (e.g. 0x16 mainnet, 0x1a testnet)
   *   bytes 2..21 = 20-byte hash160 of the principal
   */
  stacksRecipient: Buffer;
  /** 32-byte x-only sBTC signers' aggregate pubkey. */
  signersAggregateKey: Buffer;
};

function asDescriptorKey(key: SbtcReclaimKey): string {
  if (Buffer.isBuffer(key)) {
    if (key.length !== 32) {
      throw new Error(`reclaim key buffer must be 32 bytes x-only (got ${key.length})`);
    }
    return key.toString('hex');
  }
  return key.neutered().toBase58() + '/*';
}

/**
 * Encode the deposit-leaf metadata that the sBTC signers parse from the
 * witness: max-fee (u64 big-endian, 8 bytes) followed by the 22-byte
 * Stacks recipient. Total: 30 bytes.
 *
 * The result is the single `payload_drop` argument inside the deposit leaf.
 */
export function encodeDepositPayload(maxFee: number | bigint, stacksRecipient: Buffer): Buffer {
  if (stacksRecipient.length !== STACKS_RECIPIENT_BYTE_LENGTH) {
    throw new Error(`stacksRecipient must be ${STACKS_RECIPIENT_BYTE_LENGTH} bytes (got ${stacksRecipient.length})`);
  }
  const fee = typeof maxFee === 'bigint' ? maxFee : BigInt(maxFee);
  if (fee < 0n || fee > 0xffffffffffffffffn) {
    throw new Error(`maxFee (${maxFee}) does not fit in unsigned 64 bits`);
  }
  const feeBuf = Buffer.alloc(MAX_FEE_BYTE_LENGTH);
  feeBuf.writeBigUInt64BE(fee);
  return Buffer.concat([feeBuf, stacksRecipient]);
}

/**
 * Build the sBTC peg-in deposit Taproot descriptor as a single all-miniscript
 * `tr()` with two leaves:
 *
 *   tr(<UNSPENDABLE>,
 *     {
 *       c:and_v(payload_drop(<feeBE||recipient>), pk_k(<signersKey>)),
 *       and_v(r:older(<lockTime>), multi_a(2, xpub1/*, xpub2/*, xpub3/*))
 *     }
 *   )
 *
 * - Deposit leaf compiles to: `<30B-payload> OP_DROP <signersKey> OP_CHECKSIG`
 * - Reclaim leaf compiles to: `<lockTime> OP_CSV OP_DROP <k1> OP_CHECKSIG <k2> OP_CHECKSIGADD <k3> OP_CHECKSIGADD OP_2 OP_NUMEQUAL`
 *
 * Both fragments are valid Bitcoin miniscript via the `payload_drop` and
 * `r:older` extensions added in `@bitgo/wasm-utxo` 4.11.0
 * (BitGoWASM PR #272).
 *
 * The descriptor is derivable: the reclaim xpubs use `/*` and the descriptor
 * library resolves them to concrete x-only keys at each derivation index.
 *
 * @returns descriptor string (without checksum)
 */
export function createSbtcDepositDescriptor(params: SbtcDepositDescriptorParams): string {
  if (params.lockTime <= 0) {
    throw new Error(`lockTime (${params.lockTime}) must be greater than 0`);
  }
  if (params.signersAggregateKey.length !== 32) {
    throw new Error(`signersAggregateKey must be 32 bytes x-only (got ${params.signersAggregateKey.length})`);
  }

  const payloadHex = encodeDepositPayload(params.maxFee, params.stacksRecipient).toString('hex');
  const reclaimKeys = params.walletKeys.map(asDescriptorKey);

  // `payload_drop` is not yet in the public MiniscriptNode TS union, so cast
  // the deposit leaf — the formatter is generic and renders it correctly.
  const depositLeaf = {
    'c:and_v': [{ payload_drop: payloadHex }, { pk_k: params.signersAggregateKey.toString('hex') }],
  } as unknown as ast.MiniscriptNode;

  const reclaimLeaf: ast.MiniscriptNode = {
    and_v: [{ 'r:older': params.lockTime }, { multi_a: [2, ...reclaimKeys] }],
  };

  return ast.formatNode({
    tr: [UNSPENDABLE_INTERNAL_KEY, [depositLeaf, reclaimLeaf]],
  });
}
