import should from 'should';
import { pubKeyfromPrivKey, publicKeyToString } from '@stacks/transactions';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';

import { Stx, Tstx, StxLib } from '../../../src';
import * as testData from '../resources';

describe('Stacks: sBTC Withdraw Builder', function () {
  const coinNameTest = 'tstx';
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    bitgo.safeRegister('tstx', Tstx.createInstance);
  });

  describe('sBTC Withdraw Builder', () => {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(coinNameTest));

    const initTxBuilder = () => {
      const txBuilder = factory.getSbtcWithdrawBuilder();
      txBuilder.fee({ fee: '1000' });
      txBuilder.nonce(1);
      return txBuilder;
    };

    describe('should build', function () {
      it('a withdrawal with P2PKH address', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '100000',
          btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          maxFee: '5000',
        });
        builder.sign({ key: testData.prvKeysString[0] });
        builder.sign({ key: testData.prvKeysString[1] });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.fee.should.equal('1000');
        txJson.nonce.should.equal(1);
        should.exist(txJson.payload);
        txJson.payload.should.have.property('contractName', 'sbtc-withdrawal');
        txJson.payload.should.have.property('functionName', 'initiate-withdrawal-request');
      });

      it('a withdrawal with P2SH address', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '200000',
          btcAddress: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
          maxFee: '3000',
        });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.payload.should.have.property('functionName', 'initiate-withdrawal-request');
      });

      it('a withdrawal with P2WPKH (bech32) address', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '50000',
          btcAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          maxFee: '2000',
        });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.payload.should.have.property('functionName', 'initiate-withdrawal-request');
      });

      it('a withdrawal with P2WSH (bech32) address', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '75000',
          btcAddress: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
          maxFee: '4000',
        });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.payload.should.have.property('functionName', 'initiate-withdrawal-request');
      });

      it('a withdrawal with P2TR (bech32m) address', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '300000',
          btcAddress: 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
          maxFee: '10000',
        });
        const tx = await builder.build();
        const txJson = tx.toJson();
        txJson.payload.should.have.property('functionName', 'initiate-withdrawal-request');
      });
    });

    describe('round-trip: serialize → deserialize → rebuild', function () {
      it('should rebuild a signed withdrawal transaction from raw hex', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '100000',
          btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          maxFee: '5000',
        });
        builder.sign({ key: testData.prvKeysString[0] });
        builder.sign({ key: testData.prvKeysString[1] });
        const tx = await builder.build();

        const rawHex = tx.toBroadcastFormat();
        should.exist(rawHex);

        // Deserialize
        const rebuilder = factory.from(rawHex);
        const tx2 = await rebuilder.build();
        tx2.toBroadcastFormat().should.equal(rawHex);
      });

      it('should rebuild an unsigned withdrawal transaction from raw hex', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        builder.withdraw({
          amount: '100000',
          btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          maxFee: '5000',
        });
        const tx = await builder.build();

        const rawHex = tx.toBroadcastFormat();

        // Deserialize and sign
        const rebuilder = factory.from(rawHex);
        rebuilder.sign({ key: testData.prvKeysString[0] });
        rebuilder.sign({ key: testData.prvKeysString[1] });
        const tx2 = await rebuilder.build();
        should.exist(tx2.toBroadcastFormat());
      });
    });

    describe('validation', function () {
      it('should reject invalid amount', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '-1',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '5000',
            }),
          /Invalid or missing amount/
        );
      });

      it('should reject zero amount', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '0',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '5000',
            }),
          /Invalid or missing amount/
        );
      });

      it('should reject empty amount', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '5000',
            }),
          /Invalid or missing amount/
        );
      });

      it('should reject invalid BTC address', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '100000',
              btcAddress: 'invalidaddress',
              maxFee: '5000',
            }),
          /Invalid or missing btcAddress/
        );
      });

      it('should reject invalid maxFee', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '100000',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '-100',
            }),
          /Invalid or missing maxFee/
        );
      });

      it('should reject zero maxFee', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '100000',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '0',
            }),
          /Invalid or missing maxFee/
        );
      });

      it('should reject empty maxFee', function () {
        const builder = initTxBuilder();
        should.throws(
          () =>
            builder.withdraw({
              amount: '100000',
              btcAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
              maxFee: '',
            }),
          /Invalid or missing maxFee/
        );
      });

      it('should fail to build without withdraw params', async () => {
        const builder = initTxBuilder();
        const pubKeys = testData.prvKeysString.map(pubKeyfromPrivKey);
        const pubKeyStrings = pubKeys.map(publicKeyToString);
        builder.fromPubKey(pubKeyStrings);
        builder.numberSignatures(2);
        await builder.build().should.be.rejectedWith(/Withdrawal params are not set/);
      });
    });
  });
});
