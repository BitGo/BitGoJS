import * as CsprAccountLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Cspr, ExplainTransactionOptions, TransactionFee } from '../../src/cspr';
import { Tcspr } from '../../src/tcspr';
import { randomBytes } from 'crypto';
import * as should from 'should';
import { signedRawDelegateTx, signedRawTransferTx, signedRawUndelegateTx } from '../fixtures/cspr';
import { TransactionType } from '@bitgo/sdk-core';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import assert from 'assert';

type Transaction = CsprAccountLib.Transaction;

describe('Casper', function () {
  const coinName = 'tcspr';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('cspr', Cspr.createInstance);
    bitgo.safeRegister('tcspr', Tcspr.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcspr');
    localBasecoin.should.be.an.instanceof(Tcspr);

    localBasecoin = bitgo.coin('cspr');
    localBasecoin.should.be.an.instanceof(Cspr);
  });

  it('should return tcspr', function () {
    basecoin.getChain().should.equal('tcspr');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Casper');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function () {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal(
        'xpub661MyMwAqRbcFnJi3mvSpYNYyXUcjq7spqHg9GhpcWqs3wF4S8forUeJ3K8XfpUumpY4mLhaGPWAxAJETCnJM56w5f25g6kvLh5Bxb3ZEbD'
      );
      keyPair.prv.should.equal(
        'xprv9s21ZrQH143K3JEEwkPSTQRpRVe8LNQ2TcN5LtJD4BJtB8uutbMZJgKpC3EPHMPGn97Y9aXFYeFegFsPdZXu6BF5XB7yXhZDUE5d6keTHyV'
      );
    });

    it('should validate a public key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should validate a private key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('Should supplement wallet generation', async function () {
      const details = await basecoin.supplementGenerateWallet({});
      details.should.have.property('rootPrivateKey');
      basecoin.isValidPrv(details.rootPrivateKey).should.equal(true);
    });

    it('Should supplement wallet generation with provided private key', async function () {
      const rootPrivateKey = 'e0c5c347fc67a46aa5104ece454882315fe5d70af286dbd3d2e04227ebd2927d';
      const details = await basecoin.supplementGenerateWallet({ rootPrivateKey });
      details.should.have.property('rootPrivateKey');
      details.rootPrivateKey.should.equal(rootPrivateKey);
    });
  });

  describe('Sign Transaction', () => {
    const factory = new CsprAccountLib.TransactionBuilderFactory(coins.get(coinName));
    const sourceKeyPairObject = new CsprAccountLib.KeyPair();
    const sourceKeyPair = sourceKeyPairObject.getKeys();
    const targetKeyPairObject = new CsprAccountLib.KeyPair();
    const extendedSourceKeyPair = sourceKeyPairObject.getExtendedKeys();

    it('should be performed', async () => {
      const bitgoKeyPairObject = new CsprAccountLib.KeyPair();
      const bitgoKeyPair = bitgoKeyPairObject.getKeys();
      const builder = factory.getTransferBuilder();
      builder
        .fee({ gasLimit: '10000', gasPrice: '10' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .to(targetKeyPairObject.getAddress())
        .amount('2500000000')
        .transferId(123);

      const tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equals(0);

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };

      let signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.have.property('halfSigned');

      const halfSignedTx = JSON.parse(signedTransaction.halfSigned.txHex);
      halfSignedTx.deploy.approvals.length.should.equals(1);
      halfSignedTx.deploy.approvals[0].signer
        .toUpperCase()
        .should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      CsprAccountLib.Utils.isValidTransactionSignature(
        halfSignedTx.deploy.approvals[0].signature,
        halfSignedTx.deploy.hash,
        sourceKeyPair.pub
      ).should.equals(true);

      params.txPrebuild.txHex = signedTransaction.halfSigned.txHex;
      params.prv = bitgoKeyPair.prv;
      signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.not.have.property('halfSigned');
      signedTransaction.should.have.property('txHex');

      const twiceSignedTx = JSON.parse(signedTransaction.txHex);
      twiceSignedTx.deploy.approvals.length.should.equals(2);
      twiceSignedTx.deploy.approvals[0].signer
        .toUpperCase()
        .should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      twiceSignedTx.deploy.approvals[1].signer
        .toUpperCase()
        .should.equals(bitgoKeyPairObject.getAddress().toUpperCase());

      CsprAccountLib.Utils.isValidTransactionSignature(
        twiceSignedTx.deploy.approvals[0].signature,
        twiceSignedTx.deploy.hash,
        sourceKeyPair.pub
      ).should.equals(true);
      CsprAccountLib.Utils.isValidTransactionSignature(
        twiceSignedTx.deploy.approvals[1].signature,
        twiceSignedTx.deploy.hash,
        bitgoKeyPair.pub
      ).should.equals(true);
    });

    it('should be performed with extended keys', async () => {
      const bitgoKeyPairObject = new CsprAccountLib.KeyPair();
      const bitgoKeyPair = bitgoKeyPairObject.getKeys();
      const extendedBitgoKeyPair = bitgoKeyPairObject.getExtendedKeys();

      const builder = factory.getTransferBuilder();
      builder
        .fee({ gasLimit: '10000', gasPrice: '10' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .to(targetKeyPairObject.getAddress())
        .amount('2500000000')
        .transferId(123);

      const tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equals(0);

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: extendedSourceKeyPair.xprv,
      };

      let signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.have.property('halfSigned');

      const halfSignedTx = JSON.parse(signedTransaction.halfSigned.txHex);
      halfSignedTx.deploy.approvals.length.should.equals(1);
      halfSignedTx.deploy.approvals[0].signer
        .toUpperCase()
        .should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      CsprAccountLib.Utils.isValidTransactionSignature(
        halfSignedTx.deploy.approvals[0].signature,
        halfSignedTx.deploy.hash,
        sourceKeyPair.pub
      ).should.equals(true);

      params.txPrebuild.txHex = signedTransaction.halfSigned.txHex;
      params.prv = extendedBitgoKeyPair.xprv;
      signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.not.have.property('halfSigned');
      signedTransaction.should.have.property('txHex');

      const twiceSignedTxHex = JSON.parse(signedTransaction.txHex);
      twiceSignedTxHex.deploy.approvals.length.should.equals(2);
      twiceSignedTxHex.deploy.approvals[0].signer
        .toUpperCase()
        .should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      twiceSignedTxHex.deploy.approvals[1].signer
        .toUpperCase()
        .should.equals(bitgoKeyPairObject.getAddress().toUpperCase());

      CsprAccountLib.Utils.isValidTransactionSignature(
        twiceSignedTxHex.deploy.approvals[0].signature,
        twiceSignedTxHex.deploy.hash,
        sourceKeyPair.pub
      ).should.equals(true);
      CsprAccountLib.Utils.isValidTransactionSignature(
        twiceSignedTxHex.deploy.approvals[1].signature,
        twiceSignedTxHex.deploy.hash,
        bitgoKeyPair.pub
      ).should.equals(true);
    });

    it('should be rejected if invalid key', async () => {
      const sourceKeyPairObject = new CsprAccountLib.KeyPair();
      const targetKeyPairObject = new CsprAccountLib.KeyPair();
      const invalidPrivateKey = 'AAAAA';
      const builder = factory.getTransferBuilder();
      builder
        .fee({ gasLimit: '10000', gasPrice: '10' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .to(targetKeyPairObject.getAddress())
        .amount('2500000000')
        .transferId(123);

      const tx = (await builder.build()) as Transaction;
      tx.casperTx.approvals.length.should.equals(0);

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: invalidPrivateKey,
      };

      await basecoin.signTransaction(params).should.be.rejected();
    });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new CsprAccountLib.KeyPair().getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair, messageToSign);
      CsprAccountLib.Utils.isValidMessageSignature(signature.toString('hex'), messageToSign, keyPair.pub).should.equals(
        true
      );
    });

    it('should be performed with extended keys', async () => {
      const keyPairToSign = new CsprAccountLib.KeyPair();
      const keyPairExtendedKeys = keyPairToSign.getExtendedKeys();
      const keyPair = keyPairToSign.getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(
        { pub: keyPairExtendedKeys.xpub, prv: keyPairExtendedKeys.xprv },
        messageToSign
      );
      CsprAccountLib.Utils.isValidMessageSignature(signature.toString('hex'), messageToSign, keyPair.pub).should.equals(
        true
      );
    });

    it('should fail with missing private key', async () => {
      const keyPair = new CsprAccountLib.KeyPair({
        pub: '029F697A02355839A02157E87721F7C44EE45DE9B891266BE065FD7F9B4EB31B88',
      }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Explain Transaction', () => {
    const factory = new CsprAccountLib.TransactionBuilderFactory(coins.get(coinName));
    const sourceKeyPairObject = new CsprAccountLib.KeyPair();
    const sourceKeyPair = sourceKeyPairObject.getKeys();
    const targetKeyPairObject = new CsprAccountLib.KeyPair();
    let txBuilder;
    let dgBuilder;
    let udgBuilder;
    const transferAmount = '2500000000';
    const delegateAmount = '250000000';
    const undelegateAmount = '250000000';
    const transferId = 123;

    before(function () {
      txBuilder = factory.getTransferBuilder();
      txBuilder
        .fee({ gasLimit: '10000', gasPrice: '10' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .to(targetKeyPairObject.getAddress())
        .amount(transferAmount)
        .transferId(transferId);

      dgBuilder = factory.getDelegateBuilder();
      dgBuilder
        .fee({ gasLimit: '3000000000', gasPrice: '1' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .amount(delegateAmount)
        .validator('0115c9b40c06ff99b0cbadf1140b061b5dbf92103e66a6330fbcc7768f5219c1ce');

      udgBuilder = factory.getUndelegateBuilder();
      udgBuilder
        .fee({ gasLimit: '3000000000', gasPrice: '1' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .amount(undelegateAmount)
        .validator('0115c9b40c06ff99b0cbadf1140b061b5dbf92103e66a6330fbcc7768f5219c1ce');
    });

    it('should explain a half signed transfer transaction', async () => {
      const tx = (await txBuilder.build()) as Transaction;
      const signTxparams = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };
      const { halfSigned } = await basecoin.signTransaction(signTxparams);

      const feeInfo: TransactionFee = {
        gasLimit: '1',
        gasPrice: '11000',
      };
      const explainTxParams: ExplainTransactionOptions = {
        halfSigned: {
          txHex: halfSigned.txHex,
        },
        feeInfo,
      };
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
      ]);
      explainedTx.fee.should.equal(feeInfo);
      explainedTx.outputs.length.should.equal(1);
      explainedTx.outputs.forEach((output) => {
        output.amount.should.equal(transferAmount);
        output.address.should.equal(targetKeyPairObject.getAddress());
        output.coin.should.equal(basecoin.getChain());
      });
      explainedTx.outputAmount.should.equal(transferAmount);
      explainedTx.transferId.should.equal(transferId.toString());
    });

    it('should explain a signed transfer transaction', async () => {
      const builtTxInfo = {
        txHex: signedRawTransferTx,
        txInfo: {
          hash: 'e5366e61a3027500b82e2ccfed95ab0e175c65416e187803fbd02597706a30a8',
          fee: {
            gasLimit: '11000',
            gasPrice: '1',
          },
          from: '02cc8f78c41d334ad2aaae6da7a88537f9686245761aaddf36d4b2dfbf913bb873',
          startTime: '2021-12-14T00:53:32.836Z',
          expiration: 64800000,
          deployType: 'Send',
          to: '0202fba9e5705a8860fc1b5563b981a4c2c94af03fc10916eb7819b183056c43d3b0',
          amount: '2500000000',
          transferId: '12345',
        },
        feeInfo: {
          gasLimit: '11000',
          gasPrice: '1',
        },
        recipients: [
          {
            address: '0202fba9e5705a8860fc1b5563b981a4c2c94af03fc10916eb7819b183056c43d3b0',
            amount: '2500000000',
          },
        ],
      };
      const explainTxParams: ExplainTransactionOptions = builtTxInfo;
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
      ]);
      explainedTx.fee.should.equal(builtTxInfo.feeInfo);
      explainedTx.id.should.equal(builtTxInfo.txInfo.hash);
      explainedTx.outputs.length.should.equal(1);
      explainedTx.outputs[0].amount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.outputs[0].address.should.equal(builtTxInfo.txInfo.to);
      explainedTx.outputs[0].coin.should.equal(basecoin.getChain());
      explainedTx.outputAmount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.transferId.should.equal(builtTxInfo.txInfo.transferId);
    });

    it('should explain a half signed delegate transaction', async () => {
      const tx = (await dgBuilder.build()) as Transaction;
      const signTxparams = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };
      const { halfSigned } = await basecoin.signTransaction(signTxparams);

      const feeInfo: TransactionFee = {
        gasLimit: '1',
        gasPrice: '3000000000',
      };
      const explainTxParams: ExplainTransactionOptions = {
        halfSigned: {
          txHex: halfSigned.txHex,
        },
        feeInfo,
      };
      const txInfo = {
        hash: 'b47ca168a2c6ec864c5923a98bb8bca8cb78f0141bdeb37f9ad74705f8c40636',
        fee: {
          gasLimit: '3000000000',
          gasPrice: '1',
        },
        from: '0202cc8f78c41d334ad2aaae6da7a88537f9686245761aaddf36d4b2dfbf913bb873',
        deployType: TransactionType.StakingLock,
        amount: delegateAmount,
        validator: '0115c9b40c06ff99b0cbadf1140b061b5dbf92103e66a6330fbcc7768f5219c1ce',
      };
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
        'operations',
      ]);
      explainedTx.fee.should.equal(explainTxParams.feeInfo);
      explainedTx.outputs.length.should.equal(0);
      explainedTx.operations.length.should.equal(1);
      explainedTx.operations[0].amount.should.equal(txInfo.amount);
      explainedTx.operations[0].validator.should.equal(txInfo.validator);
      explainedTx.operations[0].coin.should.equal(basecoin.getChain());
      explainedTx.operations[0].type.should.equal(txInfo.deployType);
    });

    it('should explain a signed delegate transaction', async () => {
      const builtTxInfo = {
        txHex: signedRawDelegateTx,
        txInfo: {
          hash: '771a192224097faf0f1b18295a50e4bf190728cf365711b030cb083d0785e993',
          fee: {
            gasLimit: '100000000',
            gasPrice: '1',
          },
          from: '0202cc8f78c41d334ad2aaae6da7a88537f9686245761aaddf36d4b2dfbf913bb873',
          deployType: TransactionType.StakingLock,
          amount: delegateAmount,
          validator: '0100cd28cec3dd6d29b959ae7b36a8201c92fe6af75fa44d5fa84b7d2e417ca940',
        },
        feeInfo: {
          gasLimit: '100000000',
          gasPrice: '1',
        },
      };
      const explainTxParams: ExplainTransactionOptions = builtTxInfo;
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
        'operations',
      ]);
      explainedTx.fee.should.equal(builtTxInfo.feeInfo);
      explainedTx.outputs.length.should.equal(0);
      explainedTx.operations.length.should.equal(1);
      explainedTx.operations[0].amount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.operations[0].validator.should.equal(builtTxInfo.txInfo.validator);
      explainedTx.operations[0].coin.should.equal(basecoin.getChain());
      explainedTx.operations[0].type.should.equal(builtTxInfo.txInfo.deployType);
    });

    it('should explain a half signed undelegate transaction', async () => {
      const tx = (await udgBuilder.build()) as Transaction;
      const signTxparams = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };
      const { halfSigned } = await basecoin.signTransaction(signTxparams);

      const feeInfo: TransactionFee = {
        gasLimit: '1',
        gasPrice: '3000000000',
      };
      const explainTxParams: ExplainTransactionOptions = {
        halfSigned: {
          txHex: halfSigned.txHex,
        },
        feeInfo,
      };
      const txInfo = {
        hash: 'b47ca168a2c6ec864c5923a98bb8bca8cb78f0141bdeb37f9ad74705f8c40636',
        fee: {
          gasLimit: '3000000000',
          gasPrice: '1',
        },
        from: '0202cc8f78c41d334ad2aaae6da7a88537f9686245761aaddf36d4b2dfbf913bb873',
        deployType: TransactionType.StakingUnlock,
        amount: undelegateAmount,
        validator: '0115c9b40c06ff99b0cbadf1140b061b5dbf92103e66a6330fbcc7768f5219c1ce',
      };
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
        'operations',
      ]);
      explainedTx.fee.should.equal(explainTxParams.feeInfo);
      explainedTx.outputs.length.should.equal(0);
      explainedTx.operations.length.should.equal(1);
      explainedTx.operations[0].amount.should.equal(txInfo.amount);
      explainedTx.operations[0].validator.should.equal(txInfo.validator);
      explainedTx.operations[0].coin.should.equal(basecoin.getChain());
      explainedTx.operations[0].type.should.equal(txInfo.deployType);
    });

    it('should explain a signed undelegate transaction', async () => {
      const builtTxInfo = {
        txHex: signedRawUndelegateTx,
        txInfo: {
          hash: 'aead2e9e9a43e3d545908e1b995628cb9c37e712d7467b63c052fe63bed8cf17',
          fee: {
            gasLimit: '100000000',
            gasPrice: '1',
          },
          from: '0202cc8f78c41d334ad2aaae6da7a88537f9686245761aaddf36d4b2dfbf913bb873',
          deployType: TransactionType.StakingUnlock,
          amount: undelegateAmount,
          validator: '0100cd28cec3dd6d29b959ae7b36a8201c92fe6af75fa44d5fa84b7d2e417ca940',
        },
        feeInfo: {
          gasLimit: '100000000',
          gasPrice: '1',
        },
      };
      const explainTxParams: ExplainTransactionOptions = builtTxInfo;
      const explainedTx = await basecoin.explainTransaction(explainTxParams);
      explainedTx.should.have.properties([
        'displayOrder',
        'id',
        'outputs',
        'outputAmount',
        'transferId',
        'fee',
        'changeOutputs',
        'changeAmount',
        'operations',
      ]);
      explainedTx.fee.should.equal(builtTxInfo.feeInfo);
      explainedTx.outputs.length.should.equal(0);
      explainedTx.operations.length.should.equal(1);
      explainedTx.operations[0].amount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.operations[0].validator.should.equal(builtTxInfo.txInfo.validator);
      explainedTx.operations[0].coin.should.equal(basecoin.getChain());
      explainedTx.operations[0].type.should.equal(builtTxInfo.txInfo.deployType);
    });

    it('should fail when a tx is not passed as parameter', async () => {
      const explainTxParams = {
        fee: {
          gasLimit: '1',
          gasPrice: '11000',
        },
      };
      await basecoin.explainTransaction(explainTxParams).should.be.rejectedWith('missing explain tx parameters');
    });
  });

  describe('Validation', function () {
    it('should fail to validate invalid address with payment id', function () {
      const invalidAddresses = [
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?transferId=x',
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?memoId=1',
        'X0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?transferId=1',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => basecoin.isValidAddress(address));
        basecoin.isValidAddress(address).should.be.false();
      }
    });

    it('should validate address with payment id', function () {
      const validAddresses = [
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?transferId=0',
        '020385D724A9A3E7E32BADF40F3279AF5A190CB2CFCAB6639BF532A0069E0E3824D0?transferId=1',
        '01513fa90c1a74c34a8958dd86055e9736edb1ead918bd4d4d750ca851946be7aa?transferId=999999999', // ed25519
      ];

      for (const address of validAddresses) {
        basecoin.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to verify invalid address with payment id', async function () {
      const invalidAddresses = [
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?transferId=x',
        '0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?memoId=1',
        'X0203DC13CBBF29765C7745578D9E091280522F37684EF0E400B86B1C409BC454F1F3?transferId=1',
      ];

      for (const address of invalidAddresses) {
        await assert.rejects(async () => basecoin.verifyAddress(address));
      }
    });

    it('should verify address with payment id', async function () {
      const rootAddress = '020250fe213706e46aaa32cb23f0705833c6d3ce7652e8e5a1349dde102aadf014b7';
      const keychains = [
        {
          id: '624f0dcc93cbcc0008d88df2369a565e',
          pub: 'xpub661MyMwAqRbcEeRkBciuaUfF4C1jgBcnj2RXdnt9gokx4CFRBUp4bsbk5hXHC1BrBDZLDNecVsUCMmoLpPhWdPZhPiTsHSoxNoGVW9KtiEQ',
          ethAddress: '0xcfbf38770af3a95da7998537a481434e2cb9b2fa',
          source: 'user',
          type: 'independent',
          encryptedPrv:
            '{"iv":"Z2XySTRNipFZ06/EXynwvA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KGRPbZ2jt1g=","ct":"szpCbDLFIlRZvCBV60SWBEMYXvny7YlBtu4ffjlctDQGjR4/+vfCkovgGHs+Xvf/eIlUM3Kicubg+Sdp61MImjMT/umZ3IJT1E2I9mM0QDqpzXlohTGnJ4vgfHgCz3QkB4uYm5mqaD4LtRbvZbGhGrc5jzrLzqQ="}',
        },
        {
          id: '624f0dcd93cbcc0008d88e0fc4261a38',
          pub: 'xpub661MyMwAqRbcGeqZVFgQfcD8zLoxaZL7y4cVAjhE8ybMTpvbppP6rc22a69BgcNVo74yL8fWPzNM5vAozBE7chzGYoPDJMyJ39F2HeAsGcn',
          ethAddress: '0xbf37f39208d77e3254b7efbcab1432b9c353e337',
          source: 'backup',
          type: 'independent',
          encryptedPrv:
            '{"iv":"T9gdJnSAEWFsLZ4cg9VA8g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"FaLlns3mPiI=","ct":"QW5Zq9qJoDxDrK60zTAM6Lg+S4KP9FcEn9AHw5UIyakSBlD0XjVTluZ9PlTABjIlp9cQvMef/SH8Em1d4ash0PACoqBz2IxPwhW9h6uyQBdqk97iPrnM2rOQobsy9p0ILJM10fOgB+EEFYX5yQ5gyfEcK060j/Q="}',
        },
        {
          id: '624f0dce10610a0007fc5282353187ae',
          pub: 'xpub661MyMwAqRbcFVMAYJe51sgXaiFLeUb1v4u3B63CgBNMmMjtWBo32AS3bunsBUZMdi37pzovtEg5mVf6wBKayTYapGQRxymQjcmHaVmSPz8',
          ethAddress: '0x7527720b5638d2f5e2b272b20fc96d2223528d0e',
          source: 'bitgo',
          type: 'independent',
          isBitGo: true,
        },
      ];

      const validAddresses = [
        {
          address: '020250fe213706e46aaa32cb23f0705833c6d3ce7652e8e5a1349dde102aadf014b7',
          keychains,
          rootAddress,
        },
        {
          address: '020250FE213706E46AAA32CB23F0705833C6D3CE7652E8E5A1349DDE102AADF014B7?transferId=0',
          keychains,
          rootAddress,
        },
        {
          address: '020250fe213706e46aaa32cb23f0705833c6d3ce7652e8e5a1349dde102aadf014b7?transferId=5555',
          keychains,
          rootAddress,
        },
      ];

      for (const addressParams of validAddresses) {
        (await basecoin.verifyAddress(addressParams)).should.be.true();
      }
    });
  });

  describe('isWalletAddress', function () {
    const rootAddress = '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e5?transferId=4';

    it('should be valid', async function () {
      await basecoin
        .isWalletAddress({
          address: '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e5?transferId=5',
          rootAddress,
        })
        .should.be.resolvedWith(true);
      await basecoin
        .isWalletAddress({
          address: '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e5?transferId=500',
          rootAddress,
        })
        .should.be.resolvedWith(true);
      await basecoin
        .isWalletAddress({
          address: '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e5',
          rootAddress,
        })
        .should.be.resolvedWith(true);
      await basecoin
        .isWalletAddress({
          address: '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e5?transferId=1',
          rootAddress,
        })
        .should.be.resolvedWith(true);
    });

    it('should be invalid', async function () {
      await basecoin
        .isWalletAddress({
          address: '0203d4c6ed4a40f5aa7371a73c79dd208a646ebc8c9f5c7fe0b4c73844365f0e62e6',
          rootAddress,
        })
        .should.be.rejected();
    });
  });
});
