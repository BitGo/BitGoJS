/**
 * Tempo KeyPair - Reuses Ethereum KeyPair Implementation
 *
 * Since Tempo is EVM-compatible and uses the same cryptography (ECDSA/secp256k1)
 * as Ethereum, we directly reuse the Ethereum KeyPair implementation from abstract-eth.
 */

export { KeyPair } from '@bitgo/abstract-eth';
