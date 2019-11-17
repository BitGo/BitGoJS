import 'should';
import { coins, Erc20Coin } from '../../src';

describe('ERC20 Coins', () => {
  it('should have no duplicate contract addresses', () => {
    coins
      .filter(coin => coin instanceof Erc20Coin)
      .reduce((acc: { [index: string]: string }, token) => {
        const address = (token as Readonly<Erc20Coin>).contractAddress.toString();
        if (acc[address]) {
          throw new Error(
            `ERC20 tokens '${acc[address]}' and '${token.name}' have identical contract address '${address}'`
          );
        }
        acc[address] = token.name;
        return acc;
      }, {});
  });
});
