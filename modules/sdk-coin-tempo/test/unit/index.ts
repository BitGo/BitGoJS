import { Tempo } from '../../src/tempo';
import { Ttempo } from '../../src/ttempo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoBase, InvalidAddressError, InvalidMemoIdError } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as should from 'should';

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

  describe('Address Validation', function () {
    it('should validate plain EVM address', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f').should.equal(true);
      basecoin.isValidAddress('0x0000000000000000000000000000000000000000').should.equal(true);
    });

    it('should validate address with memoId', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=8').should.equal(true);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=0').should.equal(true);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=12345').should.equal(true);
    });

    it('should reject invalid addresses', function () {
      basecoin.isValidAddress('invalid').should.equal(false);
      basecoin.isValidAddress('').should.equal(false);
      basecoin.isValidAddress('0x123').should.equal(false); // Too short
    });

    it('should reject address with invalid memoId', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=abc').should.equal(false);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=-1').should.equal(false);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=1.5').should.equal(false);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=01').should.equal(false); // Leading zero
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=').should.equal(false); // Empty memoId
    });

    it('should reject address with unknown query parameters', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?invalid=123').should.equal(false);
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?foo=bar').should.equal(false);
    });

    it('should reject address with multiple memoId parameters', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=1&memoId=2').should.equal(false);
    });

    it('should reject address with extra query parameters besides memoId', function () {
      basecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=1&foo=bar').should.equal(false);
    });
  });

  describe('getAddressDetails', function () {
    it('should get address details without memoId', function () {
      const addressDetails = basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f');
      addressDetails.address.should.equal('0x2476602c78e9a5e0563320c78878faa3952b256f');
      addressDetails.baseAddress.should.equal('0x2476602c78e9a5e0563320c78878faa3952b256f');
      should.not.exist(addressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const addressDetails = basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=8');
      addressDetails.address.should.equal('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=8');
      addressDetails.baseAddress.should.equal('0x2476602c78e9a5e0563320c78878faa3952b256f');
      addressDetails.memoId.should.equal('8');
    });

    it('should throw on invalid memoId address', function () {
      (() => basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=abc')).should.throw(
        InvalidMemoIdError
      );
    });

    it('should throw on multiple memoId address', function () {
      (() => basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=1&memoId=2')).should.throw(
        InvalidAddressError
      );
    });

    it('should throw on unknown query parameters', function () {
      (() => basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?invalid=8')).should.throw(
        InvalidAddressError
      );
    });

    it('should throw on empty memoId', function () {
      (() => basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=')).should.throw(
        InvalidAddressError
      );
    });

    it('should throw on extra query parameters besides memoId', function () {
      (() => basecoin.getAddressDetails('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=1&foo=bar')).should.throw(
        InvalidAddressError
      );
    });
  });

  describe('isValidMemoId', function () {
    it('should validate correct memoIds', function () {
      basecoin.isValidMemoId('0').should.equal(true);
      basecoin.isValidMemoId('1').should.equal(true);
      basecoin.isValidMemoId('12345').should.equal(true);
      basecoin.isValidMemoId('999999999999').should.equal(true);
    });

    it('should reject invalid memoIds', function () {
      basecoin.isValidMemoId('').should.equal(false);
      basecoin.isValidMemoId('-1').should.equal(false);
      basecoin.isValidMemoId('1.5').should.equal(false);
      basecoin.isValidMemoId('abc').should.equal(false);
      basecoin.isValidMemoId('01').should.equal(false); // Leading zero
      basecoin.isValidMemoId('00').should.equal(false);
    });
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

    it('should validate address with memoId on testnet', function () {
      testnetBasecoin.isValidAddress('0x2476602c78e9a5e0563320c78878faa3952b256f?memoId=8').should.equal(true);
    });
  });
});
