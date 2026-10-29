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

  it('stores on-chain wrapper metadata for every mainnet pair', function () {
    const mainnet = {
      'eth:czama': {
        contractAddress: '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071',
        underlyingErc20Address: '0xa12cc123ba206d4031d1c7f6223d1c2ec249f4f3',
        rate: '1000000000000',
        requiresApprovalReset: false,
      },
      'eth:cxaut': {
        contractAddress: '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1',
        underlyingErc20Address: '0x68749665ff8d2d112fa859aa293f07a622782f38',
        rate: '1',
        requiresApprovalReset: false,
      },
      'eth:ctgbp': {
        contractAddress: '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9',
        underlyingErc20Address: '0x27f6c8289550fce67f6b50bed1f519966afe5287',
        rate: '1000000000000',
        requiresApprovalReset: false,
      },
      'eth:cweth': {
        contractAddress: '0xda9396b82634ea99243ce51258b6a5ae512d4893',
        underlyingErc20Address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        rate: '1000000000000',
        requiresApprovalReset: false,
      },
      'eth:cusdt': {
        contractAddress: '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50',
        underlyingErc20Address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        rate: '1',
        requiresApprovalReset: true,
      },
      'eth:cusdc': {
        contractAddress: '0xe978f22157048e5db8e5d07971376e86671672b2',
        underlyingErc20Address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        rate: '1',
        requiresApprovalReset: false,
      },
    };
    for (const [name, expected] of Object.entries(mainnet)) {
      const coin = getErc7984(name);
      coin.contractAddress.should.equal(expected.contractAddress);
      coin.underlyingErc20Address!.should.equal(expected.underlyingErc20Address);
      coin.rate!.should.equal(expected.rate);
      coin.requiresApprovalReset!.should.equal(expected.requiresApprovalReset);
    }
  });

  it('lowercases addresses on construction for test pairs', function () {
    const coin = getErc7984('hteth:cusdt');
    coin.contractAddress.should.equal(coin.contractAddress.toLowerCase());
    coin.underlyingErc20Address!.should.equal(coin.underlyingErc20Address!.toLowerCase());
  });
});
