import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Apt, Tapt, TransferTransaction } from '../../src';
import * as testData from '../resources/apt';
import _ from 'lodash';
import sinon from 'sinon';
import assert from 'assert';
import {
  AccountAddress,
  AccountAuthenticatorEd25519,
  Aptos,
  APTOS_COIN,
  AptosConfig,
  Ed25519PublicKey,
  Ed25519Signature,
  generateUserTransactionHash,
  Network,
} from '@aptos-labs/ts-sdk';
import utils from '../../src/lib/utils';
import { coins } from '@bitgo/statics';

describe('APT:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPreBuild = {
    txHex: testData.TRANSACTION_USING_TRANSFER_COINS,
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('apt', Apt.createInstance);
    bitgo.safeRegister('tapt', Tapt.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tapt');
    newTxPrebuild = () => {
      return _.cloneDeep(txPreBuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should return the right info', function () {
    const apt = bitgo.coin('apt');
    const tapt = bitgo.coin('tapt');

    apt.getChain().should.equal('apt');
    apt.getFamily().should.equal('apt');
    apt.getFullName().should.equal('Aptos');
    apt.getBaseFactor().should.equal(1e8);

    tapt.getChain().should.equal('tapt');
    tapt.getFamily().should.equal('apt');
    tapt.getFullName().should.equal('Testnet Aptos');
    tapt.getBaseFactor().should.equal(1e8);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify transaction when recipients amount are numbers', async function () {
      const txPrebuild = newTxPrebuild();
      const txParamsWithNumberAmounts = newTxParams();
      txParamsWithNumberAmounts.recipients = txParamsWithNumberAmounts.recipients.map(({ address, amount }) => {
        return { address, amount: Number(amount) };
      });
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParamsWithNumberAmounts,
        txPrebuild,
        verification,
      });
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

  describe('Parse and Explain Transactions: ', () => {
    const transferInputsResponse = [
      {
        address: testData.sender2.address,
        amount: testData.AMOUNT.toString(),
      },
    ];

    const transferOutputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      },
    ];

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txHex: testData.TRANSACTION_USING_TRANSFER_COINS,
      });

      parsedTransaction.should.deepEqual({
        inputs: transferInputsResponse,
        outputs: transferOutputsResponse,
      });
    });

    it('should explain a transfer transaction', async function () {
      const rawTx = newTxPrebuild().txHex;
      const transaction = new TransferTransaction(coins.get('tapt'));
      transaction.fromRawTransaction(rawTx);
      const explainedTx = transaction.explainTransaction();
      console.log(explainedTx);
      explainedTx.should.deepEqual({
        displayOrder: [
          'id',
          'outputs',
          'outputAmount',
          'changeOutputs',
          'changeAmount',
          'fee',
          'withdrawAmount',
          'sender',
          'type',
        ],
        id: '0x80a52dd5d4f712a80b77ad7b4a12a8e61b76243a546099b0ab9acfef4e9a4e31',
        outputs: [
          {
            address: '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9',
            amount: '1000',
          },
        ],
        outputAmount: '1000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '0' },
        sender: '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a372449',
        type: 0,
      });
    });

    it('should fail to explain a invalid raw transaction', async function () {
      const rawTx = 'invalidRawTransaction';
      const transaction = new TransferTransaction(coins.get('tapt'));
      await assert.rejects(async () => transaction.fromRawTransaction(rawTx), {
        message: 'invalid raw transaction',
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Apt.prototype, 'explainTransaction');
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
        '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781';
      keychains = [
        {
          id: '6424c353eaf78d000766e95949868468',
          source: 'user',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"cZd5i7L4RxtwrALW2rK7UA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"5zgoH1Bd3Fw=","ct":"9vVlnXFRtrM9FVEo+d2chbGHlM9lFZemueBuAs3BIkPo33Fo7jzwwNK/kIWkEyg+NmEBd5IaqAS157nvvvwzzsmMWlQdUz9qbmXNv3pg987cXFR08exS+4uhwP1YNOjJTRvRNcO9ZqHb46d4fmyJ/yC9/susCge7r/EsbaN5C3afv1dzybuq912FwaQElZLYYp5BICudFOMZ9k0UDMfKM/PMDkH7WexoGHr9GKq/bgCH2B39TZZyHKU6Uy47lXep2s6h0DrMwHOrnmiL3DZjOj88Ynvphlzxuo4eOlD2UHia2+nvIaISYs29Pr0DAvREutchvcBpExj1kWWPv7hQYrv8F0NAdatsbWl3w+xKyfiMKo1USlrwyJviypGtQtXOJyw0XPN0rv2+L5lW8BbjpzHfYYN13fJTedlGTFhhkzVtbbPAKE02kx7zCJcjYaiexdSTsrDLScYNT9/Jhdt27KpsooehwVohLfSKz4vbFfRu2MPZw3/+c/hfiJNgtz6esWbnxGrcE8U2IwPYCaK+Ghk4DcqWNIni59RI5B5kAsQOToII40qPN510uTgxBSPO7q7MHgkxdd4CqBq+ojr9j0P7oao8E5Y+CBDJrojDoCh1oCCDW9vo2dXlVcD8SIbw7U/9AfvEbA4xyE/5md1M7CIwLnWs2Ynv0YtaKoqhdS9x6FmHlMDhN/DKHinrwmowtrTT82fOkpO5g9saSmgU7Qy3gLt8t+VwdEyeFeQUKRSyci8qgqXQaZIg4+aXgaSOnlCFMtmB8ekYxEhTY5uzRfrNgS4s1QeqFBpNtUF+Ydi297pbVXnJoXAN+SVWd80GCx+yI2dpVC89k3rOWK9WeyqlnzuLJWp2RIOB9cdW8GFv/fN+QAJpYeVxOE4+nZDsKnsj8nKcg9t4Dlx1G6gLM1/Vq9YxNLbuzuRC0asUYvdMnoMvszmpm++TxndYisgNYscpZSoz7wvcazJNEPfhPVjEkd6tUUuN4GM35H0DmKCUQNT+a6B6hmHlTZvjxiyGAg5bY59hdjvJ+22QduazlEEC6LI3HrA7uK0TpplWzS1tCIFvTMUhj65DEZmNJ2+ZY9bQ4vsMf+DRR3OOG4t+DMlNfjOd3zNv3QoY95BjfWpryFwPzDq7bCP67JDsoj7j2TY5FRSrRkD77H0Ewlux2cWfjRTwcMHcdQxxuV0OP0aNjGDjybFN"}',
        },
        {
          id: '6424c353eaf78d000766e96137d4404b',
          source: 'backup',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          encryptedPrv:
            '{"iv":"vi0dPef/Rx7kG/pRySQi6Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"9efhQsiEvVs=","ct":"Gw6atvf6gxKzsjtl3xseipO3rAxp1mAz7Yu1ihFsi5/lf2vMZegApgZx+pyILFS9KKLHbNF3U6WgSYdrr2t4vzdLsXkH1WIxfHS+cd2C5N59yADZDnPJBT6pv/IRvaYelP0Ck3nIYQ2hSMm8op+VOWC/SzHeh7slYDqwEHTGan0Wigfvk1yRd7CCJTaEAomnc/4eFi2NY3X3gt/3opy9IAgknnwUFohn96EWpEQ0F6pbzH/Z8VF6gF+DUcrrByAxExUPnHQZiFk3YHU/vVV4FxBU/mVAE8xBsBn5ul5e5SUMPfc7TBuJWv4BByTNg9xDShF/91Yx2nbfUm5d9QmM8lpKgzzQvcK8POAPk87gRCuKnsGh5vNS0UppkHc+ocfzRQlGA6jze7QyyQO0rMj5Ly8kWjwk2vISvKYHYS1NR7VU549UIXo7NXjatunKSc3+IreoRUHIshiaLg6hl+pxCCuc0qQ43V0mdIfCjTN8gkGWLNk8R7tAGPz9jyapQPcPEGHgEz0ATIi6yMNWCsibS2eLiE1uVEJONoM4lk6FPl3Q2CHbW2MeEbqjY8hbaw18mNb2xSBH/Fwpiial+Tvi2imqgnCO4ZpO9bllKftZPcQy0stN+eGBlb5ufyflKkDSiChHYroGjEpmiFicdde48cJszF52uKNnf1q67fA9/S2FAHQab3EXojxH2Gbk+kkV2h/TYKFFZSWC3vi4e8mO+vjMUcR0AdsgPFyEIz0SCGuba3CnTLNdEuZwsauAeHkx2vUTnRgJPVgNeeuXmsVG76Sy2ggJHuals0Hj8U2Xda0qO1RuFfoCWfss9wn6HGRwPPkhSB/8oNguAqmRVGKkd8Zwt3IvrTd9fk0/rFFDJKGz7WyNHkYgUmNiGcItD12v0jx7FZ52EJzl3Av1RyJUQK18+8EYPh3SGiU9dt7VX0aF0uo6JouKhOeldUvMP+AugQz8fUclwTQsbboVg27Yxo0DyATVwThW5a56R6Qf5ZiQJluFuzs5y98rq0S5q046lE6o3vVmJpEdwjeSCJoET5CL4nTgkXyWvhm4eB8u/e66l3o0qbaSx8q9YYmT9EpRcl5TP4ThLBKETYdzVvg4exjQfektMatk5EyUpEIhZPXh5vXpJZesdfO9LJ8zTaHBsBjDPU7cdNgQMbebpataRi8A0el2/IJXl+E+olgAz5zC4i2O1Q=="}',
        },
        {
          id: '6424c353eaf78d000766e9510b125fba',
          source: 'bitgo',
          type: 'tss',
          commonKeychain:
            '19bdfe2a4b498a05511381235a8892d54267807c4a3f654e310b938b8b424ff4adedbe92f4c146de641c67508a961324c8504cdf8e0c0acbb68d6104ccccd781',
          verifiedVssProof: true,
          isBitGo: true,
        },
      ];
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

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '0x8b3c7807730d75792dd6c49732cf9f014d6984a9c77d386bdb1072a9e537d8d8';
      const index = 4;

      const params = { commonKeychain, address: newAddress, index, keychains };
      (await basecoin.isWalletAddress(params)).should.equal(true);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    it('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });

  describe('ID Validation', () => {
    it('check id', async function () {
      const network: Network = Network.TESTNET;
      const aptos = new Aptos(new AptosConfig({ network }));
      const senderAddress = AccountAddress.fromString(
        '0xc8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d09'
      );
      const recipientAddress = AccountAddress.fromString(
        '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9'
      );

      const transaction = await aptos.transaction.build.simple({
        sender: senderAddress,
        data: {
          function: '0x1::coin::transfer',
          typeArguments: [APTOS_COIN],
          functionArguments: [recipientAddress, 1000],
        },
        options: {
          maxGasAmount: 200000,
          gasUnitPrice: 100,
          expireTimestamp: 1732699236,
          accountSequenceNumber: 14,
        },
      });

      const DEFAULT_PUBLIC_KEY = Buffer.alloc(32);
      const DEFAULT_SIGNATURE = Buffer.alloc(64);
      const publicKey = new Ed25519PublicKey(utils.getBufferFromHexString(DEFAULT_PUBLIC_KEY.toString('hex')));
      const signature = new Ed25519Signature(DEFAULT_SIGNATURE);
      const senderAuthenticator = new AccountAuthenticatorEd25519(publicKey, signature);
      const id = generateUserTransactionHash({ transaction, senderAuthenticator });

      id.should.equal('0x923d1cfed3afac24048451160337db75ba282912157ee43407b572923801d5ba');
    });
  });
});
