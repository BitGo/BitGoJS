import * as should from 'should';
import { register } from '../../../../../src/index';
import { KeyPair, TransactionBuilderFactory } from '../../../../../src/coin/cspr';
import { DELEGATE_VALIDATOR_ACCOUNT } from '../../../../../src/coin/cspr/constants';
import * as testData from '../../../../resources/cspr/cspr';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { UndelegateBuilder } from '../../../../../src/coin/cspr/undelegateBuilder';

describe('CSPR Undelegate Builder', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  const sender = testData.ACCOUNT_1;
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const validator = DELEGATE_VALIDATOR_ACCOUNT;

  const initUndelegateTxBuilder = () => {
    const builder = factory.getUndelegateBuilder();
    return builder;
  };

  const addFeeToBuilder = (builder: UndelegateBuilder, gasLimit: string, gasPrice: string) => {
    builder.fee({ gasLimit: gasLimit, gasPrice: gasPrice });
    return builder;
  };

  const addSourceToBuilder = (builder: UndelegateBuilder, source) => {
    builder.source({ address: new KeyPair({ pub: source.publicKey }).getAddress() });
    return builder;
  };

  const addValidatorToBuilder = (builder: UndelegateBuilder, validator: string) => {
    builder.validator(validator);
    return builder;
  };

  const addAmountToBuilder = (builder: UndelegateBuilder, amount: string) => {
    builder.amount(amount);
    return builder;
  };

  const initUnsignedUndelegateTxBuilder = () => {
    let builder = initUndelegateTxBuilder();
    builder = addFeeToBuilder(builder, testData.FEE.gasLimit, testData.FEE.gasPrice);
    builder = addSourceToBuilder(builder, sender);
    builder = addValidatorToBuilder(builder, validator);
    builder = addAmountToBuilder(builder, '10');
    return builder;
  };

  describe('should build ', () => {
    it('an init valid undelegate transaction', async () => {
      const txBuilder = initUnsignedUndelegateTxBuilder();
      txBuilder.sign({ key: testData.ACCOUNT_1.privateKey });
      txBuilder.sign({ key: testData.ACCOUNT_2.privateKey });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.fee, testData.FEE);
      should.deepEqual(tx.signature.length, 2);
      should.equal(txJson.from, owner1Address);
      tx.type.should.equal(TransactionType.StakingUnlock);
    });

    it('an init valid undelegate transaction with an external signature', async () => {
      const txBuilder = initUnsignedUndelegateTxBuilder();
      txBuilder.sign({ key: testData.ACCOUNT_2.privateKey });
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      should.deepEqual(tx.signature.length, 2);
      tx.type.should.equal(TransactionType.StakingUnlock);
    });

    it('an init undelegate transaction with external signature included twice', async () => {
      const txBuilder = initUnsignedUndelegateTxBuilder();
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );
      txBuilder.signature(
        testData.EXTERNAL_SIGNATURE.signature,
        new KeyPair({ pub: testData.EXTERNAL_SIGNATURE.publicKey }),
      );

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      should.deepEqual(tx.signature.length, 1);
      tx.type.should.equal(TransactionType.StakingUnlock);
    });
  });

  describe('should fail to build', () => {
    it('a undelegate transaction without fee', async () => {
      let txBuilder = initUndelegateTxBuilder();
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_FEE);
    });

    it('a undelegate transaction without amount', async () => {
      let txBuilder = initUndelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_AMOUNT);
    });

    it('a undelegate transaction with invalid source', async () => {
      let txBuilder = initUndelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addValidatorToBuilder(txBuilder, validator);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      await txBuilder.build().should.be.rejectedWith(testData.INVALID_TRANSACTION_MISSING_SOURCE);
    });

    it('a undelegate transaction without validator', async () => {
      let txBuilder = initUndelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addAmountToBuilder(txBuilder, '10');

      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.from, owner1Address);
      tx.type.should.equal(TransactionType.StakingUnlock);
      should.equal(txJson.validator, DELEGATE_VALIDATOR_ACCOUNT);
    });
  });

  describe('should validate', () => {
    const factory = register('tcspr', TransactionBuilderFactory);

    it('an address', async () => {
      const txBuilder = factory.getUndelegateBuilder();
      txBuilder.validateAddress({ address: testData.VALID_ADDRESS });
      should.throws(
        () => txBuilder.validateAddress({ address: testData.INVALID_ADDRESS }),
        'Invalid address ' + testData.INVALID_ADDRESS,
      );
    });

    it('a validator address', async () => {
      let txBuilder = initUndelegateTxBuilder();
      txBuilder = addFeeToBuilder(txBuilder, testData.FEE.gasLimit, testData.FEE.gasPrice);
      txBuilder = addSourceToBuilder(txBuilder, sender);
      txBuilder = addAmountToBuilder(txBuilder, '10');
      should.throws(() => txBuilder.validator('abc'), 'Invalid address');
    });

    it('fee value should be greater than zero', () => {
      const txBuilder = factory.getUndelegateBuilder();
      should.throws(() => txBuilder.fee({ gasLimit: '-10' }));
      should.doesNotThrow(() => txBuilder.fee(testData.FEE));
    });

    it('amount value should be greater than zero', () => {
      const txBuilder = factory.getUndelegateBuilder();
      should.throws(() => txBuilder.amount('-1'));
      should.doesNotThrow(() => txBuilder.amount('1'));
    });

    it('a private key', () => {
      const txBuilder = factory.getUndelegateBuilder();
      should.throws(() => txBuilder.validateKey({ key: 'abc' }), 'Invalid key');
      should.doesNotThrow(() => txBuilder.validateKey({ key: testData.ACCOUNT_1.privateKey }));
    });

    it('a length of signers', () => {
      const txBuilder = initUnsignedUndelegateTxBuilder();
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_1.privateKey }));
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_2.privateKey }));
      should.doesNotThrow(() => txBuilder.sign({ key: testData.ACCOUNT_3.privateKey }));
      should.throws(
        () => txBuilder.sign({ key: testData.ACCOUNT_4.privateKey }),
        'A maximum of 3 can sign the transaction.',
      );
    });
  });
});
