import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { SUI_PACKAGE_FRAMEWORK_ADDRESS, SUI_SYSTEM_STATE_OBJECT } from '../../../src/lib/constants';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { KeyPair } from '../../../src';
import { MethodNames, ModulesNames, PayTx, SuiTransactionType } from '../../../src/lib/iface';

describe('Sui Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tsui');

  beforeEach(function (done) {
    builders = [factory.getTransferBuilder()];
    done();
  });

  it('should start and build an empty transfer pay tx', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.Pay);
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx(testData.payTxWithoutGasPayment);
    txBuilder.gasData(testData.gasData);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_PAY_TX);
    const reserialized = await factory.from(rawTx).build();
    reserialized.should.be.deepEqual(tx);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });

  it('should start and build an empty transfer payAllSui tx without passing gasData', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.PayAllSui);
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx(testData.payTxWithGasPayment);
    txBuilder.gasData(testData.gasDataWithoutGasPayment);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    (tx as SuiTransaction<PayTx>).suiTransaction.gasData.payment!.should.deepEqual(
      testData.payTxWithGasPayment.coins[0]
    );

    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_PAY_ALL_SUI_TX_WITHOUT_GAS_PAYMENT_AND_IN_PAYTX);
    const reserialized = await factory.from(rawTx).build();
    reserialized.inputs.should.deepEqual([
      {
        address: testData.sender.address,
        value: '',
        coin: 'tsui',
      },
    ]);
    reserialized.outputs.should.deepEqual([
      {
        address: testData.recipients[0],
        value: '',
        coin: 'tsui',
      },
    ]);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });

  it('should start and build an empty transfer payAllSui tx with gasPayment', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.PayAllSui);
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx(testData.payTxWithGasPayment);
    txBuilder.gasData(testData.gasData);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    (tx as SuiTransaction<PayTx>).suiTransaction.gasData.payment!.should.deepEqual(testData.gasPayment);

    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_PAY_ALL_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX);
    const reserialized = await factory.from(rawTx).build();
    reserialized.inputs.should.deepEqual([
      {
        address: testData.sender.address,
        value: '',
        coin: 'tsui',
      },
    ]);
    reserialized.outputs.should.deepEqual([
      {
        address: testData.recipients[0],
        value: '',
        coin: 'tsui',
      },
    ]);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });

  it('should build and sign a transfer paySui tx with gasPayment', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.PaySui);
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx(testData.payTxWithGasPayment);
    txBuilder.gasData(testData.gasData);
    const tx = await txBuilder.build();
    should.equal(tx.id, 'UNAVAILABLE');
    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_PAY_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX);

    const txBuilder2 = await factory.from(rawTx);
    await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
    const signedTx = await txBuilder2.build();
    should.equal(signedTx.type, TransactionType.Send);
    should.equal(signedTx.id, '2jEhSv5HULeisebuWjYxiFuV16N6fJVfnY3dMqcHyHRY');

    const rawSignedTx = signedTx.toBroadcastFormat();
    should.equal(rawSignedTx, testData.TRANSFER_PAY_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX);
    const reserializedTxBuilder = factory.from(rawSignedTx);
    reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
    const reserialized = await reserializedTxBuilder.build();

    reserialized.should.be.deepEqual(signedTx);
    reserialized.toBroadcastFormat().should.equal(rawSignedTx);
  });

  it('should build a paySui tx without passing gasPayment', async function () {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.PaySui);
    txBuilder.sender(testData.sender.address);
    txBuilder.payTx(testData.payTxWithoutGasPayment);
    txBuilder.gasData(testData.gasDataWithoutGasPayment);
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);
    (tx as SuiTransaction<PayTx>).suiTransaction.gasData.payment!.should.deepEqual(
      testData.payTxWithoutGasPayment.coins[0]
    );

    const rawTx = tx.toBroadcastFormat();
    should.equal(rawTx, testData.TRANSFER_PAY_SUI_TX_WITHOUT_GAS_PAYMENT_AND_NOT_IN_PAYTX);
    const reserialized = await factory.from(rawTx).build();

    reserialized.should.be.deepEqual(tx);
    reserialized.toBroadcastFormat().should.equal(rawTx);
  });

  it('should fail to build if missing type', async function () {
    for (const txBuilder of builders) {
      txBuilder.sender(testData.sender.address);
      txBuilder.payTx({
        coins: testData.coinsWithGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      });
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('type is required before building');
    }
  });

  it('should fail to build if missing sender', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Pay);
      txBuilder.payTx({
        coins: testData.coinsWithoutGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      });
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('sender is required before building');
    }
  });

  it('should fail to build if missing payTx', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.PaySui);
      txBuilder.sender(testData.sender.address);
      txBuilder.gasData(testData.gasData);
      await txBuilder.build().should.rejectedWith('payTx is required before building');
    }
  });

  it('should fail to build if missing gasData', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Pay);
      txBuilder.sender(testData.sender.address);
      txBuilder.payTx({
        coins: testData.coinsWithoutGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      });
      await txBuilder.build().should.rejectedWith('gasData is required before building');
    }
  });

  it('should fail to build if missing gasPayment for pay transaction type', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Pay);
      txBuilder.sender(testData.sender.address);
      txBuilder.payTx({
        coins: testData.coinsWithoutGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      });
      txBuilder.gasData(testData.gasDataWithoutGasPayment);
      await txBuilder.build().should.rejectedWith('gasPayment is required for type Pay before building');
    }
  });

  it('should fail to build if gasPayment exists in inputCoins for Pay', async function () {
    for (const txBuilder of builders) {
      txBuilder.type(SuiTransactionType.Pay);
      txBuilder.sender(testData.sender.address);
      txBuilder.payTx({
        coins: testData.coinsWithGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      });
      txBuilder.gasData(testData.gasData);
      await txBuilder
        .build()
        .should.rejectedWith(`Invalid gas payment ${testData.gasPayment.objectId}: cannot be one of the inputCoins`);
    }
  });

  it('should build a send from rawTx', async function () {
    const txBuilder = factory.from(testData.TRANSFER_PAY_TX);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(builtTx.id, 'UNAVAILABLE');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.sender.address,
      value: testData.AMOUNT.toString(),
      coin: 'tsui',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: testData.recipients[0],
      value: testData.AMOUNT.toString(),
      coin: 'tsui',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.gasData.should.deepEqual(testData.gasData);
    jsonTx.kind.Single.should.deepEqual({
      Pay: {
        coins: testData.coinsWithoutGasPayment,
        recipients: [testData.recipients[0]],
        amounts: [testData.AMOUNT],
      },
    });
    jsonTx.sender.should.equal(testData.sender.address);
    jsonTx.gasData.should.deepEqual(testData.gasData);
    builtTx.toBroadcastFormat().should.equal(testData.TRANSFER_PAY_TX);
  });

  describe('staking transaction', async () => {
    it('should build and sign a staking requestAddDelegation tx ', async function () {
      const txBuilder = factory.getStakingBuilder();
      txBuilder.type(SuiTransactionType.AddDelegation);
      txBuilder.sender(testData.STAKING_SENDER_ADDRESS);
      txBuilder.requestAddDelegation(testData.requestAddDelegationTxMultipleCoins);
      txBuilder.gasData(testData.stakingGasData);
      const tx = await txBuilder.build();
      should.equal(tx.id, 'UNAVAILABLE');
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.ADD_DELEGATION_TX_MUL_COIN);

      const txBuilder2 = await factory.from(rawTx);
      await txBuilder2.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.AddDelegator);
      should.equal(signedTx.id, '5C2eBRNKnTMo49iJRikZy2eq2FHGdNAzEeJzt5ZtXZjy');

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.ADD_DELEGATION_TX_MUL_COIN);
      const reserializedTxBuilder = factory.from(rawSignedTx);
      reserializedTxBuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const reserialized = await reserializedTxBuilder.build();

      reserialized.should.be.deepEqual(signedTx);
      reserialized.toBroadcastFormat().should.equal(rawSignedTx);
    });
    it('should build a send from rawTx', async function () {
      const txBuilder = factory.from(testData.ADD_DELEGATION_TX_MUL_COIN);
      const builtTx = await txBuilder.build();
      should.equal(builtTx.type, TransactionType.AddDelegator);
      should.equal(builtTx.id, 'UNAVAILABLE');
      builtTx.inputs.length.should.equal(1);
      builtTx.inputs[0].should.deepEqual({
        address: testData.STAKING_SENDER_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      builtTx.outputs.length.should.equal(1);
      builtTx.outputs[0].should.deepEqual({
        address: testData.VALIDATOR_ADDRESS,
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui',
      });
      const jsonTx = builtTx.toJson();
      jsonTx.gasData.should.deepEqual(testData.stakingGasData);
      jsonTx.kind.Single.should.deepEqual({
        Call: {
          package: SUI_PACKAGE_FRAMEWORK_ADDRESS,
          module: ModulesNames.SuiSystem,
          function: MethodNames.RequestAddStakeMulCoin,
          typeArguments: [],
          arguments: [
            SUI_SYSTEM_STATE_OBJECT,
            [testData.coinToStakeOne, testData.coinToStakeTwo],
            testData.STAKING_AMOUNT,
            testData.VALIDATOR_ADDRESS,
          ],
        },
      });
      jsonTx.sender.should.equal(testData.STAKING_SENDER_ADDRESS);
      jsonTx.gasData.should.deepEqual(testData.stakingGasData);
      builtTx.toBroadcastFormat().should.equal(testData.ADD_DELEGATION_TX_MUL_COIN);
    });
  });

  describe('sender tests', async () => {
    it('should succeed for valid sender', function () {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.sender(testData.sender.address));
      }
    });

    it('should throw for invalid sender', function () {
      const invalidSender = 'randomeString';
      for (const txBuilder of builders) {
        should(() => txBuilder.sender(invalidSender)).throw('Invalid or missing sender, got: ' + invalidSender);
      }
    });
  });

  describe('gasData tests', async () => {
    it('should succeed for valid gasBudget', function () {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.gasData(testData.gasData));
      }
    });

    it('should throw for invalid gasData', function () {
      for (const txBuilder of builders) {
        should(() => txBuilder.gasData(testData.invalidGasOwner)).throw(
          'Invalid gas address ' + testData.invalidGasOwner.owner
        );
      }
    });
  });

  describe('payTx tests', async () => {
    it('should succeed for valid payTx', function () {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.payTx(testData.payTxWithGasPayment));
      }
    });

    it('should throw for invalid payTx', function () {
      for (const txBuilder of builders) {
        should(() => txBuilder.payTx({})).throw('Invalid payTx, missing coins');
        should(() =>
          txBuilder.payTx({
            recipients: testData.recipients,
            amounts: [testData.AMOUNT],
          })
        ).throw('Invalid payTx, missing coins');
        should(() =>
          txBuilder.payTx({
            coins: testData.coinsWithGasPayment,
            amounts: [testData.AMOUNT],
          })
        ).throw('Invalid payTx, missing recipients');
        should(() =>
          txBuilder.payTx({
            coins: testData.coinsWithGasPayment,
            recipients: testData.recipients,
          })
        ).throw('Invalid payTx, missing amounts');
        should(() =>
          txBuilder.payTx({
            coins: testData.coinsWithGasPayment,
            recipients: [testData.recipients[0], testData.recipients[0]],
            amounts: [testData.AMOUNT],
          })
        ).throw('recipients length 2 must equal to amounts length 1');
        should(() =>
          txBuilder.payTx({
            coins: testData.coinsWithGasPayment,
            recipients: testData.recipients,
            amounts: [-1],
          })
        ).throw('Invalid or missing amounts, got: -1');
      }
    });
  });

  it('validateAddress', function () {
    const invalidAddress = { address: 'randomString' };
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateAddress(testData.sender));
      should(() => builder.validateAddress(invalidAddress)).throwError('Invalid address ' + invalidAddress.address);
    }
  });

  it('should submit a paySui transaction', async () => {
    const prvKey = 'ba4c313bcf830b825adaa3ae08cfde86e79e15a84e6fdc3b1fe35a6bb82d9f22';
    const keyPair = new KeyPair({ prv: prvKey });
    const senderAddress = keyPair.getAddress();
    const payTx: PayTx = {
      coins: [
        {
          objectId: '0x37233cc97a6ad53be34280b8c875d094374ba958',
          version: 1375,
          digest: '4620q3O8Amxber2CqxIN0jxt4mEQAPSLSKxEKlN656Y=',
        },
      ],
      recipients: ['0x15ff62b9a1bd971d93e9aae4578f89934c5fcd85'],
      amounts: [1],
    };
    const txBuilder = factory.getTransferBuilder();
    txBuilder.type(SuiTransactionType.PaySui);
    txBuilder.sender(senderAddress);
    txBuilder.payTx(payTx);
    txBuilder.gasData(testData.gasData);
    const unsignedTx = await txBuilder.build();
    const signableHex = unsignedTx.signablePayload.toString('hex');
    const serializedTx = unsignedTx.toBroadcastFormat();
    txBuilder.sign({ key: keyPair.getKeys().prv });
    const signedTransaction = await txBuilder.build();
    const serializedTransaction = signedTransaction.toBroadcastFormat();
    const finalSig = (signedTransaction as SuiTransaction<PayTx>).serializedSig;
    const finalSigString = Buffer.from(finalSig).toString('base64');

    const txBuilder2 = factory.from(serializedTx);
    const tx = await txBuilder2.build();
    tx.type.should.equal(TransactionType.Send);
    const signableHex2 = tx.signablePayload.toString('hex');
    signableHex.should.equal(signableHex2);
    const signable = new Uint8Array(Buffer.from(signableHex2, 'hex'));
    const signaturePayment = keyPair.signMessageinUint8Array(signable);
    txBuilder2.addSignature({ pub: keyPair.getKeys().pub }, Buffer.from(signaturePayment));
    const signedTransaction2 = await txBuilder2.build();
    signedTransaction.id.should.equal(tx.id);
    const finalSig2 = (signedTransaction2 as SuiTransaction<PayTx>).serializedSig;
    const finalSigString2 = Buffer.from(finalSig2).toString('base64');
    finalSigString.should.equal(finalSigString2);
    const serializedTransaction2 = signedTransaction2.toBroadcastFormat();
    serializedTransaction2.should.equal(serializedTransaction);
  });
});
