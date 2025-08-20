import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { HashToken } from '../../src';
import HashUtils from '../../src/lib/utils';

describe('Hash Tokens', function () {
  let bitgo: TestBitGoAPI;
  let mainnetHashToken;
  let testnetHashToken;
  const testnetTokenName = 'thash:ylds';
  const mainnetTokenName = 'hash:ylds';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    HashToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    mainnetHashToken = bitgo.coin(mainnetTokenName);
    testnetHashToken = bitgo.coin(testnetTokenName);
  });

  it('should return constants for Hash YLDS testnet token', function () {
    testnetHashToken.getChain().should.equal(testnetTokenName);
    testnetHashToken.getBaseChain().should.equal('thash');
    testnetHashToken.getFullName().should.equal('Hash Token');
    testnetHashToken.getBaseFactor().should.equal(1e6);
    testnetHashToken.type.should.equal(testnetTokenName);
    testnetHashToken.name.should.equal('Testnet YLDS Token');
    testnetHashToken.coin.should.equal('thash');
    testnetHashToken.network.should.equal('Testnet');
    testnetHashToken.denom.should.equal('uylds.fcc');
    testnetHashToken.decimalPlaces.should.equal(6);
  });

  it('should return constants for Hash YLDS mainnet token', function () {
    mainnetHashToken.getChain().should.equal(mainnetTokenName);
    mainnetHashToken.getBaseChain().should.equal('hash');
    mainnetHashToken.getFullName().should.equal('Hash Token');
    mainnetHashToken.getBaseFactor().should.equal(1e6);
    mainnetHashToken.type.should.equal(mainnetTokenName);
    mainnetHashToken.name.should.equal('YLDS Token');
    mainnetHashToken.coin.should.equal('hash');
    mainnetHashToken.network.should.equal('Mainnet');
    mainnetHashToken.denom.should.equal('uylds.fcc');
    mainnetHashToken.decimalPlaces.should.equal(6);
  });

  it('should return denomination for YLDS token on hash using hash as coinFamily', function () {
    HashUtils.getTokenDenomsUsingCoinFamily('hash').should.deepEqual(['uylds.fcc']);
  });
});
