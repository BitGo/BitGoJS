import { Promise as BluebirdPromise } from 'bluebird';
import { Cspr as CsprAccountLib, register } from '@bitgo/account-lib';
import { TestBitGo } from '../../../lib/test_bitgo';
import { Cspr, Tcspr } from '../../../../src/v2/coins';
import { ExplainTransactionOptions, TransactionFee } from '../../../../src/v2/coins/cspr';
import { Transaction } from '@bitgo/account-lib/dist/src/coin/cspr/transaction';
import { randomBytes } from 'crypto';

const co = BluebirdPromise.coroutine;

describe('Casper', function() {
  const coinName = 'tcspr';
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({
      env: 'mock',
    });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function() {
    let localBasecoin = bitgo.coin('tcspr');
    localBasecoin.should.be.an.instanceof(Tcspr);

    localBasecoin = bitgo.coin('cspr');
    localBasecoin.should.be.an.instanceof(Cspr);
  });

  it('should return tcspr', function() {
    basecoin.getChain().should.equal('tcspr');
  });

  it('should return full name', function() {
    basecoin.getFullName().should.equal('Testnet Casper');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function() {
      const seedText = '80350b4208d381fbfe2276a326603049fe500731c46d3c9936b5ce036b51377f';
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal('xpub661MyMwAqRbcFnJi3mvSpYNYyXUcjq7spqHg9GhpcWqs3wF4S8forUeJ3K8XfpUumpY4mLhaGPWAxAJETCnJM56w5f25g6kvLh5Bxb3ZEbD');
      keyPair.prv.should.equal('xprv9s21ZrQH143K3JEEwkPSTQRpRVe8LNQ2TcN5LtJD4BJtB8uutbMZJgKpC3EPHMPGn97Y9aXFYeFegFsPdZXu6BF5XB7yXhZDUE5d6keTHyV');
    });

    it('should validate a public key', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should validate a private key', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('Should supplement wallet generation', co(function *() {
      const details = yield basecoin.supplementGenerateWallet({});
      details.should.have.property('rootPrivateKey');
      basecoin.isValidPrv(details.rootPrivateKey).should.equal(true);
    }));

    it('Should supplement wallet generation with provided private key', co(function *() {
      const rootPrivateKey = 'e0c5c347fc67a46aa5104ece454882315fe5d70af286dbd3d2e04227ebd2927d';
      const details = yield basecoin.supplementGenerateWallet({ rootPrivateKey });
      details.should.have.property('rootPrivateKey');
      details.rootPrivateKey.should.equal(rootPrivateKey);
    }));
  });

  describe('Sign Transaction', () => {
    const factory = register(coinName, CsprAccountLib.TransactionBuilderFactory);
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
          txJson: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };

      let signedTransaction = await basecoin.signTransaction(params, () => {});
      signedTransaction.should.have.property('halfSigned');

      const halfSignedTxJson = JSON.parse(signedTransaction.halfSigned.txJson);
      halfSignedTxJson.deploy.approvals.length.should.equals(1);
      halfSignedTxJson.deploy.approvals[0].signer.toUpperCase().should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      CsprAccountLib.Utils.isValidTransactionSignature(halfSignedTxJson.deploy.approvals[0].signature, halfSignedTxJson.deploy.hash, sourceKeyPair.pub).should.equals(true);

      params.txPrebuild.txJson = signedTransaction.halfSigned.txJson;
      params.prv = bitgoKeyPair.prv;
      signedTransaction = await basecoin.signTransaction(params, () => {});
      signedTransaction.should.not.have.property('halfSigned');
      signedTransaction.should.have.property('txJson');

      const twiceSignedTxJson = JSON.parse(signedTransaction.txJson);
      twiceSignedTxJson.deploy.approvals.length.should.equals(2);
      twiceSignedTxJson.deploy.approvals[0].signer.toUpperCase().should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      twiceSignedTxJson.deploy.approvals[1].signer.toUpperCase().should.equals(bitgoKeyPairObject.getAddress().toUpperCase());

      CsprAccountLib.Utils.isValidTransactionSignature(twiceSignedTxJson.deploy.approvals[0].signature, twiceSignedTxJson.deploy.hash, sourceKeyPair.pub).should.equals(true);
      CsprAccountLib.Utils.isValidTransactionSignature(twiceSignedTxJson.deploy.approvals[1].signature, twiceSignedTxJson.deploy.hash, bitgoKeyPair.pub).should.equals(true);
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
          txJson: tx.toBroadcastFormat(),
        },
        prv: extendedSourceKeyPair.xprv,
      };

      let signedTransaction = await basecoin.signTransaction(params, () => {});
      signedTransaction.should.have.property('halfSigned');

      const halfSignedTxJson = JSON.parse(signedTransaction.halfSigned.txJson);
      halfSignedTxJson.deploy.approvals.length.should.equals(1);
      halfSignedTxJson.deploy.approvals[0].signer.toUpperCase().should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      CsprAccountLib.Utils.isValidTransactionSignature(halfSignedTxJson.deploy.approvals[0].signature, halfSignedTxJson.deploy.hash, sourceKeyPair.pub).should.equals(true);

      params.txPrebuild.txJson = signedTransaction.halfSigned.txJson;
      params.prv = extendedBitgoKeyPair.xprv;
      signedTransaction = await basecoin.signTransaction(params, () => {});
      signedTransaction.should.not.have.property('halfSigned');
      signedTransaction.should.have.property('txJson');

      const twiceSignedTxJson = JSON.parse(signedTransaction.txJson);
      twiceSignedTxJson.deploy.approvals.length.should.equals(2);
      twiceSignedTxJson.deploy.approvals[0].signer.toUpperCase().should.equals(sourceKeyPairObject.getAddress().toUpperCase());
      twiceSignedTxJson.deploy.approvals[1].signer.toUpperCase().should.equals(bitgoKeyPairObject.getAddress().toUpperCase());

      CsprAccountLib.Utils.isValidTransactionSignature(twiceSignedTxJson.deploy.approvals[0].signature, twiceSignedTxJson.deploy.hash, sourceKeyPair.pub).should.equals(true);
      CsprAccountLib.Utils.isValidTransactionSignature(twiceSignedTxJson.deploy.approvals[1].signature, twiceSignedTxJson.deploy.hash, bitgoKeyPair.pub).should.equals(true);
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
          txJson: tx.toBroadcastFormat(),
        },
        prv: invalidPrivateKey,
      };

      basecoin.signTransaction(params, () => {}).should.be.rejected();
    });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new CsprAccountLib.KeyPair().getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair, messageToSign);
      CsprAccountLib.Utils.isValidMessageSignature(signature, messageToSign, keyPair.pub).should.equals(
        true,
      );
    });

    it('should be performed with extended keys', async () => {
      const keyPairToSign = new CsprAccountLib.KeyPair();
      const keyPairExtendedKeys = keyPairToSign.getExtendedKeys();
      const keyPair = keyPairToSign.getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage({ pub: keyPairExtendedKeys.xpub, prv: keyPairExtendedKeys.xprv }, messageToSign);
      CsprAccountLib.Utils.isValidMessageSignature(signature, messageToSign, keyPair.pub).should.equals(
        true,
      );
    });

    it('should fail with missing private key', async () => {
      const keyPair = new CsprAccountLib.KeyPair({ pub: '029F697A02355839A02157E87721F7C44EE45DE9B891266BE065FD7F9B4EB31B88' }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Explain Transaction', () => {
    const factory = register(coinName, CsprAccountLib.TransactionBuilderFactory);
    const sourceKeyPairObject = new CsprAccountLib.KeyPair();
    const sourceKeyPair = sourceKeyPairObject.getKeys();
    const targetKeyPairObject = new CsprAccountLib.KeyPair();
    let txBuilder;
    const transferAmount = '2500000000';
    const transferId = 123;

    before(function() {
      txBuilder = factory.getTransferBuilder();
      txBuilder
        .fee({ gasLimit: '10000', gasPrice: '10' })
        .source({ address: sourceKeyPairObject.getAddress() })
        .to(targetKeyPairObject.getAddress())
        .amount(transferAmount)
        .transferId(transferId);
    });

    it('should explain a half signed transaction', async () => {
      const tx = (await txBuilder.build()) as Transaction;
      const signTxparams = {
        txPrebuild: {
          txJson: tx.toBroadcastFormat(),
        },
        prv: sourceKeyPair.prv,
      };
      const { halfSigned } = await basecoin.signTransaction(signTxparams, () => {});

      const feeInfo: TransactionFee = {
        gasLimit: '1',
        gasPrice: '11000',
      };
      const explainTxParams: ExplainTransactionOptions = {
        halfSigned: {
          txHex: halfSigned.txJson,
        },
        feeInfo,
      };
      const explainedTx = await basecoin.explainTransaction(explainTxParams, () => {});
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
      explainedTx.outputs.forEach(output => {
        output.amount.should.equal(transferAmount);
        output.address.should.equal(targetKeyPairObject.getAddress());
        output.coin.should.equal(basecoin.getChain());
      });
      explainedTx.outputAmount.should.equal(transferAmount);
      explainedTx.transferId.should.equal(transferId);
    });

    it('should explain a signed transaction', async () => {
      const builtTxInfo = {
        txHex: '{"deploy":{"hash":"1f5683fa490f717318363995e4fc1956fbcba219ac356a261a5caa5886ce66c2","header":{"account":"0202865365d0c37d4bcdb47fd06a1d1a5f933725e2820def5cb24d33b1004326fcec","timestamp":"2021-03-19T18:03:09.082Z","ttl":"86400000ms","gas_price":1,"body_hash":"c7d70b14f4c56e1698a4540bcbc93ae8d5039bf26b69bccb74c86ed302fc66be","dependencies":[],"chain_name":"delta-10"},"payment":{"ModuleBytes":{"module_bytes":"","args":[["amount",{"cl_type":"U512","bytes":"02f82a","parsed":"null"}]]}},"session":{"Transfer":{"args":[["amount",{"cl_type":"U512","bytes":"0400f90295","parsed":"2500000000"}],["target",{"cl_type":{"ByteArray":32},"bytes":"7ed4abba796fb70a335970ed1be187a7e8bbc107523df4b1f274a9591189b273","parsed":"null"}],["id",{"cl_type":{"Option":"U64"},"bytes":"01d204000000000000","parsed":"1234"}],["deploy_type",{"cl_type":"String","bytes":"0400000053656e64","parsed":"Send"}],["to_address",{"cl_type":"String","bytes":"440000003032303341443039464441413333384345414232364639374546363038444244303133324646374242353730303835393936423631463730313438343037303146374633","parsed":"0203AD09FDAA338CEAB26F97EF608DBD0132FF7BB570085996B61F7014840701F7F3"}]]}},"approvals":[]}}',
        txInfo: {
          hash: '1f5683fa490f717318363995e4fc1956fbcba219ac356a261a5caa5886ce66c2',
          fee: {
            gasLimit: '11000',
            gasPrice: '1',
          },
          from: '0202865365d0c37d4bcdb47fd06a1d1a5f933725e2820def5cb24d33b1004326fcec',
          startTime: '2021-03-19T18:03:09.082Z',
          expiration: 86400000,
          deployType: 'Send',
          to: '0203AD09FDAA338CEAB26F97EF608DBD0132FF7BB570085996B61F7014840701F7F3',
          amount: '2500000000',
          transferId: 1234,
        },
        feeInfo: {
          gasLimit: '11000',
          gasPrice: '1',
        },
        recipients: [
          {
            address: '0203AD09FDAA338CEAB26F97EF608DBD0132FF7BB570085996B61F7014840701F7F3',
            amount: '2500000000',
          },
        ],
      };
      const explainTxParams: ExplainTransactionOptions = builtTxInfo;
      const explainedTx = await basecoin.explainTransaction(explainTxParams, () => {});
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
      explainedTx.outputs.length.should.equal(1);
      explainedTx.outputs[0].amount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.outputs[0].address.should.equal(builtTxInfo.txInfo.to);
      explainedTx.outputs[0].coin.should.equal(basecoin.getChain());
      explainedTx.outputAmount.should.equal(builtTxInfo.txInfo.amount);
      explainedTx.transferId.should.equal(builtTxInfo.txInfo.transferId);
    });

    it('should fail when a tx is not passed as parameter', async () => {
      const explainTxParams = {
        fee: {
          gasLimit: '1',
          gasPrice: '11000',
        },
      };
      await basecoin.explainTransaction(explainTxParams, () => {}).should.be.rejectedWith('missing explain tx parameters');
    });
  });
});
