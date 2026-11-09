/**
 * @prettier
 *
 * Per-coin encoders for the `ed25519Multisig` safe slot. Every slot coin uses the same raw 32-byte
 * ed25519 keys but expects them in its own string format (address / public key / secret seed).
 */
import {
  algoMultisigAddress,
  encodeAlgoKey,
  encodeEd25519StrKeyPublicKey,
  encodeEd25519StrKeySecretSeed,
  encodeHbarPrivateKeyDer,
  encodeHbarPublicKeyDer,
} from './ed25519Pub';

export interface Ed25519MultisigCoinEncoders {
  /** Raw 32-byte public key -> the coin's stored public key format. */
  encodePub: (rawPub: Buffer) => string;
  /** Raw 32-byte secret seed -> the private key format the coin signs with. */
  encodeSeed: (rawSeed: Buffer) => string;
  /** Present only for coins whose root address is derivable from the three child public keys. */
  deriveRootAddress?: (userPub: Buffer, backupPub: Buffer, bitgoPub: Buffer) => string;
}

const ALGO_ENCODERS: Ed25519MultisigCoinEncoders = {
  encodePub: encodeAlgoKey,
  encodeSeed: encodeAlgoKey,
  deriveRootAddress: (userPub, backupPub, bitgoPub) => algoMultisigAddress(1, 2, [userPub, backupPub, bitgoPub]),
};

const HBAR_ENCODERS: Ed25519MultisigCoinEncoders = {
  encodePub: encodeHbarPublicKeyDer,
  encodeSeed: encodeHbarPrivateKeyDer,
};

const XLM_ENCODERS: Ed25519MultisigCoinEncoders = {
  encodePub: encodeEd25519StrKeyPublicKey,
  encodeSeed: encodeEd25519StrKeySecretSeed,
};

/**
 * Registry keyed by coin chain name. A mainnet chain name is also its coin family name, so
 * `getEd25519MultisigCoinEncoders(baseCoin.getFamily())` resolves for testnets too
 * (talgo/algo, thbar/hbar, txlm/xlm all share a family). A coin absent from the registry does not
 * support `ed25519Multisig` safe key handling.
 */
export const ED25519_MULTISIG_COIN_ENCODERS: Readonly<Record<string, Ed25519MultisigCoinEncoders | undefined>> = {
  algo: ALGO_ENCODERS,
  talgo: ALGO_ENCODERS,
  hbar: HBAR_ENCODERS,
  thbar: HBAR_ENCODERS,
  xlm: XLM_ENCODERS,
  txlm: XLM_ENCODERS,
};

/** Look up the encoders for a coin chain or coin family; `undefined` when unsupported. */
export function getEd25519MultisigCoinEncoders(chainOrFamily: string): Ed25519MultisigCoinEncoders | undefined {
  return Object.prototype.hasOwnProperty.call(ED25519_MULTISIG_COIN_ENCODERS, chainOrFamily)
    ? ED25519_MULTISIG_COIN_ENCODERS[chainOrFamily]
    : undefined;
}
