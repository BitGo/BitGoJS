import 'should';
import { CoinFamily, coins, Erc20Coin, EthereumNetwork, BaseNetwork } from '../../src';

interface DuplicateCoinObject {
  name: string;
  network: BaseNetwork;
}

describe('ERC20 Coins', () => {
  it('should have no duplicate contract addresses on same network', () => {
    coins
      .filter(coin => coin instanceof Erc20Coin)
      .reduce((acc: { [index: string]: DuplicateCoinObject }, token) => {
        const address = (token as Readonly<Erc20Coin>).contractAddress.toString();

        // Two ERC20 token contract addresses should only be considered duplicates if they exist on the same network
        if (acc[address] && token.network.name == acc[address].network.name) {
          // If not ETH, should never have duplicates
          if (token.network.family !== CoinFamily.ETH) {
            throw new Error(
              `ERC20 tokens '${acc[address].name}' and '${token.name}' have identical contract address '${address}'`
            );
          }

          // If ETH, must check if chainId is different for the tokens before concluding they are duplicates
          if (token.network.family === CoinFamily.ETH) {
            const network = token.network as EthereumNetwork;
            const accEntry = acc[address].network as EthereumNetwork;
            if (network.chainId === accEntry.chainId) {
              throw new Error(
                `ERC20 tokens '${acc[address]}' and '${token.name}' have identical contract address '${address}'`
              );
            }
          }
        }

        acc[address] = { name: token.name, network: token.network };
        return acc;
      }, {});
  });
});
