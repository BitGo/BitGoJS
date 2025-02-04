const should = require('should');
import { randomUUID } from 'crypto';

import { CoinFeature, coins, UnderlyingAsset } from '../../src';
import { ofcErc20Coins } from '../../src/coins/ofcErc20Coins';

const EXCLUDED_ASSETS = new Set<string>([
  'erc721', // not erc20
  'erc1155', // not erc20
  'nonstandard', // not erc20
  'imx', // replaced by a v2
  'inj', // replaced by a v2
  'knc', // replaced by a v2
  'tgbp', // confusion with the fiat version
]);

describe('OFC Coin parity tests', function () {
  it('should have parity with OFC for ERC20 tokens', function () {
    const ofcCoinsWithInvalidAssets = ofcErc20Coins
      .filter((coin) => coin.asset === UnderlyingAsset.INVALID_UNKNOWN)
      .map((coin) => coin.name);
    should(ofcCoinsWithInvalidAssets).deepEqual(
      [],
      'OFC ERC20s with invalid assets\n'.concat(ofcCoinsWithInvalidAssets.join('\n'))
    );

    const ofcerc20s = new Set<string>(ofcErc20Coins.map((coin) => coin.asset));
    const erc20s = coins.filter((coin) => coin.isToken && coin.network.name === 'Ethereum');

    const addedOfcErc20s: string[] = [];
    erc20s
      .filter(
        (erc20) =>
          !ofcerc20s.has(erc20.asset) &&
          !EXCLUDED_ASSETS.has(erc20.asset) &&
          !erc20.features.includes(CoinFeature.DEPRECATED)
      )
      .forEach((erc20) => {
        console.log(
          `ofcerc20('${randomUUID()}', 'ofc${erc20.name}', '${erc20.fullName}', ${
            erc20.decimalPlaces
          }, underlyingAssetForSymbol('${erc20.asset}')),`
        );
        addedOfcErc20s.push(`ofc${erc20.name}`);
      });

    if (addedOfcErc20s.length > 0) {
      console.log(`Added ${addedOfcErc20s.length} OFC ERC20s:`);
      console.log(addedOfcErc20s.join('\n'));
      // TODO: enable this check when we are ready to have 1:1 parity between erc20 and ofcerc20
      // should(addedOfcErc20s.length).equal(0, 'Missing OFC ERC20s');
    }
  });
});
