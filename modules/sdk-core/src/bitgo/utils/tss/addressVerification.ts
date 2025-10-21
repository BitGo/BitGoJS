import { InvalidAddressError, TssVerifyAddressOptions } from '../../baseCoin/iBaseCoin';
import { EDDSAMethods } from '../../tss';

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

  if (!keychains || keychains.length === 0) {
    throw new Error('missing required param keychains');
  }

  // For MPC coins, commonKeychain should be the same for all keychains
  const commonKeychain = keychains[0].commonKeychain as string;
  if (!commonKeychain) {
    throw new Error('missing required param commonKeychain');
  }

  // Verify all keychains have the same commonKeychain
  for (const keychain of keychains) {
    if (keychain.commonKeychain !== commonKeychain) {
      throw new Error('all keychains must have the same commonKeychain for MPC coins');
    }
  }

  // Only perform derivation once since commonKeychain is the same
  const MPC = await EDDSAMethods.getInitializedMpcInstance();
  const derivationPath = 'm/' + index;
  const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
  const expectedAddress = getAddressFromPublicKey(derivedPublicKey);

  return address === expectedAddress;
}
