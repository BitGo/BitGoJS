import { TssVerifyAddressOptions } from '../../baseCoin/iBaseCoin';
import { InvalidAddressError } from '../../errors';
import { EDDSAMethods } from '../../tss';

/**
 * Extracts and validates the commonKeychain from keychains array.
 * For MPC wallets, all keychains should have the same commonKeychain.
 *
 * @param keychains - Array of keychains containing commonKeychain
 * @returns The validated commonKeychain
 * @throws {Error} if keychains are missing, empty, or have mismatched commonKeychains
 */
export function extractCommonKeychain(keychains: TssVerifyAddressOptions['keychains']): string {
  if (!keychains?.length) {
    throw new Error('missing required param keychains');
  }

  const commonKeychain = keychains[0].commonKeychain;
  if (!commonKeychain) {
    throw new Error('missing required param commonKeychain');
  }

  // Verify all keychains have the same commonKeychain
  if (keychains.find((kc) => kc.commonKeychain !== commonKeychain))
    throw new Error('all keychains must have the same commonKeychain for MPC coins');

  return commonKeychain;
}

/**
 * Verifies if an address belongs to a wallet using EdDSA TSS MPC derivation.
 * This is a common implementation for EdDSA-based MPC coins (SOL, DOT, SUI, TON, IOTA, etc.)
 *
 * @param params - Verification options including keychains, address, and derivation index
 * @param isValidAddress - Coin-specific function to validate address format
 * @param getAddressFromPublicKey - Coin-specific function to convert public key to address
 * @returns true if the address matches the derived address, false otherwise
 * @throws {InvalidAddressError} if the address is invalid
 * @throws {Error} if required parameters are missing or invalid
 */
export async function verifyEddsaTssWalletAddress(
  params: TssVerifyAddressOptions,
  isValidAddress: (address: string) => boolean,
  getAddressFromPublicKey: (publicKey: string) => string
): Promise<boolean> {
  const { keychains, address, index } = params;

  if (!isValidAddress(address)) {
    throw new InvalidAddressError(`invalid address: ${address}`);
  }

  const commonKeychain = extractCommonKeychain(keychains);

  const MPC = await EDDSAMethods.getInitializedMpcInstance();
  const derivationPath = 'm/' + index;
  const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
  const expectedAddress = getAddressFromPublicKey(derivedPublicKey);

  return address === expectedAddress;
}
