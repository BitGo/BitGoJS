import assert from 'assert';
import * as should from 'should';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/lib';
import { DELEGATE_VALIDATOR_ACCOUNT } from '../../../../src/lib/constants';
import * as testData from '../../../fixtures/resources';
import { TransactionType } from '@bitgo/sdk-core';
import { DelegateBuilder } from '../../../../src/lib/delegateBuilder';
import { coins } from '@bitgo/statics';

describe('CSPR Delegate Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tcspr'));
  const sender = testData.ACCOUNT_1;
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const validator = DELEGATE_VALIDATOR_ACCOUNT;

  const initDelegateTxBuilder = () => {
    return factory.getDelegateBuilder();
  };

  const addFeeToBuilder = (builder: DelegateBuilder, gasLimit: string, gasPrice: string) => {
    builder.fee({ gasLimit: gasLimit, gasPrice: gasPrice });
    return builder;
  };

  const addSourceToBuilder = (builder: DelegateBuilder, source) => {
    builder.source({ address: new KeyPair({ pub: source.publicKey }).getAddress() });
    return builder;
  };

  const addValidatorToBuilder = (builder: DelegateBuilder, validator: string) => {
    builder.validator(validator);
    return builder;
  };

  const addAmountToBuilder = (builder: DelegateBuilder, amount: string) => {
    builder.amount(amount);
    return builder;
  };

  const initUnsignedDelegateTxBuilder = () => {
    let builder = initDelegateTxBuilder();
    builder = addFeeToBuilder(builder, testData.FEE.gasLimit, testData.FEE.gasPrice);
    builder = addSourceToBuilder(builder, sender);
    builder = addValidatorToBuilder(builder, validator);
    builder = addAmountToBuilder(builder, '10');
    return builder;
  };

  describe('should build ', () => {
    it('an init valid delegate transaction', async () => {
      const txBuilder = initUnsignedDelegateTxBuilder();
      txBuilder.sign({ key: testData.ACCOUNT_1.privateKey });
      txBuilder.sign({ key: testData.ACCOUNT_2.privateKey });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.deepEqual(tx.signature.length, 2);
      should.equal(txJson.from, owner1Address);
      tx.type.should.equal(TransactionType.StakingLock);
    });

    it('an init valid delegate transaction with an external signature', async () => {
      const txBuilder = initUnsignedDelegateTxBuilder();
      txBuilder.sign({ key: testData.ACCOUNT_2.privateKey });
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey })
      );
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      should.deepEqual(tx.signature.length, 2);
      tx.type.should.equal(TransactionType.StakingLock);
    });

    it('an init delegate transaction with external signature included twice', async () => {
      const txBuilder = initUnsignedDelegateTxBuilder();
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey })
      );
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey })
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      should.deepEqual(tx.signature.length, 1);
      tx.type.should.equal(TransactionType.StakingLock);
    });

    it('a delegate transaction with large amount', async function () {
      const amount = '10000000000000000';
      let txBuilder = initUnsignedDelegateTxBuilder();
      txBuilder = addAmountToBuilder(txBuilder, amount);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.amount.should.equal(amount);
    });
  });

  describe('should fail to build', () => {
    it('a delegate transaction without fee', async () => {
      let txBuilder = initDelegateTxBuilder();
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_FEE);
    });

    it('a undelegate transaction without amount', async () => {
      let txBuilder = initDelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_AMOUNT);
    });

    it('a transaction with invalid source', async () => {
      let txBuilder = initDelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_SOURCE);
    });

    it('a transaction without validator', async () => {
      let txBuilder = initDelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addAmountToBuilder(txBuilder, '10');

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      tx.type.should.equal(TransactionType.StakingLock);
      should.equal(txJson.validator, DELEGATE_VALIDATOR_ACCOUNT);
    });
  });

  describe('should validate', () => {
    const factory = new TransactionBuilderFactory(coins.get('tcspr'));

    it('an address', async () => {
      const txBuilder = factory.getDelegateBuilder();
      txBuilder.validateAddress({ address: testData.VALID_ADDRESS });
      assert.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        new RegExp('Invalid address ' + testData.INVALID_ADDRESS)
      );
    });

    it('a validator address', async () => {
      let txBuilder = initDelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      assert.throws(() => txBuilder.validator('abc'), /Invalid address/);
    });

    it('fee value should not be negative', () => {
      const txBuilder = factory.getDelegateBuilder();
      assert.throws(() => txBuilder.fee({ gasLimit: '-1' }));
      should.doesNotThrow(() => txBuilder.fee(testData.FEE));
    });

    it('amount value should not be negative', () => {
      const txBuilder = factory.getDelegateBuilder();
      assert.throws(() => txBuilder.amount('-1'));
      should.doesNotThrow(() => txBuilder.amount('1'));
    });

    it('a private key', () => {
      const txBuilder = factory.getDelegateBuilder();
      assert.throws(() => txBuilder.validateKey({ key: 'abc' }), /Unsupported private key/);
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.ACCOUNT_1.privateKey }));
    });

    it('a length of signers', () => {
      const txBuilder = initUnsignedDelegateTxBuilder();
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_1.privateKey }));
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_2.privateKey }));
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_3.privateKey }));
      assert.throws(
        () => txBuilder.sign({ key: testData.ACCOUNT_4.privateKey }),
        new RegExp('A maximum of 3 can sign the transaction.')
      );
    });
  });
});
