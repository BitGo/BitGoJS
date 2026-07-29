import * as _ from 'lodash';
import assert from 'assert';
import * as should from 'should';
import * as testData from '../../../fixtures/resources';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/lib';
import { Transaction } from '../../../../src/lib/transaction';
import { removeAlgoPrefixFromHexValue } from '../../../../src/lib/utils';
import { DEFAULT_CHAIN_NAMES } from '../../../../src/lib/constants';
import { coins } from '@bitgo/statics';

describe('Casper Transaction Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('tcspr'));
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress();
  const owner3Address = new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress();
  const sourceAddress = new KeyPair({ pub: testData.ROOT_ACCOUNT.publicKey }).getAddress();

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
  };

  describe('should validate', () => {
    it('an empty raw transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction('');
        },
        (e: Error) => e.message === testData.ERROR_EMPTY_RAW_TRANSACTION
      );
    });

    it('an invalid raw transfer transaction', () => {
      const txBuilder = factory.getTransferBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        (e: Error) => e.message === testData.ERROR_JSON_PARSING
      );
    });

    it('an invalid raw wallet init transaction', () => {
      const txBuilder = factory.getWalletInitializationBuilder();
      assert.throws(
        () => {
          txBuilder.validateRawTransaction(testData.INVALID_RAW_TRANSACTION);
        },
        (e: Error) => e.message === testData.ERROR_JSON_PARSING
      );
    });

    it('a valid raw transfer transaction', async () => {
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
        (e: Error) => e.message === testData.INVALID_TRANSACTION_EXPIRATION_MESSAGE
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
    });
  });

  describe('signatures', function () {
    it('should sign a transaction', async function () {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      const tx = (await builder.build()) as Transaction;
      should.exists(tx.casperTx.approvals[0].signer);
      should.exists(tx.casperTx.approvals[0].signature);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should sign a transaction using extended key', async function () {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      const tx = (await builder.build()) as Transaction;
      should.exists(tx.casperTx.approvals[0].signer);
      should.exists(tx.casperTx.approvals[0].signature);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should process signing only once per signer', async function () {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);
    });

    it('should process signing only once per signer with extended key', async function () {
      const builder = initWalletBuilder();
      builder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);
    });

    it('should add a signature to a transaction', async function () {
      const builder = initWalletBuilder();
      const sig =
        '0072f40621663fd03c5e13b413d5c354cdf4c7e76672aa61fd8ede0f1ac09f5de107d725eb40e1efb9037940d74ef9b2efaa1d66d0991a5322639481c2d4280775';
      const pub = '03dca7d5d68fba12a604e992a47504d10e6795cdc6db438abb741788c71c4b7428';
      const signingKeyPair = new KeyPair({ pub });
      builder.signature(sig, signingKeyPair);
      const tx = (await builder.build()) as Transaction;
      const signer = tx.casperTx.approvals[0].signer;
      const signature = tx.casperTx.approvals[0].signature;

      removeAlgoPrefixFromHexValue(signer).should.equal(pub);
      removeAlgoPrefixFromHexValue(signature).should.equal(_.toLower(sig));

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should add a signature to a transaction using extended key', async function () {
      const builder = initWalletBuilder();
      const sig =
        '0220ade206fc0e7bf19c672aae122e037a7c0ad6c82fb65126735e61f370923f2706114647f9ea1e405fdbf9915c7eaf4325a5ddf9faf24935b20333526cf3b44d';
      const xPub =
        'xpub661MyMwAqRbcH4WAWt79QwMXc1MKaqxU8axkYJGfECGg3gTMuxHYfZzW8AyrRJwFrGZxdA1CgYtXtjVToMyUyfzQrjBayP47pbdWuhdrbYz';
      const signingKeyPair = new KeyPair({ pub: xPub });
      builder.signature(sig, signingKeyPair);
      const tx = (await builder.build()) as Transaction;
      const signer = tx.casperTx.approvals[0].signer;
      const signature = tx.casperTx.approvals[0].signature;

      removeAlgoPrefixFromHexValue(signer).should.equal(signingKeyPair.getKeys().pub);
      removeAlgoPrefixFromHexValue(signature).should.equal(_.toLower(sig));

      const txJson = tx.toJson();
      should.doesNotThrow(() => {
        builder.validateRawTransaction(JSON.stringify(txJson));
      });
    });

    it('should process signing only once per signature added', async function () {
      const builder = initWalletBuilder();
      const sig =
        '0072f40621663fd03c5e13b413d5c354cdf4c7e76672aa61fd8ede0f1ac09f5de107d725eb40e1efb9037940d74ef9b2efaa1d66d0991a5322639481c2d4280775';
      const pub = '03dca7d5d68fba12a604e992a47504d10e6795cdc6db438abb741788c71c4b7428';
      const signingKeyPair = new KeyPair({ pub });
      builder.signature(sig, signingKeyPair);
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
    });

    it('should process signing only once per signature added using extended key', async function () {
      const builder = initWalletBuilder();
      const sig =
        '0220ade206fc0e7bf19c672aae122e037a7c0ad6c82fb65126735e61f370923f2706114647f9ea1e405fdbf9915c7eaf4325a5ddf9faf24935b20333526cf3b44d';
      const xPub =
        'xpub661MyMwAqRbcH4WAWt79QwMXc1MKaqxU8axkYJGfECGg3gTMuxHYfZzW8AyrRJwFrGZxdA1CgYtXtjVToMyUyfzQrjBayP47pbdWuhdrbYz';
      const signingKeyPair = new KeyPair({ pub: xPub });
      builder.signature(sig, signingKeyPair);
      let tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);

      tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equal(1);
      should.equal(tx.casperTx.approvals[0].signer, sourceAddress);
    });
  });

  describe('chain name', function () {
    describe('has default value for', function () {
      it('transfer transaction', function () {
        const txBuilder = initTransferBuilder();
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(DEFAULT_CHAIN_NAMES.testnet);
      });

      it('wallet initialization transaction', function () {
        const txBuilder = initWalletBuilder();
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(DEFAULT_CHAIN_NAMES.testnet);
      });

      it('delegation transaction', function () {
        const txBuilder = initDelegateBuilder();
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(DEFAULT_CHAIN_NAMES.testnet);
      });

      it('undelegation transaction', function () {
        const txBuilder = initUndelegateBuilder();
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(DEFAULT_CHAIN_NAMES.testnet);
      });
    });
    describe('can be manually set for', function () {
      it('transfer transaction', function () {
        const txBuilder = initTransferBuilder()
          .amount(testData.MIN_MOTES_AMOUNT)
          .nodeChainName(testData.CUSTOM_CHAIN_NAME);
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(testData.CUSTOM_CHAIN_NAME);
      });

      it('wallet initialization transaction', function () {
        const txBuilder = initWalletBuilder().nodeChainName(testData.CUSTOM_CHAIN_NAME);
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(testData.CUSTOM_CHAIN_NAME);
      });

      it('delegation transaction', function () {
        const txBuilder = initDelegateBuilder().nodeChainName(testData.CUSTOM_CHAIN_NAME);
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(testData.CUSTOM_CHAIN_NAME);
      });

      it('undelegation transaction', function () {
        const txBuilder = initUndelegateBuilder().nodeChainName(testData.CUSTOM_CHAIN_NAME);
        should.doesNotThrow(() => txBuilder.validateMandatoryFields());
        txBuilder.chainName.should.equals(testData.CUSTOM_CHAIN_NAME);
      });
    });
  });
});
