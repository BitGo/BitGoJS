import 'should';
import { CoinFamily, coins, NetworkType } from '@bitgo/statics';

function executeTestForFiatCoins(coin, expectedNetwork) {
  describe(`Fiat coin: ${coin.name}`, function () {
    it('has expected network type', function () {
      coin.network.type.should.eql(expectedNetwork);
    });
  });
}

const fiatCoins = coins.filter((coin) => !coin.isToken && coin.family === CoinFamily.FIAT);
const mainnetFiatCoins = fiatCoins.filter((coin) => coin.name.startsWith('fiat'));
const testnetFiatCoins = fiatCoins.filter((coin) => coin.name.startsWith('tfiat'));
mainnetFiatCoins.forEach((coin) => executeTestForFiatCoins(coin, NetworkType.MAINNET));
testnetFiatCoins.forEach((coin) => executeTestForFiatCoins(coin, NetworkType.TESTNET));
