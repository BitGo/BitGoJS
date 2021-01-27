import should from 'should';
import { coins } from '@bitgo/statics';
import { DeployUtil, PublicKey } from 'casper-client-sdk';
import { ExecutableDeployItem } from 'casper-client-sdk/dist/lib/DeployUtil';
import { Transaction } from '../../../../src/coin/cspr/transaction';
import * as testData from '../../../resources/cspr/cspr';
import { KeyPair } from '../../../../src/coin/cspr';
import { CHAIN_NAME } from '../../../../src/coin/cspr/constants';

describe('Cspr Transaction', () => {
  const coin = coins.get('tcspr');

  const getTransaction = (): Transaction => {
    return new Transaction(coin);
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
      await tx.sign(keypair2).should.be.fulfilled();
      should.equal(
        tx.casperTx.approvals[0].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_1.publicKey,
      );
      should.equal(
        tx.casperTx.approvals[1].signer.toUpperCase(),
        testData.SECP256K1_PREFIX + testData.ACCOUNT_2.publicKey,
      );
    });
  });

  describe('should reject sign if transaction is', () => {
    it('invalid', function() {
      const tx = getTransaction();
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = getTransaction();
      // TODO STLX-1174: get and decode encoded transaction
    });
  });
});
