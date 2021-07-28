import { randomBytes } from 'crypto';
import * as algosdk from 'algosdk';
import * as should from 'should';

const algoFixtures = require('../../fixtures/coins/algo');
import { Wallet } from '../../../../src/v2/wallet';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as nock from 'nock';
import * as _ from 'lodash';
import * as common from '../../../../src/common';

describe('ALGO:', function () {
  let bitgo;
  let basecoin;
  let fixtures;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('talgo');
  });

  after(function () {
    nock.cleanAll();
  });

  it('should have three key ids before signing', function () {
    const keyIds = basecoin.keyIdsForSigning();
    keyIds.length.should.equal(3);
  });

  it('should generate a keypair from seed', function () {
    const seed = randomBytes(32);
    const keyPair = basecoin.generateKeyPair(seed);
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = keyPair.pub;
    basecoin.isValidAddress(address).should.equal(true);
    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
    /**
       * Build a signed account-lib single-signature send transaction
       * @param sender The senders address
       * @param destination The destination address of the transaction
       * @param amount The amount to send to the recipient
       * @param tokenId The assetIndex for the token
       */
    const buildSignedTransaction = async function ({
      sender,
      destination,
      amount = 10000,
      tokenId,
    }) {
      const txBuilder = buildBaseAssetTransferTransaction({ sender, destination, amount, tokenId });
      txBuilder.numberOfSigners(1);
      txBuilder.sign({ key: AlgoResources.accounts.account1.secretKey.toString('hex') });
      return await txBuilder.build();
    };

    it('should explain an unsigned asset transfer transaction hex', async function () {
      const explain = await basecoin.explainTransaction({
        txHex: AlgoResources.explainRawTx.assetTransfer.unsigned,
        feeInfo: { fee: '1000' },
      });
      explain.outputAmount.should.equal('1000');
      explain.outputs[0].amount.should.equal('1000');
      explain.outputs[0].address.should.equal(receiver.address);
      explain.fee.should.equal(1000);
      explain.changeAmount.should.equal('0');
      explain.tokenId.should.equal(1);
    });

    // verify regenerated keyPair from seed
    const decodedSeed = algosdk.Seed.decode(keyPair.prv).seed;
    const regeneratedKeyPair = basecoin.generateKeyPair(decodedSeed);

    keyPair.pub.should.equal(regeneratedKeyPair.pub);
    keyPair.prv.should.equal(regeneratedKeyPair.prv);
  });

  it('should validate address', function () {
    const keyPair = basecoin.generateKeyPair();
    basecoin.isValidAddress(keyPair.pub).should.equal(true);
    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidAddress('UMYEHZ2NNBYX43CU37LMINSHR362FT4GFVWL6V5IHPRCJVPZ46H6CBYLYX').should.equal(false);
  });

  it('should validate seed', function () {
    const keyPair = basecoin.generateKeyPair();
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
    basecoin.isValidPrv('UMYEHZ2NNBYX43CU37LMINSHR362FT4GFVWL6V5IHPRCJVPZ46H6CBYLYX').should.equal(false);
  });

  it('should sign message', async function () {
    const keyPair = basecoin.generateKeyPair();
    const message = Buffer.from('message');
    const signature = await basecoin.signMessage(keyPair, message);
    const pub = algosdk.Address.decode(keyPair.pub).publicKey;
    algosdk.NaclWrapper.verify(message, signature, pub).should.equal(true);
  });

  it('should validate a stellar seed', function () {
    basecoin.isStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX').should.ok();
  });

  it('should convert a stellar seed to an algo seed', function () {
    const seed = basecoin.convertFromStellarSeed('SBMWLNV75BPI2VB4G27RWOMABVRTSSF7352CCYGVELZDSHCXWCYFKXIX');
    seed.should.equal('LFS3NP7IL2GVIPBWX4NTTAANMM4URP67OQQWBVJC6I4RYV5QWBKUJUZOCE');
  });

  describe('Transaction Verification', function () {
    let basecoin;
    let wallet;

    before(function () {
      basecoin = bitgo.coin('talgo');
      fixtures = algoFixtures.prebuild();
      wallet = new Wallet(bitgo, basecoin, fixtures.walletData);
    });

    it('should sign a prebuild', async function () {
      // sign transaction
      const halfSignedTransaction = await wallet.signTransaction({
        txPrebuild: {
          txHex: fixtures.buildTxBase64,
          keys: [fixtures.userKeychain.pub, fixtures.backupKeychain.pub, fixtures.bitgoKeychain.pub],
          addressVersion: 1,
        },
        prv: fixtures.userKeychain.prv,
      });

      halfSignedTransaction.halfSigned.txHex.should.equal(fixtures.signedTxBase64);
    });

    it('should sign an half-signed signed transaction', async function () {
      const fullySignedTx = await wallet.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: fixtures.signedTxBase64,
          },
          keys: [fixtures.userKeychain.pub, fixtures.backupKeychain.pub, fixtures.bitgoKeychain.pub],
          addressVersion: 1,
        },
        prv: fixtures.backupKeychain.prv,
      });
      fullySignedTx.txHex.should.equal(fixtures.fullySignBase64);
    });

    it('should explain an half-signed transaction', async function () {
      const explainParams = { halfSigned: { txHex: fixtures.signedTxBase64 } };

      const explanation = await basecoin.explainTransaction(explainParams);

      explanation.outputs[0].amount.should.equal(1000);
      explanation.outputs[0].address.should.equal(fixtures.txData.to);
      explanation.id.should.equal(fixtures.signedTxId);
    });

    it('should explain an fully signed transaction', async function () {
      const explainParams = { txHex: fixtures.fullySignBase64 };

      const explanation = await basecoin.explainTransaction(explainParams);

      explanation.outputs[0].amount.should.equal(1000);
      explanation.outputs[0].address.should.equal(fixtures.txData.to);
      explanation.id.should.equal(fixtures.signedTxId);
    });
  });

  it('should create algo non participating key reg transaction', async function () {
    const algocoin = bitgo.coin('talgo');
    const algoWalletData = {
      id: '5b34252f1bf349930e34020a',
      coin: algocoin.getChain(),
      keys: [
        '5b3424f91bf349930e340175',
      ],
    };
    const algoWallet = new Wallet(bitgo, algocoin, algoWalletData);

    const path = `/api/v2/${ algocoin.getChain() }/wallet/${ algoWallet.id() }/tx/build`;
    const payload = { type: 'keyreg', nonParticipation: true };
    const responseData = {
      txHex: 'iKNmZWXNBBqiZnbOACwynaNnZW6sdGVzdG5ldC12MS4womdoxCBIY7UYpLPITsgQ8i1PEIHLD3HwWaesIN7GL39w5Qk6IqJsds4ALDaFp25vbnBhcnTDo3NuZMQg5VBd35KVAsMISMq7a7/h62H5QMfX1Ry4oQt4lnJQqwSkdHlwZaZrZXlyZWc=',
      txInfo: {
        type: 'keyreg',
        from: '4VIF3X4SSUBMGCCIZK5WXP7B5NQ7SQGH27KRZOFBBN4JM4SQVMCJASAFCI',
        firstRound: 2896541,
        lastRound: 2897541,
        genesisID: 'testnet-v1.0',
        genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        nonParticipation: true,
        fee: 5,
      },
      txHash: 'IT6LBFKXOSIGLACKP74UEVIMOWHBYVZNU4HALJQWUWOPXF3GYPPA',
      feeInfo: {
        size: 212,
        fee: 1000,
        feeRate: 5,
      },
      keys: [
        'HP3TY4ZUTEGF4SDCVULYYS6E4R6JBBS3AHLKULWLI723AURDOEQ5ZKEQE4',
        'K74EJHPWE45BNWCZHNQOI6OI4NZJWPO7RPP3LQDNAD4ST2GKQJDWTDW76E',
        'JMP4WWMDVBFU257PTVI6J47BQGFAS6KK3NDIMCCUH7TPMEDC77ARHM5JQA',
      ],
      addressVersion: 1,
      walletId: '5b34252f1bf349930e34020a',
    };

    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    const response = nock(bgUrl)
      .post(path, _.matches(payload))
      .reply(200, responseData);

    const preBuiltData = await algoWallet.prebuildTransaction(payload);

    response.isDone().should.be.true();
    should.deepEqual(preBuiltData, responseData);
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: AlgoResources.rawTx.transfer.halfSigned,
          },
          keys: [AlgoResources.accounts.account1.pubKey.toString('hex'), AlgoResources.accounts.account3.pubKey.toString('hex')],
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account3.secretKey.toString('hex'),
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.multisig);
    });

    it('should verify sign params if the key array contains addresses', function () {
      const keys = [
        AlgoResources.accounts.account1.address,
        AlgoResources.accounts.account2.address,
        AlgoResources.accounts.account3.address,
      ];

      const verifiedParams = basecoin.verifySignTransactionParams({
        txPrebuild: {
          txHex: AlgoResources.rawTx.transfer.unsigned,
          keys,
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account2.secretKey.toString('hex'),
      });
      verifiedParams.should.have.properties(['txHex', 'addressVersion', 'signers', 'prv', 'isHalfSigned', 'numberSigners']);
      const { txHex, signers, isHalfSigned } = verifiedParams;
      txHex.should.be.equal(AlgoResources.rawTx.transfer.unsigned);
      signers.should.be.deepEqual(keys);
      isHalfSigned.should.be.equal(false);
    });

    it('should sign half signed transaction if the key array contains addresses', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          halfSigned: {
            txHex: AlgoResources.rawTx.transfer.halfSigned,
          },
          keys: [AlgoResources.accounts.account1.address, AlgoResources.accounts.account3.address],
          addressVersion: 1,
        },
        prv: AlgoResources.accounts.account3.secretKey.toString('hex'),
      });
      signed.txHex.should.equal(AlgoResources.rawTx.transfer.multisig);
    });
  });
});
