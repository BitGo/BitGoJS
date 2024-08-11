import 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Bsc, Tbsc } from '../../src/';
import { runBasicCoinInfoTests } from '@bitgo/abstract-eth';
import * as testData from '../resources/bsc';

describe('Binance Smart Chain', function () {
  describe('Basic Coin Info', () => {
    const env = 'test';
    const coinTest = testData.COIN;
    const coinMain = coinTest.slice(1);
    const bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Bsc.createInstance);
    bitgo.safeRegister(coinTest, Tbsc.createInstance);
    bitgo.initializeTestVars();
    runBasicCoinInfoTests('Bsc', bitgo, Bsc, Tbsc, testData);
  });
});
