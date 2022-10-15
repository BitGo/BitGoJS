import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, Tsui } from '../../src';
import * as testData from '../resources/sui';
import * as _ from 'lodash';

describe('SUI:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: testData.TRANSFER_TX,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: testData.recipients.recipient1,
        amount: testData.AMOUNT.toString(),
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sui', Sui.createInstance);
    bitgo.safeRegister('tsui', Tsui.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsui');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should retun the right info', function () {
    const sui = bitgo.coin('sui');
    const tsui = bitgo.coin('tsui');

    sui.getChain().should.equal('sui');
    sui.getFamily().should.equal('sui');
    sui.getFullName().should.equal('Sui');
    sui.getBaseFactor().should.equal(1e9);

    tsui.getChain().should.equal('tsui');
    tsui.getFamily().should.equal('sui');
    tsui.getFullName().should.equal('Testnet Sui');
    tsui.getBaseFactor().should.equal(1e9);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction in base64 encoding', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });
  });

  describe('Address Validation', () => {
    it('should return true when validating a well formatted address', async function () {
      const address = 'd4f6d75cf725f5931ba62b5b554c2d7efa709f66';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xd4f6d75cf725f5931ba62b5b554c2d7efa709f66';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });
  });
});
