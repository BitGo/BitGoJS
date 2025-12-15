import { Tempo } from '../../src/tempo';
import { Ttempo } from '../../src/ttempo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

describe('Tempo Coin', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  const registerCoin = (name: string, coinClass: typeof Tempo | typeof Ttempo): void => {
    bitgo.safeRegister(name, (bitgo: BitGoBase) => {
      // Create a mock statics coin
      const mockStaticsCoin: Readonly<StaticsBaseCoin> = {
        name,
        fullName: name === 'tempo' ? 'Tempo' : 'Testnet Tempo',
        network: {
          type: name === 'tempo' ? 'mainnet' : 'testnet',
        } as any,
        features: [],
      } as any;
      return coinClass.createInstance(bitgo, mockStaticsCoin);
    });
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    registerCoin('tempo', Tempo);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tempo');
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('tempo');
    basecoin.should.be.an.instanceof(Tempo);
  });

  it('should return the correct coin name', function () {
    basecoin.getChain().should.equal('tempo');
    basecoin.getFullName().should.equal('Tempo');
    basecoin.getBaseFactor().should.equal(1e18);
  });

  describe('Testnet', function () {
    let testnetBasecoin;

    before(function () {
      registerCoin('ttempo', Ttempo);
      testnetBasecoin = bitgo.coin('ttempo');
    });

    it('should instantiate the testnet coin', function () {
      testnetBasecoin.should.be.an.instanceof(Ttempo);
    });

    it('should return the correct testnet coin name', function () {
      testnetBasecoin.getChain().should.equal('ttempo');
      testnetBasecoin.getFullName().should.equal('Testnet Tempo');
      testnetBasecoin.getBaseFactor().should.equal(1e18);
    });
  });
});
