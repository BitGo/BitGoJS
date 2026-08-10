import 'should';
import { Networks } from '../../src';
import {
  erc7984Registry,
  getWrapperPair,
  getActiveWrapperPairs,
  Erc7984WrapperPair,
} from '../../src/erc7984Registry';

describe('ERC-7984 Statics Registry', function () {
  describe('erc7984Registry shape', function () {
    it('should have an entry for Hoodi testnet', function () {
      const pairs = erc7984Registry[Networks.test.hoodi.name];
      pairs.should.be.an.Array().and.not.be.empty();
    });

    it('should have an entry for Ethereum mainnet', function () {
      const pairs = erc7984Registry[Networks.main.ethereum.name];
      pairs.should.be.an.Array().and.not.be.empty();
    });

    it('every pair has required fields with correct types', function () {
      Object.values(erc7984Registry).forEach((pairs) => {
        pairs.forEach((pair: Erc7984WrapperPair) => {
          pair.wrapperAddress.should.be.a.String().and.match(/^0x[0-9a-f]{40}$/);
          pair.underlyingErc20Address.should.be.a.String().and.match(/^0x[0-9a-f]{40}$/);
          (typeof pair.rate).should.equal('bigint');
          pair.rate.should.be.greaterThanOrEqual(1n);
          pair.requiresApprovalReset.should.be.a.Boolean();
          pair.isVetted.should.be.a.Boolean();
          pair.isActive.should.be.a.Boolean();
        });
      });
    });

    it('wrapper addresses are unique within each network', function () {
      Object.entries(erc7984Registry).forEach(([networkName, pairs]) => {
        const addresses = pairs.map((p) => p.wrapperAddress);
        const unique = new Set(addresses);
        unique.size.should.equal(addresses.length, `duplicate wrapper address on ${networkName}`);
      });
    });
  });

  describe('getWrapperPair', function () {
    it('returns the correct Hoodi testnet pair for hteth:ctest1', function () {
      const pair = getWrapperPair(
        Networks.test.hoodi.name,
        '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1'
      );
      pair.should.not.be.undefined();
      pair!.wrapperAddress.should.equal('0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1');
      pair!.rate.should.equal(1n);
      pair!.isVetted.should.be.true();
      pair!.isActive.should.be.true();
      pair!.requiresApprovalReset.should.be.false();
    });

    it('returns the correct Hoodi testnet pair for hteth:cusdt', function () {
      const pair = getWrapperPair(
        Networks.test.hoodi.name,
        '0x2debbe0487ef921df4457f9e36ed05be2df1ac75'
      );
      pair.should.not.be.undefined();
      pair!.requiresApprovalReset.should.be.true();
    });

    it('is case-insensitive for the wrapper address', function () {
      const lower = getWrapperPair(
        Networks.test.hoodi.name,
        '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1'
      );
      const mixed = getWrapperPair(
        Networks.test.hoodi.name,
        '0x7B1D59BbCD291daA59CB6C8C5bC04DE1aFC4ABA1'
      );
      lower.should.not.be.undefined();
      mixed.should.not.be.undefined();
      lower!.wrapperAddress.should.equal(mixed!.wrapperAddress);
    });

    it('returns undefined for an unknown network', function () {
      const pair = getWrapperPair('unknown-network', '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1');
      (pair === undefined).should.be.true();
    });

    it('returns undefined for an address not in the registry', function () {
      const pair = getWrapperPair(
        Networks.test.hoodi.name,
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
      );
      (pair === undefined).should.be.true();
    });

    it('returns the correct mainnet pair for eth:cusdt', function () {
      const pair = getWrapperPair(
        Networks.main.ethereum.name,
        '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50'
      );
      pair.should.not.be.undefined();
      pair!.underlyingErc20Address.should.equal(
        '0xdac17f958d2ee523a2206206994597c13d831ec7'
      );
      pair!.requiresApprovalReset.should.be.true();
    });

    it('returns the correct mainnet pair for eth:cusdc', function () {
      const pair = getWrapperPair(
        Networks.main.ethereum.name,
        '0xe978f22157048e5db8e5d07971376e86671672b2'
      );
      pair.should.not.be.undefined();
      pair!.underlyingErc20Address.should.equal(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      );
      pair!.requiresApprovalReset.should.be.false();
    });
  });

  describe('getActiveWrapperPairs', function () {
    it('returns only vetted and active pairs for Hoodi', function () {
      const pairs = getActiveWrapperPairs(Networks.test.hoodi.name);
      pairs.should.be.an.Array().and.not.be.empty();
      pairs.every((p) => p.isVetted && p.isActive).should.be.true();
    });

    it('returns only vetted and active pairs for Ethereum mainnet', function () {
      const pairs = getActiveWrapperPairs(Networks.main.ethereum.name);
      pairs.should.be.an.Array().and.not.be.empty();
      pairs.every((p) => p.isVetted && p.isActive).should.be.true();
    });

    it('returns empty array for an unknown network', function () {
      const pairs = getActiveWrapperPairs('no-such-network');
      pairs.should.be.an.Array().and.be.empty();
    });
  });
});
