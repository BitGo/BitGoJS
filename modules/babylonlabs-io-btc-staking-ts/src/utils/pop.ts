import { sha256 } from "bitcoinjs-lib/src/crypto";

import { STAKING_MODULE_ADDRESS } from "../constants/staking";

/**
 * Creates the context string for the staker POP following RFC-036.
 * See: https://github.com/babylonlabs-io/pm/blob/main/rfc/rfc-036-replay-attack-protection.md
 * @param chainId - The Babylon chain ID
 * @param popContextVersion - The POP context version (defaults to 0)
 * @returns The hex encoded SHA-256 hash of the context string.
 */
export function createStakerPopContext(
  chainId: string,
  popContextVersion: number = 0,
): string {
  // Context string format following RFC-036:
  // Format: btcstaking/{version}/{operation_type}/{chain_id}/{module_address}
  // 
  // Fields:
  // - btcstaking: Protocol identifier for Bitcoin staking operations
  // - version: POP context version (integer, defaults to 0)
  // - operation_type: Type of operation ("staker_pop" for staker proof of possession)
  // - chain_id: The Babylon chain ID for domain separation
  // - module_address: The staking module address for additional context
  const contextString = `btcstaking/${popContextVersion}/staker_pop/${chainId}/${STAKING_MODULE_ADDRESS}`;
  return sha256(Buffer.from(contextString, "utf8")).toString("hex");
}

/**
 * Creates the POP message to sign based on upgrade configuration and current height.
 * RFC-036: If the Babylon tip height is greater than or equal to the POP context
 * upgrade height, use the new context format, otherwise use legacy format.
 * @param currentHeight - The current Babylon tip height
 * @param bech32Address - The staker's bech32 address
 * @param chainId - The Babylon chain ID
 * @param upgradeConfig - Optional upgrade configuration with height and version
 * @returns The message to sign (either just the address or context hash + address)
 */
export function buildPopMessage(
  bech32Address: string,
  currentHeight?: number,
  chainId?: string,
  upgradeConfig?: { upgradeHeight: number; version: number },
): string {
  // RFC-036: If upgrade is configured and current height >= upgrade height, use new context format
  // https://github.com/babylonlabs-io/pm/blob/main/rfc/rfc-036-replay-attack-protection.md
  if (
    chainId !== undefined &&
    upgradeConfig?.upgradeHeight !== undefined &&
    upgradeConfig.version !== undefined &&
    currentHeight !== undefined &&
    currentHeight >= upgradeConfig.upgradeHeight
  ) {
    const contextHash = createStakerPopContext(chainId, upgradeConfig.version);
    return contextHash + bech32Address;
  }

  return bech32Address;
}