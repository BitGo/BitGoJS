import { BaseCoin as CoinConfig, NetworkType, StacksNetwork as StaticsStacksNetwork } from '@bitgo/statics';
import { StacksMainnet, StacksNetwork, StacksTestnet } from '@stacks/network';

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
  const network = staticsNetwork.type === NetworkType.MAINNET ? new StacksMainnet() : new StacksTestnet();

  if (staticsNetwork.chainId !== undefined) {
    network.chainId = staticsNetwork.chainId;
  }
  if (staticsNetwork.transactionVersion !== undefined) {
    network.version = staticsNetwork.transactionVersion;
  }

  return network;
}
