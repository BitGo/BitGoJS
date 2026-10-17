import { BaseCoin as CoinConfig, NetworkType, StacksNetwork as StaticsStacksNetwork } from '@bitgo/statics';
import { STACKS_MAINNET, STACKS_TESTNET, StacksNetwork } from '@stacks/network';

/**
 * Build the `@stacks/network` object a transaction is serialized against.
 *
 * The stock Stacks mainnet/testnet networks hardcode their chain ID and transaction version. A
 * statics network that describes a different Stacks deployment (for example the Stacks
 * Foundation `staking-testnet`, chain ID 1280, on a private Bitcoin signet) declares
 * `chainId` / `transactionVersion`; those are applied on top of the stock network so the
 * serialized transaction carries the chain ID the node expects.
 *
 * When statics omits both fields the returned network is exactly the stock one, so existing
 * `stx` / `tstx` transactions stay byte-identical.
 */
export function toStacksNetwork(coinConfig: Readonly<CoinConfig>): StacksNetwork {
  const staticsNetwork = coinConfig.network as StaticsStacksNetwork;
  const stock = staticsNetwork.type === NetworkType.MAINNET ? STACKS_MAINNET : STACKS_TESTNET;
  const network: StacksNetwork = { ...stock };

  if (staticsNetwork.chainId !== undefined) {
    network.chainId = staticsNetwork.chainId;
  }
  if (staticsNetwork.transactionVersion !== undefined) {
    network.transactionVersion = staticsNetwork.transactionVersion;
  }

  return network;
}
