import assert from 'assert';
import * as testData from '../test/resources/avaxp';
import { register } from '../src';
// import { KeyPair, TransactionBuilderFactory } from '@bitgo/sdk-coin-avaxp';
import { TransactionBuilderFactory } from '../src/transactionBuilderFactory';

// import { removeAlgoPrefixFromHexValue } from '../../../../../src/coin/cspr/utils';

describe('AvaxP Transaction Builder', () => {
  const factory = register('tavaxp', TransactionBuilderFactory);
  /* const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.pubkey }).getAddress();
  const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.pubkey }).getAddress();

    const initTransferBuilder = () => {
     const txBuilder = factory.getTransferBuilder();
     txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
     txBuilder.source({ address: owner1Address });
     txBuilder.to(owner2Address);
     txBuilder.transferId(255);
     txBuilder.amount(testData.MIN_MOTES_AMOUNT);
     return txBuilder;
   };

  const initWalletBuilder = () => {
     const txBuilder = factory.getWalletInitializationBuilder();
     txBuilder.fee(testData.FEE);
     txBuilder.owner(owner1Address);
     txBuilder.owner(owner2Address);
     txBuilder.owner(owner3Address);
     txBuilder.source({ address: sourceAddress });
     return txBuilder;
   };

   const initDelegateBuilder = () => {
     const txBuilder = factory.getDelegateBuilder();
     txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
     txBuilder.source({ address: sourceAddress });
     txBuilder.amount(testData.MIN_MOTES_AMOUNT);
     return txBuilder;
   };

   const initUndelegateBuilder = () => {
     const txBuilder = factory.getUndelegateBuilder();
     txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
     txBuilder.source({ address: sourceAddress });
     txBuilder.amount(testData.MIN_MOTES_AMOUNT);
     return txBuilder;
   };*/

  describe('should validate', () => {
    it('an empty raw transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction('');
        },
        (e) => e.message === testData.ERROR_EMPTY_RAW_TRANSACTION
      );
    });

    it('an invalid raw transfer transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        (e) => e.message === testData.ERROR_JSON_PARSING
      );
    });

    it('an invalid raw wallet init transaction', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        (e) => e.message === testData.ERROR_JSON_PARSING
      );
    });

    /* it('a valid raw transfer transaction', async () => {
      const builder = initTransferBuilder();
      builder.sign({ key: testData.ACCOUNT_1.privateKey });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('a valid raw transfer transaction both accounts using extended keys', async () => {
      const builder = initTransferBuilder();
      builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_2.xPrivateKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('a valid raw transfer transaction one account using extended key', async () => {
      const builder = initTransferBuilder();
      builder.sign({ key: testData.ACCOUNT_1.xPrivateKey });
      builder.sign({ key: testData.ACCOUNT_2.privateKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('a valid raw wallet init transaction', async () => {
      const builder = initWalletBuilder();
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('an invalid expiration time', async () => {
      const builder = initWalletBuilder();
      assert.throws(
        () => builder.expiration(testData.MAX_TRANSACTION_EXPIRATION + 1),
        (e) => e.message === testData.INVALID_TRANSACTION_EXPIRATION_MESSAGE,
      );
    });

    it('should validate addresses', async function () {
      // validate secp256k1 address
      const builder = initTransferBuilder();
      let tx = await builder.build();
      let txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateAddress({ address: txJson.to });
      });

      // validate ed25519 address
      const ed25519Address = '01513fa90c1a74c34a8958dd86055e9736edb1ead918bd4d4d750ca851946be7aa';
      builder.to(ed25519Address);
      tx = await builder.build();
      txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateAddress({ address: txJson.to });
      });
    });*/
  });
});
