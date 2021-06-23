import * as should from 'should';
import * as ecc from 'eosjs-ecc';
import * as bitcoin from '@bitgo/utxo-lib';
import * as sinon from 'sinon';
import { Eos } from '../../../../src/v2/coins';
import { EosResponses } from '../../fixtures/coins/eos';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('EOS:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teos');
  });

  it('should get address details', function() {
    let addressDetails = basecoin.getAddressDetails('i1skda3kso43');
    addressDetails.address.should.equal('i1skda3kso43');
    should.not.exist(addressDetails.memoId);

    addressDetails = basecoin.getAddressDetails('ks13k3hdui24?memoId=1');
    addressDetails.address.should.equal('ks13k3hdui24');
    addressDetails.memoId.should.equal('1');

    (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=x'); }).should.throw();
    (() => { basecoin.getAddressDetails('ks13k3hdui24?memoId=1&memoId=2'); }).should.throw();
  });

  it('should validate address', function() {
    basecoin.isValidAddress('i1skda3kso43').should.equal(true);
    basecoin.isValidAddress('ks13kdh245ls').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=1').should.equal(true);
    basecoin.isValidAddress('ks13k3hdui24?memoId=x').should.equal(false);
  });

  it('verifyAddress should work', function() {
    basecoin.verifyAddress({
      address: 'i1skda3kso43',
      rootAddress: 'i1skda3kso43',
    });
    basecoin.verifyAddress({
      address: 'ks13kdh245ls?memoId=1',
      rootAddress: 'ks13kdh245ls',
    });

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43?memoId=243432',
        rootAddress: 'ks13kdh245ls',
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43=x',
        rootAddress: 'i1skda3kso43',
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'i1skda3kso43',
      });
    }).should.throw();
  });

  it('should generate valid random addresses', () => {
    for (let i = 0; i < 100; i++) {
      const address = basecoin.generateRandomAddress();
      basecoin.isValidAddress(address).should.be.true();
    }
  });

  it('isValidMemoId should work', function() {
    basecoin.isValidMemo({ value: '1' }).should.equal(true);
    basecoin.isValidMemo({ value: 'uno' }).should.equal(true);
    const string257CharsLong = '4WMNlu0fFU8N94AwukfpfPPQn2Myo80JdmLNF5rgeKAab9XLD93KUQipcT6US0LRwWWIGbUt89fjmdwpg3CBklNi8QIeBI2i8UDJCEuQKYobR5m4ismm1RooTXUnw5OPjmfLuuajYV4e5cS1jpC6hez5X43PZ5SsGaHNYX2YYXY03ir54cWWx5QW5VCPKPKUzfq2UYK5fjAG2Fe3xCUOzqgoR6KaAiuOOnDSyhZygLJyaoJpOXZM9olblNtAW75Ed';
    basecoin.isValidMemo({ value: string257CharsLong }).should.equal(false);
  });

  it('should validate pub key', () => {
    const { pub } = basecoin.keychains().create();
    basecoin.isValidPub(pub).should.equal(true);
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function() {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });

    it('should generate a keypair from seed', function() {
      const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal('xpub661MyMwAqRbcF2SUqUMiqxWGwaVX6sH4okTtX8jxJ1A14wfL8W7jZEoNE537JqSESXFpTcXCZahPz7RKQLpAEGsVp233dc5CffLSecpU13X');
      keyPair.prv.should.equal('xprv9s21ZrQH143K2YN1jSpiUpZYPYf2hQZDSXYHikLLjfd2C9LBaxoV1SUtNnZGnXeyJ6uFWMbQTfjXqVfgNqRBw5yyaCtBK1AM8PF3XZtKjQp');
    });
  });

  it('should create unsigned recovery transaction without Bitgo', async function() {
    const userKey = 'xpub661MyMwAqRbcH1oUADxatLuKkVjaDB2zTNJoZQsGVQEvoogpbXJw24QMokNwFKj9Qhci6KWaCcQKrzpL4LCQXXX3YpTQxgD9KLBjhDrUWo4';
    const backupKey = 'xpub661MyMwAqRbcH1n6sgY29G7dAxL7twS8rt1jyuuQb1kfnA7s3FJPGoVqb9JenXkeJmC4jZ8iVscn3AH6MkYAVc61FTYCHpxv5cxWar5Jw3C';
    const rootAddress = 'i1skda3kso43';
    const destinationAddress = 'ks13kdh245ls';

    // mock responses to the block chain
    const sandBox = sinon.createSandbox();
    const callBack = sandBox.stub(Eos.prototype, <any>'getDataFromNode');
    callBack.withArgs({
      endpoint: '/v1/chain/get_account',
      payload: { account_name: rootAddress },
    }).resolves(EosResponses.getAccountResponseSuccess1);
    callBack.withArgs({
      endpoint: '/v1/chain/get_account',
      payload: { account_name: destinationAddress },
    }).resolves(EosResponses.getAccountResponseSuccess2);
    callBack.withArgs({
      endpoint: '/v1/chain/get_info',
    }).resolves(EosResponses.getInfoResponseSuccess1);
    callBack.withArgs({
      endpoint: '/v1/chain/get_block',
      payload: { block_num_or_id: 191839472 },
    }).resolves(EosResponses.getBlockResponseSuccess1);

    // can create unsigned recovery transaction
    const unsignedRecoveryTransaction = await basecoin.recover({
      userKey,
      backupKey,
      bitgoKey: 'key',
      recoveryDestination: destinationAddress,
      rootAddress,
    });
    unsignedRecoveryTransaction.recoveryAmount.should.equal('5.0000');
    unsignedRecoveryTransaction.transaction.signatures.length.should.equal(0);

    // destination address and root address can include memoId
    const unsignedRecoveryTransaction2 = await basecoin.recover({
      userKey,
      backupKey,
      bitgoKey: 'key',
      recoveryDestination: `${destinationAddress}?memoId=0`,
      rootAddress: `${rootAddress}?memoId=0`,
    });
    unsignedRecoveryTransaction2.recoveryAmount.should.equal('5.0000');
    unsignedRecoveryTransaction2.transaction.signatures.length.should.equal(0);

    sandBox.restore();
  });

  describe('Transactions:', function() {
    it('should generate a valid transaction signature', async function() {
      const signatureData = 'abcd';
      const tx = {
        txHex: signatureData,
        headers: {
          ref_block_num: 1,
          ref_block_prefix: 'asd',
        },
        transaction: {
          signatures: [],
          packed_trx: signatureData,
          compression: 'none',
        },
        recipients: [{ }]
      };

      const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      console.log(keyPair);
      const { halfSigned } = await basecoin.signTransaction({ txPrebuild: tx, prv: keyPair.prv });
      const signature = halfSigned.transaction.signatures[0];
      const hdNode = bitcoin.HDNode.fromBase58(keyPair.pub);
      const eosPubkey = ecc.PublicKey.fromBuffer(hdNode.getPublicKeyBuffer()).toString();
      console.log(eosPubkey);
      ecc.verify(signature, Buffer.from(signatureData, 'hex'), eosPubkey).should.eql(true);
    });

    it('should explain an EOS transaction', async function() {
      const explainTransactionParams = {
        headers: {
          ref_block_prefix: 100,
          ref_block_num: 995,
          expiration: '2018-04-27T18:40:34.000Z',
        },
        transaction: {
          packed_trx: 'a26ee35ae30364000000000000000100a6823403ea3055000000572d3ccdcd019013e48c8ce5eed400000000a8ed3232229013e48c8ce5eed4b012362b61b31236640000000000000004454f5300000000013100',
        },
      };

      const explainedTx = await basecoin.explainTransaction(explainTransactionParams);
      explainedTx.outputAmount.should.equal('100');
      explainedTx.outputs.length.should.equal(1);
      explainedTx.outputs[0].amount.should.equal('100');
      explainedTx.outputs[0].address.should.equal('asdfasdfasdf');
      explainedTx.id.should.equal('6132f3bf4a746e6ecad8a31df67d71b4741fc5b7c868ae36dde18309a91df8a6');
      explainedTx.memo.should.equal('1');
    });
  });
});
