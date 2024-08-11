import { bip32 } from '@bitgo/utxo-lib';
import { common } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import {
  runBasicCoinInfoTests,
  runExplainTransactionTests,
  runRecoveryTransactionTests,
  runSignTransactionTests,
  runTransactionVerificationTests,
} from '@bitgo/abstract-eth';

import { Zketh, Tzketh, TransactionBuilder } from '../../src';
import * as mockData from '../fixtures/zketh';
import { getBuilder } from '../getBuilder';
import * as testData from '../resources';

describe('zkSync', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  const coinTest = testData.COIN;
  const coinMain = coinTest.slice(1);

  describe('Basic Coin Info', function () {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Zketh.createInstance);
    bitgo.safeRegister(coinTest, Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    runBasicCoinInfoTests('Zketh', bitgo, Zketh, Tzketh, testData);
  });

  describe('Explain transaction:', async () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Zketh.createInstance);
    bitgo.safeRegister(coinTest, Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const txBuilder: TransactionBuilder = getBuilder(coinTest) as TransactionBuilder;
    await runExplainTransactionTests('Zketh', txBuilder, basecoin, testData);
  });

  describe('Sign Transaction', async () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Zketh.createInstance);
    bitgo.safeRegister(coinTest, Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    const builder = getBuilder(coinTest) as TransactionBuilder;
    await runSignTransactionTests('Zketh', builder, basecoin, testData);
  });

  describe('Transaction Verification', async () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Zketh.createInstance);
    bitgo.safeRegister(coinTest, Tzketh.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinTest);
    await runTransactionVerificationTests('Zketh', bitgo, basecoin, testData);
  });

  describe('Recover transaction:', async () => {
    const bitgoKeyXprv =
      'xprv9s21ZrQH143K3tpWBHWe31sLoXNRQ9AvRYJgitkKxQ4ATFQMwvr7hHNqYRUnS7PsjzB7aK1VxqHLuNQjj1sckJ2Jwo2qxmsvejwECSpFMfC';
    const bitgoKey = bip32.fromBase58(bitgoKeyXprv);
    if (!bitgoKey.privateKey) {
      throw new Error('no privateKey');
    }
    const bitgoXpub = bitgoKey.neutered().toBase58();
    const env = 'test';
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    common.Environments[env].hsmXpub = bitgoXpub;
    bitgo = TestBitGo.decorate(BitGoAPI, { env });
    bitgo.safeRegister(coinMain, Zketh.createInstance);
    bitgo.safeRegister(coinTest, Tzketh.createInstance);
    bitgo.initializeTestVars();
    const txBuilder = getBuilder(coinTest) as TransactionBuilder;
    await runRecoveryTransactionTests('Zketh', txBuilder, bitgo, testData, mockData);
  });
});
