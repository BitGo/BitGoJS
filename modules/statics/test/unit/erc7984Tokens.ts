import 'should';
import { coins, Erc7984Coin, Networks } from '../../src';

describe('ERC-7984 wrapper metadata on Erc7984Coin', function () {
  function getErc7984(name: string): Erc7984Coin {
    const coin = coins.get(name);
    should.exist(coin);
    (coin instanceof Erc7984Coin).should.equal(true);
    return coin as Erc7984Coin;
  }

  it('includes a Hoodi test pair', function () {
    const hoodi = getErc7984('hteth:cusdt');
    hoodi.network.name.should.equal(Networks.test.hoodi.name);
  });

  it('stores on-chain underlying and rate for Hoodi cUSDT', function () {
    const coin = getErc7984('hteth:cusdt');
    coin.contractAddress.should.equal('0x2debbe0487ef921df4457f9e36ed05be2df1ac75');
    coin.underlyingErc20Address.should.equal('0x51a63b5621d78de54d2f4d098a23a5a69e76f30b');
    coin.rate.should.equal('1');
    coin.requiresApprovalReset.should.equal(false);
  });

  it('stores scaled rate for Hoodi cTEST1', function () {
    const coin = getErc7984('hteth:ctest1');
    coin.underlyingErc20Address.should.equal('0x7740f913dc24d4f9e1a72531372c3170452b2f87');
    coin.rate.should.equal('1000000000000');
    coin.requiresApprovalReset.should.equal(false);
  });

  it('leaves mainnet wrapper metadata unset', function () {
    const coin = getErc7984('eth:cusdt');
    should.equal(coin.underlyingErc20Address, undefined);
    should.equal(coin.rate, undefined);
    should.equal(coin.requiresApprovalReset, undefined);
  });

  it('lowercases addresses on construction for test pairs', function () {
    const coin = getErc7984('hteth:cusdt');
    coin.contractAddress.should.equal(coin.contractAddress.toLowerCase());
    coin.underlyingErc20Address!.should.equal(coin.underlyingErc20Address!.toLowerCase());
  });
});
