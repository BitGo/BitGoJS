import should = require('should');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { HashToken } from '../../src';
import HashUtils from '../../src/lib/utils';
import { mainnetAddress, testnetAddress } from '../resources/hash';

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

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const mainnetAddressDetails = mainnetHashToken.getAddressDetails(mainnetAddress.noMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.noMemoIdAddress);
      should.not.exist(mainnetAddressDetails.memoId);

      const testnetAddressDetails = testnetHashToken.getAddressDetails(testnetAddress.noMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.noMemoIdAddress);
      should.not.exist(testnetAddressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const mainnetAddressDetails = mainnetHashToken.getAddressDetails(mainnetAddress.validMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.validMemoIdAddress.split('?')[0]);
      mainnetAddressDetails.memoId.should.equal('2');

      const testnetAddressDetails = testnetHashToken.getAddressDetails(testnetAddress.validMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.validMemoIdAddress.split('?')[0]);
      testnetAddressDetails.memoId.should.equal('2');
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        mainnetHashToken.getAddressDetails(mainnetAddress.multipleMemoIdAddress);
      }).should.throw();
      (() => {
        testnetHashToken.getAddressDetails(testnetAddress.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const receiveAddress = {
        address: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj?memoId=7',
        coinSpecific: {
          rootAddress: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj',
          memoID: '7',
        },
      };
      const isValid = await testnetHashToken.isWalletAddress(receiveAddress);
      isValid.should.equal(true);
    });

    it('should validate account addresses correctly', () => {
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address1), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address2), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address3), false);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.address4), false);
      should.equal(mainnetHashToken._utils.isValidAddress('dfjk35y'), false);
      should.equal(mainnetHashToken._utils.isValidAddress(undefined as unknown as string), false);
      should.equal(mainnetHashToken._utils.isValidAddress(''), false);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.validMemoIdAddress), true);
      should.equal(mainnetHashToken._utils.isValidAddress(mainnetAddress.multipleMemoIdAddress), false);

      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address1), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address2), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address3), false);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.address4), false);
      should.equal(testnetHashToken._utils.isValidAddress('dfjk35y'), false);
      should.equal(testnetHashToken._utils.isValidAddress(undefined as unknown as string), false);
      should.equal(testnetHashToken._utils.isValidAddress(''), false);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.validMemoIdAddress), true);
      should.equal(testnetHashToken._utils.isValidAddress(testnetAddress.multipleMemoIdAddress), false);
    });

    it('should validate validator addresses correctly', () => {
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress1), true);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress2), true);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress3), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(mainnetAddress.validatorAddress4), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(mainnetHashToken._utils.isValidValidatorAddress(''), false);

      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress1), true);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress2), true);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress3), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(testnetAddress.validatorAddress4), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(testnetHashToken._utils.isValidValidatorAddress(''), false);
    });
  });
});
