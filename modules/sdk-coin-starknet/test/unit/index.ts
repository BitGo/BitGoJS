import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Starknet } from '../../src';

describe('Starknet:', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('starknet', Starknet.createInstance);
    bitgo.safeRegister('tstarknet', Starknet.createInstance);
    bitgo.initializeTestVars();
  });

  it('should retrieve the mainnet coin', function () {
    const coin = bitgo.coin('starknet');
    coin.getChain().should.equal('starknet');
    coin.getFamily().should.equal('starknet');
    coin.getFullName().should.equal('Starknet');
    coin.getBaseFactor().should.equal(1e18);
    coin.supportsTss().should.equal(true);
    coin.getMPCAlgorithm().should.equal('ecdsa');
  });

  it('should retrieve the testnet coin', function () {
    const coin = bitgo.coin('tstarknet');
    coin.getChain().should.equal('tstarknet');
    coin.getFamily().should.equal('starknet');
    coin.getFullName().should.equal('Testnet Starknet');
    coin.getBaseFactor().should.equal(1e18);
    coin.supportsTss().should.equal(true);
    coin.getMPCAlgorithm().should.equal('ecdsa');
  });
});
