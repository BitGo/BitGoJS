import should = require('should');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Sui, Tsui } from '../../src';
import * as testData from '../resources/sui';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import BigNumber from 'bignumber.js';
import assert from 'assert';

describe('SUI:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: testData.TRANSFER,
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
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
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = newTxParams();
      txParams.recipients = undefined;
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: testData.TRANSFER,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'Dc6ofSWTtQMUPrqZ5NqXsGgF2Cyom6H6Kze5T3tUv8Ut',
        outputs: [
          {
            address: testData.recipients[0].address,
            amount: testData.recipients[0].amount,
          },
          {
            address: testData.recipients[1].address,
            amount: testData.recipients[1].amount,
          },
        ],
        outputAmount: testData.AMOUNT * 2,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.gasData.budget.toString() },
        type: 0,
      });
    });

    it('should fail to explain transaction with missing params', async function () {
      try {
        await basecoin.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await basecoin.explainTransaction({ txHex: 'randomString' });
      } catch (error) {
        should.equal(error.message, 'Invalid transaction');
      }
    });
  });

  describe('Parse Transactions: ', () => {
    const transferInputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: new BigNumber(testData.AMOUNT).plus(testData.AMOUNT).plus(testData.gasData.budget).toFixed(),
      },
    ];

    const transferOutputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      },
      {
        address: testData.recipients[1].address,
        amount: testData.recipients[1].amount,
      },
    ];

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({ txHex: testData.TRANSFER });

      parsedTransaction.should.deepEqual({
        inputs: transferInputsResponse,
        outputs: transferOutputsResponse,
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Sui.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin.parseTransaction({ txHex: testData.TRANSFER }).should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Address Validation', () => {
    let keychains;
    let commonKeychain;

    before(function () {
      commonKeychain =
        '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a';
      keychains = [
        {
          id: '63472ac54b1bf500071c181ef3f2cb0f',
          source: 'user',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
          encryptedPrv:
            '{"iv":"BFNnW1rRhVvRt9U21oaAsg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"wKaYa4gei0Y=","ct":"q/7NAYv+l0n0lNJA2MlWt0i5hwV4ZGmAyuRjYi7esbcpbsHW//ZrmrUJC+9PmuNpnv+8rdg5effc3KzI9OiEAXSry1vkB7Iwi6qrXwUIgwAZm0BbbK67+zieGFdYqjr1ic9iVStRoMLMY9pdeYheND8NgyoKK/iAXltB1420+AC4AvZCSr+C2uvrUapkYYLWBO5hfdtLjzOqsZbRWWjnINHh/Ikk+3jXgqp3aE9G8PMou9Tu1myPfpdiqyx5B4k2SEi0u/3YeSuZW3iuXxNwsKLCsgndnJRRZ/PZ/hMEFlrul7spTG0KlsVyDzuDvDyI48gT/aDMdx350nnt/Vn9IxYet4j4fJDe4IOa84nwr4BcxbXDoTPJCLOGExggz4irASz908WCpG+TmiksGh5RQAF2tB+ME016JsN/Rn4F39SU3p4lU3bhu+FxtQwAK7YueYdDXg0a8IhoU5yydf44WD7wjD9Bzny39uJtOZVGNKnO5NtCB/Jzu0beuHShXWFgjRKO560W0P7iSXJf81rg3NcZJznpfzY7CRzo3wOFMj+LcHpiqBml8zo1jalreWUzGecpWrboyYB/dUi6q5tm6XeFqTfh1D8VtQdQLmWpDVuutfDV+YkP0kNWLUdcznMZIcusTKe7BLXdA5gqhl2EiDB67a51Y7wGgSfeF+C7djwX70+q5cA5G27wW5gco//z4WiD8LZqFM86cMI+eLa7v5FJgzOtOwNaSNsSmQ3MPdIVRNS6WrhhjTpThfep3eHZSsQU0Etv/cwrNcMPszk5lc2Xb3npKRcAopehEIFKzDzOXP+VD9zmZtkBEGEKgZLb+39sNKdIf2LSG4wPUi8XjDWFUFr6BrsIDf397zrUDwIQCIXP+evLsjeKhcekEIl00o9102q5WZdqg/3E4zOaCXPPV9VMeSKHMfyC2LysJ0ZDyvS6nPc0choeeUX5LIv7id8CVGWbS2LLb0iU0LxKwI4+ho5sDTWVYk1fguV6SObmr5xxbCxbm2g="}',
        },
        {
          id: '63472ac54b1bf500071c1824e1b47665',
          source: 'backup',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
        },
        {
          id: '63472ac44b1bf500071c18140d6eff1d',
          source: 'bitgo',
          type: 'tss',
          commonKeychain:
            '035528bc7daa7f7edec706888d74593c431e393fd71161136d7348d6674e67a858e148f34c5c72d58ddbe6c7b29dedb750e0428a79595b68d6c2e55f5eb7410a',
          isBitGo: true,
        },
      ];
    });

    it('should return true when validating a well formatted address', async function () {
      const address = 'f941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an old address', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    xit('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    xit('should return false for isWalletAddress with valid address for index 5 and address is for a different index', async function () {
      const wrongAddressForIndex5 = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 5;

      const params = { commonKeychain, address: wrongAddressForIndex5, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(false);
    });

    xit('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    xit('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });
});
