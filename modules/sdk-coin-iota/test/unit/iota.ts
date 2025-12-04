import should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Iota, TransactionBuilderFactory, TransferTransaction } from '../../src';
import assert from 'assert';
import { coins, GasTankAccountCoin } from '@bitgo/statics';
import * as testData from '../resources/iota';
import { TransactionType } from '@bitgo/sdk-core';
import { createTransferBuilderWithGas } from './helpers/testHelpers';

describe('IOTA:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('iota', Iota.createInstance);
    bitgo.safeRegister('tiota', Iota.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tiota');
  });

  it('should return the right info', function () {
    const iota = bitgo.coin('iota');
    const tiota = bitgo.coin('tiota');
    const iotaStatics = coins.get('iota') as GasTankAccountCoin;
    const tiotaStatics = coins.get('tiota') as GasTankAccountCoin;

    iota.getChain().should.equal('iota');
    iota.getFamily().should.equal('iota');
    iota.getFullName().should.equal('Iota');
    iota.getBaseFactor().should.equal(1e9);

    tiota.getChain().should.equal('tiota');
    tiota.getFamily().should.equal('iota');
    tiota.getFullName().should.equal('Testnet Iota');
    tiota.getBaseFactor().should.equal(1e9);

    iotaStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    tiotaStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    iotaStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);
    tiotaStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);
  });

  it('is valid pub', function () {
    // with 0x prefix
    basecoin.isValidPub('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(false);
    // without 0x prefix
    basecoin.isValidPub('9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(true);
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

    const addressValidationTests = [
      {
        address: '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304',
        valid: true,
        description: 'valid 0x-prefixed address',
      },
      { address: '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59', valid: false, description: 'old format address' },
      { address: 'wrongaddress', valid: false, description: 'incorrectly formatted address' },
    ];

    addressValidationTests.forEach(({ address, valid, description }) => {
      it(`should return ${valid} when validating ${description}`, function () {
        basecoin.isValidAddress(address).should.equal(valid);
      });
    });

    it('should return true for isWalletAddress with valid address for index 4', async function () {
      const newAddress = '0x3f4b2a95d9b696989814f02f899cee491b4d600b1b918e979caec307af4b8dfc';
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

  describe('Transaction Methods', () => {
    let factory: TransactionBuilderFactory;

    before(function () {
      factory = new TransactionBuilderFactory(coins.get('tiota'));
    });

    describe('explainTransaction', () => {
      it('should throw error for missing txHex', async function () {
        await assert.rejects(
          async () => await basecoin.explainTransaction({ txHex: '' }),
          /missing required tx prebuild property txHex/
        );
      });

      it('should throw error for invalid transaction', async function () {
        await assert.rejects(
          async () => await basecoin.explainTransaction({ txHex: 'invalidTxHex' }),
          /Failed to rebuild transaction/
        );
      });

      it('should call explainTransaction on transaction object', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const explanation = tx.explainTransaction();

        explanation.should.have.property('id');
        explanation.should.have.property('outputs');
        explanation.should.have.property('outputAmount');
        explanation.should.have.property('fee');
        explanation.should.have.property('type');
        explanation.type.should.equal(TransactionType.Send);
        explanation.fee.fee.should.equal(testData.GAS_BUDGET.toString());
      });
    });

    describe('verifyTransaction', () => {
      it('should throw error for missing txHex', async function () {
        await assert.rejects(
          async () =>
            await basecoin.verifyTransaction({
              txPrebuild: {},
              txParams: { recipients: testData.recipients },
            }),
          /missing required tx prebuild property txHex/
        );
      });

      it('should verify transaction with matching recipients', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const txHex = Buffer.from(await tx.toBroadcastFormat(), 'base64').toString('hex');

        should.equal(
          await basecoin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: { recipients: testData.recipients },
          }),
          true
        );
      });

      it('should verify transaction with recipients containing extra fields', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const txHex = Buffer.from(await tx.toBroadcastFormat(), 'base64').toString('hex');

        const recipientsWithExtraFields = testData.recipients.map((r) => ({
          ...r,
          extraField: 'should be ignored',
          anotherField: 123,
        }));

        should.equal(
          await basecoin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: { recipients: recipientsWithExtraFields },
          }),
          true
        );
      });

      it('should detect mismatched recipients', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const txHex = Buffer.from(await tx.toBroadcastFormat(), 'base64').toString('hex');

        const mismatchedRecipients = [
          {
            address: testData.addresses.validAddresses[2],
            amount: '9999',
          },
        ];

        await assert.rejects(
          async () =>
            await basecoin.verifyTransaction({
              txPrebuild: { txHex },
              txParams: { recipients: mismatchedRecipients },
            }),
          /Tx recipients does not match with expected txParams recipients/
        );
      });

      it('should verify transaction without recipients parameter', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const txHex = Buffer.from(await tx.toBroadcastFormat(), 'base64').toString('hex');

        should.equal(
          await basecoin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: {},
          }),
          true
        );
      });
    });

    describe('parseTransaction', () => {
      it('should throw error for invalid transaction', async function () {
        await assert.rejects(
          async () => await basecoin.parseTransaction({ txHex: 'invalidTxHex' }),
          /Failed to rebuild transaction/
        );
      });

      it('should parse transaction using JSON format', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const explanation = tx.explainTransaction();

        explanation.should.have.property('id');
        explanation.should.have.property('outputs');
        explanation.should.have.property('outputAmount');
        explanation.should.have.property('fee');

        explanation.outputs.length.should.equal(testData.recipients.length);
        explanation.outputs.forEach((output, index) => {
          output.address.should.equal(testData.recipients[index].address);
          output.amount.should.equal(testData.recipients[index].amount);
        });

        const totalAmount = testData.recipients.reduce((sum, r) => sum + Number(r.amount), 0);
        explanation.outputAmount.should.equal(totalAmount.toString());
        explanation.fee.fee.should.equal(testData.GAS_BUDGET.toString());
      });

      it('should parse transaction with single recipient', async function () {
        const singleRecipient = [testData.recipients[0]];

        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(singleRecipient);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(testData.gasData);

        const tx = (await txBuilder.build()) as TransferTransaction;
        const explanation = tx.explainTransaction();

        explanation.outputs.length.should.equal(1);
        explanation.outputs[0].address.should.equal(singleRecipient[0].address);
        explanation.outputs[0].amount.should.equal(singleRecipient[0].amount);
        explanation.outputAmount.should.equal(singleRecipient[0].amount);
      });

      it('should parse transaction with multiple recipients', async function () {
        const multipleRecipients = [
          { address: testData.addresses.validAddresses[0], amount: '1000' },
          { address: testData.addresses.validAddresses[1], amount: '2000' },
          { address: testData.addresses.validAddresses[2], amount: '3000' },
        ];

        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(multipleRecipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(testData.gasData);

        const tx = (await txBuilder.build()) as TransferTransaction;
        const explanation = tx.explainTransaction();

        explanation.outputs.length.should.equal(3);
        explanation.outputAmount.should.equal('6000');
      });
    });

    describe('getSignablePayload', () => {
      it('should get signable payload from transaction directly', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const signablePayload = tx.signablePayload;

        signablePayload.should.be.instanceOf(Buffer);
        signablePayload.length.should.equal(32);
      });

      it('should throw error for invalid transaction', async function () {
        await assert.rejects(
          async () => await basecoin.getSignablePayload('invalidTxBase64'),
          /Failed to rebuild transaction/
        );
      });

      it('should generate consistent signable payload for identical transactions', async function () {
        const txBuilder1 = createTransferBuilderWithGas();
        const tx1 = (await txBuilder1.build()) as TransferTransaction;

        const txBuilder2 = createTransferBuilderWithGas();
        const tx2 = (await txBuilder2.build()) as TransferTransaction;

        tx1.signablePayload.toString('hex').should.equal(tx2.signablePayload.toString('hex'));
      });

      it('should generate different signable payloads for different transactions', async function () {
        const txBuilder1 = createTransferBuilderWithGas();
        const tx1 = (await txBuilder1.build()) as TransferTransaction;

        const differentRecipients = [{ address: testData.addresses.validAddresses[0], amount: '5000' }];
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.sender(testData.sender.address);
        txBuilder2.recipients(differentRecipients);
        txBuilder2.paymentObjects(testData.paymentObjects);
        txBuilder2.gasData(testData.gasData);
        const tx2 = (await txBuilder2.build()) as TransferTransaction;

        tx1.signablePayload.toString('hex').should.not.equal(tx2.signablePayload.toString('hex'));
      });

      it('should throw error when getting payload from simulate transaction', async function () {
        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);

        const tx = (await txBuilder.build()) as TransferTransaction;
        should.equal(tx.isSimulateTx, true);
        should(() => tx.signablePayload).throwError('Cannot sign a simulate tx');
      });
    });

    describe('setCoinSpecificFieldsInIntent', () => {
      it('should set unspents in intent', function () {
        const intent = {} as any;
        const params = {
          unspents: [
            { objectId: '0x123', version: '1', digest: 'abc' },
            { objectId: '0x456', version: '2', digest: 'def' },
          ],
        } as any;

        basecoin.setCoinSpecificFieldsInIntent(intent, params);

        intent.should.have.property('unspents');
        intent.unspents.should.deepEqual(params.unspents);
      });

      it('should handle empty unspents', function () {
        const intent = {} as any;
        const params = { unspents: [] } as any;

        basecoin.setCoinSpecificFieldsInIntent(intent, params);

        intent.should.have.property('unspents');
        intent.unspents.should.deepEqual([]);
      });

      it('should handle undefined unspents', function () {
        const intent = {} as any;
        const params = {} as any;

        basecoin.setCoinSpecificFieldsInIntent(intent, params);

        intent.should.have.property('unspents');
        (intent.unspents === undefined).should.be.true();
      });
    });

    describe('Transaction with Gas Sponsor', () => {
      it('should build transaction with gas sponsor', async function () {
        const txBuilder = createTransferBuilderWithGas();
        txBuilder.gasSponsor(testData.gasSponsor.address);
        const tx = (await txBuilder.build()) as TransferTransaction;

        should.equal(tx.sender, testData.sender.address);
        should.equal(tx.gasSponsor, testData.gasSponsor.address);
        should.notEqual(tx.sender, tx.gasSponsor);
        should.equal(tx.type, TransactionType.Send);
      });

      it('should handle transaction where sender and gas sponsor are same', async function () {
        const txBuilder = createTransferBuilderWithGas();
        txBuilder.gasSponsor(testData.sender.address);
        const tx = (await txBuilder.build()) as TransferTransaction;

        should.equal(tx.sender, testData.sender.address);
        should.equal(tx.gasSponsor, testData.sender.address);
      });
    });

    describe('Transaction ID Consistency', () => {
      it('should generate same ID for identical transactions', async function () {
        const txBuilder1 = createTransferBuilderWithGas();
        const tx1 = (await txBuilder1.build()) as TransferTransaction;

        const txBuilder2 = createTransferBuilderWithGas();
        const tx2 = (await txBuilder2.build()) as TransferTransaction;

        should.equal(tx1.id, tx2.id);
      });

      it('should generate different IDs for different transactions', async function () {
        const txBuilder1 = createTransferBuilderWithGas();
        const tx1 = (await txBuilder1.build()) as TransferTransaction;

        const differentRecipients = [{ address: testData.addresses.validAddresses[0], amount: '9999' }];
        const txBuilder2 = factory.getTransferBuilder();
        txBuilder2.sender(testData.sender.address);
        txBuilder2.recipients(differentRecipients);
        txBuilder2.paymentObjects(testData.paymentObjects);
        txBuilder2.gasData(testData.gasData);
        const tx2 = (await txBuilder2.build()) as TransferTransaction;

        should.notEqual(tx1.id, tx2.id);
      });
    });

    describe('Gas Configuration Edge Cases', () => {
      it('should handle minimum gas values', async function () {
        const minGasData = {
          gasBudget: 1000,
          gasPrice: 100,
          gasPaymentObjects: [testData.gasPaymentObjects[0]],
        };

        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(minGasData);

        const tx = (await txBuilder.build()) as TransferTransaction;

        should.equal(tx.gasBudget, 1000);
        should.equal(tx.gasPrice, 100);
        should.equal(tx.gasPaymentObjects?.length, 1);
      });

      it('should handle large gas values', async function () {
        const largeGasData = {
          gasBudget: 50000000000, // 50 billion
          gasPrice: 100000,
          gasPaymentObjects: testData.gasPaymentObjects,
        };

        const txBuilder = factory.getTransferBuilder();
        txBuilder.sender(testData.sender.address);
        txBuilder.recipients(testData.recipients);
        txBuilder.paymentObjects(testData.paymentObjects);
        txBuilder.gasData(largeGasData);

        const tx = (await txBuilder.build()) as TransferTransaction;

        should.equal(tx.gasBudget, 50000000000);
        should.equal(tx.gasPrice, 100000);
      });

      it('should return gas fee from transaction', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const fee = tx.getFee();

        should.exist(fee);
        should.equal(fee, testData.GAS_BUDGET.toString());
      });
    });

    describe('Transaction State Management', () => {
      it('should track simulate mode correctly', async function () {
        // Build without gas data - should be simulate mode
        const simulateBuilder = factory.getTransferBuilder();
        simulateBuilder.sender(testData.sender.address);
        simulateBuilder.recipients(testData.recipients);
        simulateBuilder.paymentObjects(testData.paymentObjects);

        const simulateTx = (await simulateBuilder.build()) as TransferTransaction;
        should.equal(simulateTx.isSimulateTx, true);

        // Build with gas data - should not be simulate mode
        const realBuilder = factory.getTransferBuilder();
        realBuilder.sender(testData.sender.address);
        realBuilder.recipients(testData.recipients);
        realBuilder.paymentObjects(testData.paymentObjects);
        realBuilder.gasData(testData.gasData);

        const realTx = (await realBuilder.build()) as TransferTransaction;
        should.equal(realTx.isSimulateTx, false);
      });

      it('should handle canSign based on simulate mode', async function () {
        // Simulate transaction cannot be signed
        const simulateBuilder = factory.getTransferBuilder();
        simulateBuilder.sender(testData.sender.address);
        simulateBuilder.recipients(testData.recipients);
        simulateBuilder.paymentObjects(testData.paymentObjects);

        const simulateTx = (await simulateBuilder.build()) as TransferTransaction;
        should.equal(simulateTx.canSign({} as any), false);

        // Real transaction can be signed
        const realBuilder = factory.getTransferBuilder();
        realBuilder.sender(testData.sender.address);
        realBuilder.recipients(testData.recipients);
        realBuilder.paymentObjects(testData.paymentObjects);
        realBuilder.gasData(testData.gasData);

        const realTx = (await realBuilder.build()) as TransferTransaction;
        should.equal(realTx.canSign({} as any), true);
      });

      it('should handle transaction type correctly', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;

        should.equal(tx.type, TransactionType.Send);
      });
    });

    describe('Transaction Serialization Formats', () => {
      it('should serialize to consistent broadcast format', async function () {
        const txBuilder1 = createTransferBuilderWithGas();
        const tx1 = (await txBuilder1.build()) as TransferTransaction;
        const broadcast1 = await tx1.toBroadcastFormat();

        const txBuilder2 = createTransferBuilderWithGas();
        const tx2 = (await txBuilder2.build()) as TransferTransaction;
        const broadcast2 = await tx2.toBroadcastFormat();

        should.equal(broadcast1, broadcast2);
      });

      it('should produce valid base64 broadcast format', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const broadcast = await tx.toBroadcastFormat();

        should.equal(typeof broadcast, 'string');
        should.equal(/^[A-Za-z0-9+/]*={0,2}$/.test(broadcast), true);
        should.equal(broadcast.length > 0, true);

        const decoded = Buffer.from(broadcast, 'base64');
        should.equal(decoded.length > 0, true);
      });

      it('should maintain JSON serialization consistency', async function () {
        const txBuilder = createTransferBuilderWithGas();
        const tx = (await txBuilder.build()) as TransferTransaction;
        const json1 = tx.toJson();
        const json2 = tx.toJson();

        should.deepEqual(json1, json2);
      });
    });
  });
});
