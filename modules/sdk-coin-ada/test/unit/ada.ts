/**
 * @prettier
 */

import should = require('should');
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
// import { randomBytes } from 'crypto';
import {
  rawTx,
  enterpriseAccounts as accounts,
  // validatorContractAddress,
  // blockHash,
  // keys,
  // accountInfo,
} from '../resources';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import { Ada, Tada, Transaction } from '../../src';
// import { getBuilderFactory } from './getBuilderFactory';

describe('ADA', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;
  // const factory = getBuilderFactory('tada');

  const txPrebuild = {
    txHex: rawTx.unsignedTx,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
        amount: '1000000000000000000000000',
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tada', Ada.createInstance);
    bitgo.safeRegister('ada', Tada.createInstance);
    basecoin = bitgo.coin('tada');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  describe('Sign transaction', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: rawTx.unsignedTx,
        },
        pubs: [accounts.account1.publicKey],
        prv: accounts.account1.secretKey,
      });
      // console.log(signed.toJson());
      signed.txHex.should.equal(rawTx.signedTx);
    });

    // 84a40081825820a71708d13fd0f143dd492540c0ec5fd85011860c2c8823c1facd70afd4d6e15a0101828258390027360563c4479c6aa054cb2bd3ca9e394731ab59f8c45511ec8ba851aee1672f3f7fedc48feca58979967030dc8edc340c551b49d067638f1a004c4b4082581d60ce3edb7ad0f096553830096453e97919efc0962ed9d09a3a2c82c5e11a0ecd33be0200031a03ba7680a10081825820110fbb32367b54d7d40063cc1de69531c9a211c00c9d7435aea5f8cfdf5b3a395840d52bfb1cd425d14462b7e99496864f37b592dd171460c25881cc4e3c736bd16525230d676a2ef81aa408b43aa7e6d22da7d923f3b8dd54eb24c553feabcd1300f5f6
    // 84a40081825820a71708d13fd0f143dd492540c0ec5fd85011860c2c8823c1facd70afd4d6e15a0101828258390027360563c4479c6aa054cb2bd3ca9e394731ab59f8c45511ec8ba851aee1672f3f7fedc48feca58979967030dc8edc340c551b49d067638f1a004c4b4082581d60ce3edb7ad0f096553830096453e97919efc0962ed9d09a3a2c82c5e11a0ecd33be021a00028cad031a03ba7680a100818258209026aa14ba798e0182a60b3365b563c7ccecc0d05f98e530c84f657ee38adb8e58403881b490ee44f926f7c3016ac3f3622fcf18a11bc55b4cf4659a67c0bf73e1507ef2c8205488a246420106770f4c59e2de990a5df00a9f2c0b6cf87903542700f5f6

    it('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.unsignedTx,
          },
          pubs: [accounts.account2.publicKey],
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.unsignedTx,
            key: accounts.account1.publicKey,
          },
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.notEqual(e, null);
      }
    });
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify unsigned transaction in base64 encoding', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify signed transaction in base64 encoding', async () => {
      const txPrebuild = {
        txHex: rawTx.signedTx,
        txInfo: {},
      };

      const txParams = newTxParams();
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail verify transactions when have different recipients', async () => {
      const txPrebuild = newTxPrebuild();

      const txParams = {
        recipients: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '2000000000000000000000000',
          },
        ],
      };

      const verification = {};

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, verification })
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail verify transactions when total amount does not match with expected total amount field', async () => {
      const explainedTx = {
        id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'],
        outputAmount: '90000',
        changeAmount: '0',
        changeOutputs: [],
        outputs: [
          {
            address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
            amount: '1000000000000000000000000',
          },
        ],
        fee: {
          fee: '',
        },
        type: 0,
      };

      const stub = sinon.stub(Transaction.prototype, 'explainTransaction');
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      stub.returns(explainedTx);

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, verification })
        .should.be.rejectedWith('Tx total amount does not match with expected total amount field');
      stub.restore();
    });

    it('should succeed to verify transaction in hex encoding', async () => {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const verification = {};

      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should convert serialized hex string to base64', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const verification = {};
      txPrebuild.txHex = Buffer.from(txPrebuild.txHex, 'base64').toString('hex');
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      validTransaction.should.equal(true);
    });

    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });

    it('should fail verify when txHex is invalid', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = {};
      await basecoin
        .verifyTransaction({ txParams, txPrebuild })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.data = 'data';

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild });
      validTransaction.should.equal(true);
    });
  });
});
