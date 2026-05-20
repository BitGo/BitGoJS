import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AptToken } from '../../src';
import _ from 'lodash';
import * as testData from '../resources/apt';

describe('Apt Tokens', function () {
  let bitgo: TestBitGoAPI;
  let aptTokenCoin;
  const tokenName = 'tapt:usdt';
  let newTxPrebuild;
  let newTxParams;

  const txPreBuild = {
    txHex: testData.FUNGIBLE_SERIALIZED_TX_HEX,
    txInfo: {},
  };

  const txParams = {
    recipients: [testData.fungibleTokenRecipients[1]],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    AptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    aptTokenCoin = bitgo.coin(tokenName);
    newTxPrebuild = () => {
      return _.cloneDeep(txPreBuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should return constants', function () {
    aptTokenCoin.getChain().should.equal(tokenName);
    aptTokenCoin.getBaseChain().should.equal('tapt');
    aptTokenCoin.getFullName().should.equal('Apt Token');
    aptTokenCoin.getBaseFactor().should.equal(1e6);
    aptTokenCoin.type.should.equal(tokenName);
    aptTokenCoin.name.should.equal('USD Tether');
    aptTokenCoin.coin.should.equal('tapt');
    aptTokenCoin.network.should.equal('Testnet');
    aptTokenCoin.assetId.should.equal('0xd5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e38192050');
    aptTokenCoin.decimalPlaces.should.equal(6);
  });

  it('should succeed to verify a fungible transaction', async function () {
    const txPrebuild = newTxPrebuild();
    const txParams = newTxParams();
    const verification = {};
    const isTransactionVerified = await aptTokenCoin.verifyTransaction({ txParams, txPrebuild, verification });
    isTransactionVerified.should.equal(true);
  });
});
