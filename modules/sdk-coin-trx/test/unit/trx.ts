import assert from 'node:assert';
import { afterEach, before, describe, it, mock } from 'node:test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import * as _ from 'lodash';
import { Trx, Ttrx, Utils } from '../../src';
import { signTxOptions, mockTx } from '../fixtures';
import {
  baseAddressBalance,
  SampleRawTokenSendTxn,
  receiveAddressBalance,
  TestRecoverData,
  creationTransaction,
} from '../resources';

describe('TRON:', function () {
  const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.initializeTestVars();
  bitgo.safeRegister('trx', Trx.createInstance);
  bitgo.safeRegister('ttrx', Ttrx.createInstance);

  let basecoin;

  before(function () {
    basecoin = bitgo.coin('ttrx');
  });

  it('should instantiate the coin', function () {
    const basecoin = bitgo.coin('trx');
    assert.ok(basecoin instanceof Trx);
  });

  it('explain a txHex', async function () {
    const txHex = JSON.stringify(mockTx);
    const explainParams = {
      txHex,
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
    };
    const explanation = await basecoin.explainTransaction(explainParams);
    const toAddress = Utils.getBase58AddressFromHex(mockTx.raw_data.contract[0].parameter.value.to_address);
    assert.equal(explanation.id, mockTx.txID);
    assert.equal(explanation.outputs.length, 1);
    assert.equal(explanation.outputs[0].amount, '10');
    assert.equal(explanation.outputs[0].address, toAddress);
    assert.equal(explanation.outputAmount, '10');
    assert.equal(explanation.changeAmount, '0');
    assert.equal(explanation.changeOutputs.length, 0);
    assert.equal(explanation.fee.fee, 1);
    assert.equal(explanation.expiration, mockTx.raw_data.expiration);
    assert.equal(explanation.timestamp, mockTx.raw_data.timestamp);
  });

  it('should check valid addresses', function () {
    const badAddresses = [
      '',
      null,
      'xxxx',
      'YZ09fd-',
      '412C2BA4A9FF6C53207DC5B686BFECF75EA7B805772',
      '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80',
      'TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLLZ',
      '0x96be113992bdc3be24c11f6017085b605d253649',
      '0x341qg3922b1',
      '41E0C0F581D7D02D40826C1C6CBEE71F625D6344D0',
      '412C2BA4A9FF6C53207DC5B686BFECF75EA7B80577',
      '418840E6C55B9ADA326D211D818C34A994AECED808',
      '412A2B9F7641D0750C1E822D0E49EF765C8106524B',
      '41A614F803B6FD780986A42C78EC9C7F77E6DED13C',
      '418840E6C55B9ADA326D211D818C34A994AECED808',
    ];
    const goodAddresses = ['TBChwKYNaTo4a4N68Me1qEiiKsRDspXqLp', 'TPcf5jtYUhCN1X14tN577zF4NepbDZbxT7'];

    badAddresses.map((addr) => {
      assert.equal(basecoin.isValidAddress(addr), false);
    });
    goodAddresses.map((addr) => {
      assert.equal(basecoin.isValidAddress(addr), true);
    });
  });

  it('should throw if the params object is missing parameters', async function () {
    const explainParams = {
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
      txHex: null,
    };
    await assert.rejects(basecoin.explainTransaction(explainParams), {
      message: 'missing explain tx parameters',
    });
  });

  it('explain an half-signed/fully signed transaction', async function () {
    const txHex = JSON.stringify(mockTx);
    const explainParams = {
      halfSigned: { txHex },
      feeInfo: { fee: 1 },
      txID: mockTx.txID,
    };
    const explanation = await basecoin.explainTransaction(explainParams);
    const toAddress = Utils.getBase58AddressFromHex(mockTx.raw_data.contract[0].parameter.value.to_address);
    assert.equal(explanation.id, mockTx.txID);
    assert.equal(explanation.outputs.length, 1);
    assert.equal(explanation.outputs[0].amount, '10');
    assert.equal(explanation.outputs[0].address, toAddress);
    assert.equal(explanation.outputAmount, '10');
    assert.equal(explanation.changeAmount, '0');
    assert.equal(explanation.changeOutputs.length, 0);
    assert.equal(explanation.fee.fee, 1);
    assert.equal(explanation.expiration, mockTx.raw_data.expiration);
    assert.equal(explanation.timestamp, mockTx.raw_data.timestamp);
  });

  it('should sign a half signed tx', async function () {
    const tx = await basecoin.signTransaction(signTxOptions);
    const unsignedTxJson = JSON.parse(signTxOptions.txPrebuild.txHex);
    const signedTxJson = JSON.parse(tx.halfSigned.txHex);

    assert.equal(signedTxJson.txID, unsignedTxJson.txID);
    assert.equal(signedTxJson.raw_data_hex, unsignedTxJson.raw_data_hex);
    assert.deepStrictEqual(JSON.stringify(signedTxJson.raw_data), JSON.stringify(unsignedTxJson.raw_data));
    assert.equal(signedTxJson.signature.length, 1);
    assert.equal(
      signedTxJson.signature[0],
      '0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800'
    );
  });

  it('should sign with an Xprv a half signed tx', async function () {
    const p = {
      prv: 'xprv9s21ZrQH143K2sg2Cukk5XqLQdrYnMCDah3y1FFVy6Hz9bQfqMSfmUiHPVHKhcUyft3N1emE5FudJVxgFm5N12MAg5o7DTPsDATTkwNgr73',
      txPrebuild: {
        txHex: signTxOptions.txPrebuild.txHex,
      },
    };
    const tx = await basecoin.signTransaction(p);
    const unsignedTxJson = JSON.parse(signTxOptions.txPrebuild.txHex);
    const signedTxJson = JSON.parse(tx.halfSigned.txHex);

    assert.equal(signedTxJson.txID, unsignedTxJson.txID);
    assert.equal(signedTxJson.raw_data_hex, unsignedTxJson.raw_data_hex);
    assert.deepStrictEqual(JSON.stringify(signedTxJson.raw_data), JSON.stringify(unsignedTxJson.raw_data));
    assert.equal(signedTxJson.signature.length, 1);
    assert.equal(
      signedTxJson.signature[0],
      '65e56f53a458c6f82d1ef39b2cf5be685a906ad22bb02699f907fcb72ef26f1e91cfc2b6a43bf5432faa0b63bdc5aebf1dc2f49a675d28d23fd7e038b3358b0600'
    );
  });

  it('should add feeLimit to recipient', async function () {
    const feeLimit = 100;
    const buildParams = {
      recipients: [{ data: 'test' }],
      feeLimit,
    };
    basecoin.getExtraPrebuildParams(buildParams);
    assert.equal((buildParams as any).recipients[0].feeLimit, feeLimit);
  });

  it('should`t add any new field', async function () {
    const buildParams = {
      recipients: [{ data: 'test' }],
    };
    const unmodifiedBuildParams = _.cloneDeep(buildParams);
    await basecoin.getExtraPrebuildParams(buildParams);
    assert.deepStrictEqual(buildParams, unmodifiedBuildParams);
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      assert.ok(Object.prototype.hasOwnProperty.call(keyPair, 'pub'));
      assert.ok(Object.prototype.hasOwnProperty.call(keyPair, 'prv'));
      assert.equal(basecoin.isValidPub(keyPair.pub), true);
    });

    it('should generate a keypair from a seed', function () {
      const seedText =
        '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f24bab7dd0c2af7f107416ef858ff79b0670c72406dad064e72bb17fc0a9038bb';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      assert.equal(
        keyPair.pub,
        'xpub661MyMwAqRbcFAwqvSGbk35kJf7CQqdN1w4CMUBBTqH5e3ivjU6D8ugv9hRSgRbRenC4w3ahXdLVahwjgjXhSuQKMdNdn55Y9TNSagBktws'
      );
      assert.equal(
        keyPair.prv,
        'xprv9s21ZrQH143K2gsNpQjbNu91kdGi1NuWei8bZ5mZuVk6mFPnBvmxb7NSJQdbZW3FGpK3Ycn7jorAXcEzMvviGtbyBz5tBrjfnWyQp3g75FK'
      );
    });
  });

  describe('Build Unsigned Sweep', () => {
    afterEach(() => {
      mock.reset();
    });

    it('should recover trx from base address to recovery address', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(baseAddressBalance(3000000));
        }

        return undefined;
      });

      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);
      const destinationHex = Utils.getHexAddressFromBase58Address(TestRecoverData.recoveryDestination);

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === destinationHex && args[1] === baseAddrHex && args[2] === 900000) {
          return Promise.resolve(creationTransaction(baseAddrHex, destinationHex, 900000));
        }

        return undefined;
      });

      const res = await basecoin.recover({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        recoveryDestination: TestRecoverData.recoveryDestination,
      });
      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'txHex'));
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'feeInfo'));
      const rawData = JSON.parse(res.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData, 'contract'));
      const value = rawData.contract[0].parameter.value;
      assert.equal(value.amount, 900000);
      assert.equal(Utils.getBase58AddressFromHex(value.owner_address), TestRecoverData.baseAddress);
      assert.equal(Utils.getBase58AddressFromHex(value.to_address), TestRecoverData.recoveryDestination);
    });

    it('should recover trx from base address to recovery address with scan passed as valid integer string', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(baseAddressBalance(3000000));
        }

        return undefined;
      });

      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);
      const destinationHex = Utils.getHexAddressFromBase58Address(TestRecoverData.recoveryDestination);

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === destinationHex && args[1] === baseAddrHex && args[2] === 900000) {
          return Promise.resolve(creationTransaction(baseAddrHex, destinationHex, 900000));
        }

        return undefined;
      });

      const res = await basecoin.recover({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        recoveryDestination: TestRecoverData.recoveryDestination,
        scan: '10',
      });
      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'txHex'));
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'feeInfo'));
      const rawData = JSON.parse(res.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData, 'contract'));
      const value = rawData.contract[0].parameter.value;
      assert.equal(value.amount, 900000);
      assert.equal(Utils.getBase58AddressFromHex(value.owner_address), TestRecoverData.baseAddress);
      assert.equal(Utils.getBase58AddressFromHex(value.to_address), TestRecoverData.recoveryDestination);
    });

    it('should fail recover trx from base address to recovery address with scan passed as valid integer string', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(baseAddressBalance(3000000));
        }

        return undefined;
      });

      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);
      const destinationHex = Utils.getHexAddressFromBase58Address(TestRecoverData.recoveryDestination);

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === destinationHex && args[1] === baseAddrHex && args[2] === 900000) {
          return Promise.resolve(creationTransaction(baseAddrHex, destinationHex, 900000));
        }

        return undefined;
      });

      await assert.rejects(
        basecoin.recover({
          userKey: TestRecoverData.userKey,
          backupKey: TestRecoverData.backupKey,
          bitgoKey: TestRecoverData.bitgoKey,
          recoveryDestination: TestRecoverData.recoveryDestination,
          scan: 'abc',
        }),
        {
          message: 'Invalid scanning factor',
        }
      );
    });

    it('should recover trx from receive address to base address', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(baseAddressBalance(2000000));
        }

        if (args.length > 0 && args[0] === TestRecoverData.firstReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(102100000, TestRecoverData.firstReceiveAddress));
        }

        return undefined;
      });

      const firstReceiveAddressHex = Utils.getHexAddressFromBase58Address(TestRecoverData.firstReceiveAddress);
      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === baseAddrHex && args[1] === firstReceiveAddressHex && args[2] === 100000000) {
          return Promise.resolve(creationTransaction(firstReceiveAddressHex, baseAddrHex, 100000000));
        }

        return undefined;
      });

      const res = await basecoin.recover({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        recoveryDestination: TestRecoverData.recoveryDestination,
      });
      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'txHex'));
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'feeInfo'));
      const rawData = JSON.parse(res.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData, 'contract'));
      const value = rawData.contract[0].parameter.value;
      assert.equal(value.amount, 100000000);
      assert.equal(Utils.getBase58AddressFromHex(value.owner_address), TestRecoverData.firstReceiveAddress);
      assert.equal(Utils.getBase58AddressFromHex(value.to_address), TestRecoverData.baseAddress);
    });

    it('should recover token from base address to recovery address', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(
            baseAddressBalance(100000000, [
              {
                TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id: '1000000000',
              },
              {
                TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs: '1100000000',
              },
            ])
          );
        }

        return undefined;
      });

      mock.method(Trx.prototype as any, 'getTriggerSmartContractTransaction', (...args) => {
        return Promise.resolve(SampleRawTokenSendTxn);
      });

      const res = await basecoin.recover({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        tokenContractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
        recoveryDestination: TestRecoverData.recoveryDestination,
      });
      assert.notEqual(res.length, 0);
      assert.equal(res.recoveryAmount, 1100000000);
      assert.equal(res.feeInfo.fee, '100000000');
      const expirationDuration = res.tx.raw_data.expiration - res.tx.raw_data.timestamp;
      assert.ok(expirationDuration >= 86400000);
      assert.equal(res.addressInfo, undefined);
      const rawData = JSON.parse(res.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData, 'contract'));
      const value = rawData.contract[0].parameter.value;
      assert.equal(Utils.getBase58AddressFromHex(value.owner_address), TestRecoverData.baseAddress);
      assert.equal(Utils.getBase58AddressFromHex(value.contract_address), 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs');
    });

    it('should throw if trx balance at base address is not sufficient to cover token send', async function () {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.baseAddress) {
          return Promise.resolve(
            baseAddressBalance(1000000, [
              {
                TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs: '1100000000',
              },
            ])
          );
        }

        return undefined;
      });

      mock.method(Trx.prototype as any, 'getTriggerSmartContractTransaction', (...args) => {
        return Promise.resolve(SampleRawTokenSendTxn);
      });

      await assert.rejects(
        basecoin.recover({
          userKey: TestRecoverData.userKey,
          backupKey: TestRecoverData.backupKey,
          bitgoKey: TestRecoverData.bitgoKey,
          tokenContractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
          recoveryDestination: TestRecoverData.recoveryDestination,
        }),
        {
          message:
            "Amount of funds to recover 1000000 is less than 100000000 and wouldn't be able to fund a trc20 send",
        }
      );
    });
  });

  describe('Build Unsigned Consolidation Recoveries', () => {
    afterEach(() => {
      mock.reset();
    });

    it('should throw if startingScanIndex is not ge to 1', async () => {
      await assert.rejects(
        basecoin.recoverConsolidations({
          userKey: TestRecoverData.userKey,
          backupKey: TestRecoverData.backupKey,
          bitgoKey: TestRecoverData.bitgoKey,
          startingScanIndex: -1,
        }),
        {
          message:
            'Invalid starting or ending index to scan for addresses. startingScanIndex: -1, endingScanIndex: 19.',
        }
      );
    });

    it('should throw if scan factor is too high', async () => {
      await assert.rejects(
        basecoin.recoverConsolidations({
          userKey: TestRecoverData.userKey,
          backupKey: TestRecoverData.backupKey,
          bitgoKey: TestRecoverData.bitgoKey,
          startingScanIndex: 1,
          endingScanIndex: 300,
        }),
        {
          message:
            'Invalid starting or ending index to scan for addresses. startingScanIndex: 1, endingScanIndex: 300.',
        }
      );
    });

    it('should build consolidate recoveries', async () => {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.firstReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(102100000, TestRecoverData.firstReceiveAddress));
        }

        if (args.length > 0 && args[0] === TestRecoverData.secondReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(50000000, TestRecoverData.secondReceiveAddress));
        }

        return undefined;
      });

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === baseAddrHex && args[1] === firstReceiveAddrHex && args[2] === 100000000) {
          return Promise.resolve(creationTransaction(firstReceiveAddrHex, baseAddrHex, 100000000));
        }

        if (args.length > 0 && args[0] === baseAddrHex && args[1] === secondReceiveAddrHex && args[2] === 47900000) {
          return Promise.resolve(creationTransaction(secondReceiveAddrHex, baseAddrHex, 47900000));
        }

        return undefined;
      });

      const firstReceiveAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.firstReceiveAddress);
      const secondReceiveAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.secondReceiveAddress);
      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);

      const res = await basecoin.recoverConsolidations({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });

      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'transactions'));
      assert.equal(res.transactions.length, 2);
      const txn1 = res.transactions[0];
      const rawData1 = JSON.parse(txn1.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData1, 'contract'));
      const value1 = rawData1.contract[0].parameter.value;
      assert.equal(value1.amount, 100000000);
      assert.equal(Utils.getBase58AddressFromHex(value1.owner_address), TestRecoverData.firstReceiveAddress);
      assert.equal(Utils.getBase58AddressFromHex(value1.to_address), TestRecoverData.baseAddress);
      const txn2 = res.transactions[1];
      const rawData2 = JSON.parse(txn2.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData2, 'contract'));
      const value2 = rawData2.contract[0].parameter.value;
      assert.equal(value2.amount, 47900000);
      assert.equal(Utils.getBase58AddressFromHex(value2.owner_address), TestRecoverData.secondReceiveAddress);
      assert.equal(Utils.getBase58AddressFromHex(value2.to_address), TestRecoverData.baseAddress);
    });

    it('should build consolidate token recoveries', async () => {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.firstReceiveAddress) {
          return Promise.resolve(
            receiveAddressBalance(202100000, TestRecoverData.firstReceiveAddress, [
              {
                TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id: '1100000000',
              },
            ])
          );
        }

        if (args.length > 0 && args[0] === TestRecoverData.secondReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(500, TestRecoverData.secondReceiveAddress));
        }

        return undefined;
      });

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === baseAddrHex && args[1] === firstReceiveAddrHex && args[2] === 1100000000) {
          return Promise.resolve(creationTransaction(firstReceiveAddrHex, baseAddrHex, 1100000000));
        }

        return undefined;
      });

      const firstReceiveAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.firstReceiveAddress);
      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);

      const res = await basecoin.recoverConsolidations({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        tokenContractAddress: 'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id',
        startingScanIndex: 1,
        endingScanIndex: 3,
      });

      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'transactions'));
      assert.equal(res.transactions.length, 1);
      const txn = res.transactions[0];
      const rawData = JSON.parse(txn.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData, 'contract'));
      const value = rawData.contract[0].parameter.value;
      assert.equal(
        value.data,
        'a9059cbb000000000000000000000000c25420255c2c5a2dd54ef69f92ef261e6bd4216a000000000000000000000000000000000000000000000000000000004190ab00'
      );
      assert.equal(Utils.getBase58AddressFromHex(value.owner_address), TestRecoverData.firstReceiveAddress);
      assert.equal(Utils.getBase58AddressFromHex(value.contract_address), 'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id');
    });

    it('should skip building consolidate transaction if balance is lower than reserved fee', async () => {
      mock.method(Trx.prototype as any, 'getAccountBalancesFromNode', (...args) => {
        if (args.length > 0 && args[0] === TestRecoverData.firstReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(102100000, TestRecoverData.firstReceiveAddress));
        }

        if (args.length > 0 && args[0] === TestRecoverData.secondReceiveAddress) {
          return Promise.resolve(receiveAddressBalance(2000000, TestRecoverData.secondReceiveAddress));
        }

        return undefined;
      });

      mock.method(Trx.prototype as any, 'getBuildTransaction', (...args) => {
        if (args.length > 0 && args[0] === baseAddrHex && args[1] === firstReceiveAddrHex && args[2] === 100000000) {
          return Promise.resolve(creationTransaction(firstReceiveAddrHex, baseAddrHex, 100000000));
        }

        return undefined;
      });

      const firstReceiveAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.firstReceiveAddress);
      const baseAddrHex = Utils.getHexAddressFromBase58Address(TestRecoverData.baseAddress);

      const res = await basecoin.recoverConsolidations({
        userKey: TestRecoverData.userKey,
        backupKey: TestRecoverData.backupKey,
        bitgoKey: TestRecoverData.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 3,
      });

      assert.notEqual(res.length, 0);
      assert.ok(Object.prototype.hasOwnProperty.call(res, 'transactions'));
      assert.equal(res.transactions.length, 1);
      const txn1 = res.transactions[0];
      const rawData1 = JSON.parse(txn1.txHex).raw_data;
      assert.ok(Object.prototype.hasOwnProperty.call(rawData1, 'contract'));
      const value1 = rawData1.contract[0].parameter.value;
      assert.equal(value1.amount, 100000000);
      assert.equal(Utils.getBase58AddressFromHex(value1.owner_address), TestRecoverData.firstReceiveAddress);
      assert.equal(Utils.getBase58AddressFromHex(value1.to_address), TestRecoverData.baseAddress);
    });
  });
});
