import { fixedScriptWallet } from '@bitgo/wasm-utxo';
import { UnexpectedAddressError } from '@bitgo/sdk-core';

import type { UtxoCoinName } from '../../names';

/**
 * Platform-reported shielded address details (wallet-platform
 * `coinSpecific.shielded` for Zcash Orchard/Ironwood addresses).
 */
export interface ShieldedAddressDetails {
  /** Receiver type, e.g. 'ironwood'. */
  type?: string;
  /** 11-byte hex diversifier. */
  diversifier?: string;
  /** 32-byte hex `pk_d`. */
  pkD?: string;
  /** Wallet address index the diversifier was derived from. */
  diversifierIndex?: number;
}

/**
 * Verify a Zcash shielded (Orchard/Ironwood) wallet address returned by the platform.
 *
 * Shielded custodial wallets use RedPallas threshold keys whose keychains carry no
 * secp256k1 xpubs, so the address cannot be locally rederived the way fixed-script
 * (transparent) addresses are (`assertFixedScriptWalletAddress` would throw reading
 * `pub`). Instead, this checks the address is a well-formed Orchard Unified Address
 * whose 43-byte receiver matches the diversifier and `pk_d` the platform reports in
 * `coinSpecific.shielded` — i.e. the UA really encodes the reported shielded receiver.
 *
 * @throws {UnexpectedAddressError} if the address is not a valid Orchard UA, the
 *   platform-reported data is missing/malformed, or the UA's Orchard receiver does
 *   not match the reported diversifier/`pk_d`
 */
export function assertShieldedWalletAddress(
  coinName: UtxoCoinName,
  params: {
    address: string;
    coinSpecific?: { shielded?: ShieldedAddressDetails };
  }
): void {
  const shielded = params.coinSpecific?.shielded;
  if (!shielded?.diversifier || !shielded.pkD) {
    throw new UnexpectedAddressError('address validation failure: shielded address missing diversifier or pkD');
  }

  const diversifier = Buffer.from(shielded.diversifier, 'hex');
  const pkD = Buffer.from(shielded.pkD, 'hex');
  if (diversifier.length !== 11) {
    throw new UnexpectedAddressError(`address validation failure: invalid diversifier length ${diversifier.length}`);
  }
  if (pkD.length !== 32) {
    throw new UnexpectedAddressError(`address validation failure: invalid pkD length ${pkD.length}`);
  }

  // Only zec/tzec produce shielded addresses, so the name is always a valid ZcashNetworkName.
  const network = coinName as fixedScriptWallet.ZcashNetworkName;

  let ua: fixedScriptWallet.ZcashUnifiedAddress;
  try {
    ua = fixedScriptWallet.ZcashUnifiedAddress.parse(params.address, network);
  } catch (e) {
    throw new UnexpectedAddressError(`address validation failure: not a valid unified address: ${params.address}`);
  }

  const orchard = ua.orchardReceiver;
  if (!orchard || orchard.length !== 43) {
    throw new UnexpectedAddressError('address validation failure: unified address carries no Orchard receiver');
  }

  const expectedReceiver = Buffer.concat([diversifier, pkD]);
  if (!Buffer.from(orchard).equals(expectedReceiver)) {
    throw new UnexpectedAddressError(
      'address validation failure: unified address Orchard receiver does not match shielded coinSpecific'
    );
  }
}
