import { coins, Networks, UnderlyingAsset, AccountCoin, xrpMptToken } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';

export const getBuilderFactory = (coin: string): TransactionBuilderFactory => {
  return new TransactionBuilderFactory(coins.get(coin));
};

/**
 * Returns a TransactionBuilderFactory backed by a dummy XrpMptCoin for unit tests.
 * Instantiates the coin directly — no registration in allCoinsAndTokens.ts required.
 */
export const getMptBuilderFactory = (
  mptIssuanceId: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): TransactionBuilderFactory => {
  const xrplNetwork = network === 'mainnet' ? Networks.main.xrp : Networks.test.xrp;
  // Placeholder — real MPT tokens use their own UnderlyingAsset entry added during onboarding.
  const underlyingAsset = network === 'mainnet' ? UnderlyingAsset['xrp:rlusd'] : UnderlyingAsset['txrp:rlusd'];

  const coinConfig = xrpMptToken(
    'b2902479-27f2-4fc8-83b4-5549cd75dc40',
    network === 'mainnet' ? 'xrp:test-mpt' : 'txrp:test-mpt',
    'Test MPT Token',
    mptIssuanceId,
    true, // canTransfer
    2, // assetScale — raw 1000 displays as 10.00
    underlyingAsset,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'TEST-MPT',
    xrplNetwork
  );
  return new TransactionBuilderFactory(coinConfig);
};
