import should from 'should';
import { coins } from '@bitgo/statics';
import { CLString, DeployUtil, CLPublicKey as PublicKey } from 'casper-js-sdk';
import { Transaction } from '../../../../src/coin/cspr/transaction';
import * as testData from '../../../resources/cspr/cspr';
import { KeyPair, TransactionBuilderFactory } from '../../../../src/coin/cspr';
import { DEFAULT_CHAIN_NAMES, OWNER_PREFIX } from '../../../../src/coin/cspr/constants';
import { register } from '../../../../src';
import {
  getTransferAmount,
  getTransferDestinationAddress,
  getTransferId,
  isValidTransactionSignature,
  verifySignature,
} from '../../../../src/coin/cspr/utils';

describe('Cspr Transaction', () => {
  const factory = register('tcspr', TransactionBuilderFactory);
  const coin = coins.get('tcspr');
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.publicKey }).getAddress();
  const owner2Address = new KeyPair({ pub: testData.ACCOUNT_2.publicKey }).getAddress();
  const owner3Address = new KeyPair({ pub: testData.ACCOUNT_3.publicKey }).getAddress();
  const sourceAddress = new KeyPair({ pub: testData.ROOT_ACCOUNT.publicKey }).getAddress();

  const getTransaction = (): Transaction => {
    return new Transaction(coin);
  };

  const getWalletInitTransaction = async (): Promise<Transaction> => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(owner1Address);
    txBuilder.owner(owner2Address);
    txBuilder.owner(owner3Address);
    txBuilder.source({ address: sourceAddress });
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.privateKey });
    return (await txBuilder.build()) as Transaction;
  };

  const getWalletInitTransactionUsignExtendedKey = async (): Promise<Transaction> => {
    const txBuilder = factory.getWalletInitializationBuilder();
    txBuilder.fee(testData.FEE);
    txBuilder.owner(owner1Address);
    txBuilder.owner(owner2Address);
    txBuilder.owner(owner3Address);
    txBuilder.source({ address: sourceAddress });
    txBuilder.sign({ key: testData.ROOT_ACCOUNT.xPrivateKey });
    return (await txBuilder.build()) as Transaction;
  };

  const getTransferTransaction = async (): Promise<Transaction> => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ gasLimit: testData.FEE.gasLimit, gasPrice: testData.FEE.gasPrice });
    txBuilder.source({ address: sourceAddress });
    txBuilder.to(owner2Address);
    txBuilder.amount(testData.MIN_MOTES_AMOUNT);
    txBuilder.transferId(255);
    return (await txBuilder.build()) as Transaction;
  };

  // Creates a deploy instance, required to test signing.
  const getTransferDeploy = (): DeployUtil.Deploy | undefined => {
    const gasPrice = testData.FEE.gasPrice ? parseInt(testData.FEE.gasPrice, 10) : undefined;
    const sourcePublicKey = PublicKey.fromHex(testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
    const deployParams = new DeployUtil.DeployParams(sourcePublicKey, DEFAULT_CHAIN_NAMES.testnet, gasPrice);

    const session = DeployUtil.ExecutableDeployItem.newTransfer(1, sourcePublicKey, undefined, 123);

    const payment = DeployUtil.standardPayment(parseInt(testData.FEE.gasLimit, 10));

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
      should.doesNotThrow(() => tx.sign(keypair));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(
        isValidTransactionSignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.value()).toString('hex'),
        ),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.value()).toString('hex'),
        ),
      );
    });

    it('valid using extended key', async () => {
      const tx = getTransaction();
      const transferDeploy = getTransferDeploy();
      if (transferDeploy) {
        tx.casperTx = transferDeploy;
      }
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.xPrivateKey });
      should.doesNotThrow(() => tx.sign(keypair));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(
        isValidTransactionSignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.value()).toString('hex'),
        ),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(
          tx.casperTx.approvals[0].signature,
          tx.casperTx.hash,
          Buffer.from(tx.casperTx.header.account.value()).toString('hex'),
        ),
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
      should.doesNotThrow(() => tx.sign(keypair));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );

      should.doesNotThrow(() => tx.sign(keypair2));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(tx.casperTx.approvals[1].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
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
      should.doesNotThrow(() => tx.sign(keypair));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );

      should.doesNotThrow(() => tx.sign(keypair2));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(tx.casperTx.approvals[1].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
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
      should.doesNotThrow(() => tx.sign(keypair));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );

      should.doesNotThrow(() => tx.sign(keypair2));
      should.equal(tx.casperTx.approvals[0].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey);
      should.equal(tx.casperTx.approvals[1].signer, testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey);
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
        true,
      );
      should.equal(
        isValidTransactionSignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
        true,
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[0].signature, tx.casperTx.hash, testData.ACCOUNT_1.publicKey),
      );
      should.doesNotThrow(() =>
        verifySignature(tx.casperTx.approvals[1].signature, tx.casperTx.hash, testData.ACCOUNT_2.publicKey),
      );
    });
  });

  describe('should reject sign if transaction signer is', () => {
    it('invalid private key', function () {
      const tx = getTransaction();
      should.throws(() => tx.sign(testData.INVALID_KEYPAIR_PRV));
    });

    it('public key', function () {
      const tx = getTransaction();
      const keypair = new KeyPair({ pub: testData.ACCOUNT_1.publicKey });
      should.throws(
        () => tx.sign(keypair),
        (e) => e.message === testData.ERROR_MISSING_PRIVATE_KEY,
      );
    });

    it('public extended key', function () {
      const tx = getTransaction();
      const keypair = new KeyPair({ pub: testData.ACCOUNT_1.xPublicKey });
      should.throws(
        () => tx.sign(keypair),
        (e) => e.message === testData.ERROR_MISSING_PRIVATE_KEY,
      );
    });
  });

  describe('should return encoded tx', function () {
    it('wallet initialization', async function () {
      const walletInitTx = await getWalletInitTransaction();
      const encodedTx = walletInitTx.toBroadcastFormat();
      const walletInitJsonTx = JSON.parse(encodedTx);

      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      [owner0, owner1, owner2].forEach((index) => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (walletInitTx.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLString).value(),
        );
      });

      const jsonOwnerArgs = walletInitJsonTx['deploy']['session']['ModuleBytes']['args'].filter((arg) =>
        ownersValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(ownersValues.size);

      jsonOwnerArgs.forEach((arg) => {
        arg[argValue]['parsed'].should.be.equal(ownersValues.get(arg[argName]));
      });
    });

    it('wallet initialization using extended key', async function () {
      const walletInitTx = await getWalletInitTransactionUsignExtendedKey();
      const encodedTx = walletInitTx.toBroadcastFormat();
      const walletInitJsonTx = JSON.parse(encodedTx);

      const argName = 0;
      const argValue = 1;
      const owner0 = 0;
      const owner1 = 1;
      const owner2 = 2;

      const ownersValues = new Map();

      [owner0, owner1, owner2].forEach((index) => {
        ownersValues.set(
          OWNER_PREFIX + index,
          (walletInitTx.casperTx.session.getArgByName(OWNER_PREFIX + index) as CLString).value(),
        );
      });

      const jsonOwnerArgs = walletInitJsonTx['deploy']['session']['ModuleBytes']['args'].filter((arg) =>
        ownersValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(ownersValues.size);

      jsonOwnerArgs.forEach((arg) => {
        arg[argValue]['parsed'].should.be.equal(ownersValues.get(arg[argName]));
      });
    });

    it('transfer', async function () {
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

      const jsonOwnerArgs = transferJsonTx['deploy']['session']['Transfer']['args'].filter((arg) =>
        transferValues.has(arg[argName]),
      );
      jsonOwnerArgs.length.should.equal(transferValues.size);

      jsonOwnerArgs.forEach((arg) => {
        arg[argValue]['parsed'].should.be.equal(transferValues.get(arg[argName]));
      });
    });

    // TODO STLX-1174: get and decode encoded transaction
    it('valid sign');
  });
});
