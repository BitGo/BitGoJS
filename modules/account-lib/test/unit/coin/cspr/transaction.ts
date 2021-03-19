import should from 'should';
import { coins } from '@bitgo/statics';
import { CLValue, DeployUtil, PublicKey } from 'casper-client-sdk';
import { ExecutableDeployItem } from 'casper-client-sdk/dist/lib/DeployUtil';
import { Transaction } from '../../../../src/coin/cspr/transaction';
import * as testData from '../../../resources/cspr/cspr';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/coin/cspr';
import { CHAIN_NAME, OWNER_PREFIX } from '../../../../src/coin/cspr/constants';
import { register } from '../../../../src';
import {
  getTransferAmount,
  getTransferDestinationAddress,
  getTransferId,
  isValidTransactionSignature,
} from '../../../../src/coin/cspr/utils';

describe('Cspr Transaction', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  const coin = coins.get('tcspr');

  const getTransaction = (): Transaction => {
    return new Transaction(coin);
  };

  const getWalletInitTransaction = async (): Promise<Transaction> => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(testData.ACCOUNT_1.publicKey);
    txBuilder.owner(testData.ACCOUNT_2.publicKey);
    txBuilder.owner(testData.ACCOUNT_3.publicKey);
    txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
    return (await txBuilder.build()) as Transaction;
  };

  const getWalletInitTransactionUsignExtendedKey = async (): Promise<Transaction> => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(testData.ACCOUNT_1.publicKey);
    txBuilder.owner(testData.ACCOUNT_2.publicKey);
    txBuilder.owner(testData.ACCOUNT_3.publicKey);
    txBuilder.source({ address: testData.ROOT_ACCOUNT.publicKey });
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
    return (await txBuilder.build()) as Transaction;
  };

  const getTransferTransaction = async (): Promise<Transaction> => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: testData.ACCOUNT_1.publicKey });
    txBuilder.to(testData.ACCOUNT_2.publicKey);
    txBuilder.amount(testData.MIN_MOTES_AMOUNT);
    txBuilder.transferId(255);
    return (await txBuilder.build()) as Transaction;
  };

  // Creates a deploy instance, required to test signing.
  const getTransferDeploy = (): DeployUtil.Deploy | undefined => {
    const gasPrice = testData.FEE.gasPrice ? parseInt(testData.FEE.gasPrice) : undefined;
    const sourcePublicKey = PublicKey.fromHex(testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
    const deployParams = new DeployUtil.DeployParams(sourcePublicKey, CHAIN_NAME, gasPrice);

    const session = ExecutableDeployItem.newTransfer(1, sourcePublicKey, undefined, 123);

    const payment = DeployUtil.standardPayment(parseInt(testData.FEE.gasLimit));

    return DeployUtil.makeDeploy(deployParams, session, payment);
  };

  it('should throw empty transaction', () => {
    const tx = getTransaction();
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign if transaction is', () => {
    it('valid', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        isValidTransactionSignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.rawPublicKey).toString('hex'),
        ),
        true,
      );
    });

    it('valid using extended key', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.xPrivateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        isValidTransactionSignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.rawPublicKey).toString('hex'),
        ),
        true,
      );
    });

    it('multiple valid', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.privateKey });
      const keypair2 = new KeyPair({ prv: testData.ACCOUNT_2.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );

      await tx.sign(keypair2).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        tx.casperTx.approvals[1].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
    });

    it('multiple valid using extended keys', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.xPrivateKey });
      const keypair2 = new KeyPair({ prv: testData.ACCOUNT_2.xPrivateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );

      await tx.sign(keypair2).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        tx.casperTx.approvals[1].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
    });

    it('multiple valid using one extended key', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.xPrivateKey });
      const keypair2 = new KeyPair({ prv: testData.ACCOUNT_2.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );

      await tx.sign(keypair2).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        tx.casperTx.approvals[1].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
    });
  });

  describe('should reject sign if transaction signer is', () => {
    it('invalid private key', function() {
      const tx = getTransaction();
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('public key', function() {
      const tx = getTransaction();
      const keypair = new KeyPair({ pub: testData.ACCOUNT_1.publicKey });
      return tx.sign(keypair).should.be.rejected();
    });

    it('public extended key', function() {
      const tx = getTransaction();
      const keypair = new KeyPair({ pub: testData.ACCOUNT_1.xPublicKey });
      return tx.sign(keypair).should.be.rejected();
    });
  });

  describe('should return encoded tx', function() {
    it('wallet initialization', async function() {
      const walletInitTx = await getWalletInitTransaction();
      const encodedTx = walletInitTx.toBroadcastFormat();
      const walletInitJsonTx = JSON.parse(encodedTx);

      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      [owner0, owner1, owner2].forEach(index => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (walletInitTx.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLValue).asString(),
        );
      });

      const jsonOwnerArgs = walletInitJsonTx['deploy']['session']['ModuleBytes']['args'].filter(arg =>
        ownersValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(ownersValues.size);

      jsonOwnerArgs.forEach(arg => {
        arg[argValue]['parsed'].should.be.equal(ownersValues.get(arg[argName]));
      });
    });

    it('wallet initialization using extended key', async function() {
      const walletInitTx = await getWalletInitTransactionUsignExtendedKey();
      const encodedTx = walletInitTx.toBroadcastFormat();
      const walletInitJsonTx = JSON.parse(encodedTx);

      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      [owner0, owner1, owner2].forEach(index => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (walletInitTx.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLValue).asString(),
        );
      });

      const jsonOwnerArgs = walletInitJsonTx['deploy']['session']['ModuleBytes']['args'].filter(arg =>
        ownersValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(ownersValues.size);

      jsonOwnerArgs.forEach(arg => {
        arg[argValue]['parsed'].should.be.equal(ownersValues.get(arg[argName]));
      });
    });

    it('transfer', async function() {
      const transferTx = await getTransferTransaction();
      const encodedTx = transferTx.toBroadcastFormat();
      const transferJsonTx = JSON.parse(encodedTx);

      const argName = 0;
      const argValue = 1;

      const transferValues = new Map();

      transferValues.set('amount', getTransferAmount(transferTx.casperTx.session));
      transferValues.set('to_address', getTransferDestinationAddress(transferTx.casperTx.session));
      const transferId = getTransferId(transferTx.casperTx.session);
      if (transferId !== undefined) {
        transferValues.set('id', transferId.toString());
      }

      const jsonOwnerArgs = transferJsonTx['deploy']['session']['Transfer']['args'].filter(arg =>
        transferValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(transferValues.size);

      jsonOwnerArgs.forEach(arg => {
        arg[argValue]['parsed'].should.be.equal(transferValues.get(arg[argName]));
      });
    });

    it('valid sign', async function() {
      const tx = getTransaction();
      // TODO STLX-1174: get and decode encoded transaction
    });
  });
});
