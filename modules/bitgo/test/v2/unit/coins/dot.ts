import should = require('should');
import * as accountLib from '@bitgo/account-lib';
import { TestBitGo } from '../../../lib/test_bitgo';
import { rawTx, accounts } from '../../fixtures/coins/dot';
import { randomBytes } from 'crypto';
import { UnsignedTransaction } from '../../../../src';
import * as testData from '../../fixtures/coins/dot';

describe('DOT:', function () {
  let bitgo;
  let basecoin;
  let prodCoin;


  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tdot');
    prodCoin = bitgo.coin('dot');
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new accountLib.Dot.KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(signature)).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new accountLib.Dot.KeyPair({ pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7' }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Sign transaction', () => {
    const transaction = {
      id: '0x19de156328eea66bd1ec45843569c168e0bb2f2898221029b403df3f23a5489d',
      sender: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
      referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
      blockNumber: 3933,
      genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
      nonce: 200,
      specVersion: 9150,
      transactionVersion: 8,
      eraPeriod: 64,
      chainName: 'Westend',
      tip: 0,
      to: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
      amount: '10000000000',
    };

    // TODO: BG-43197
    xit('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: rawTx.transfer.unsigned,
          transaction,
        },
        pubs: [
          accounts.account1.publicKey,
        ],
        prv: accounts.account1.secretKey,
      });
      signed.txHex.should.equal(rawTx.transfer.signed);
    });

    // TODO: BG-43197
    xit('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.transfer.unsigned,
            transaction,
          },
          pubs: [
            accounts.account2.publicKey,
          ],
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: rawTx.transfer.unsigned,
            key: accounts.account1.publicKey,
          },
          prv: accounts.account1.secretKey,
        });
      } catch (e) {
        should.notEqual(e, null);
      }
    });
  });

  describe('Generate wallet key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });
  });

  describe('Balance Conversion', () => {
    it('should return 10000000000 as tdot base factor', () => {
      // mainnet uses 10 decimal places
      const baseFactor = prodCoin.getBaseFactor();
      baseFactor.should.equal(10000000000);
    });

    it('should return 1000000000000 as dot base factor', () => {
      // westend (test polkadot) uses 12 decimal places
      const baseFactor = basecoin.getBaseFactor();
      baseFactor.should.equal(1000000000000);
    });

    it('should return 4 Dot when base unit is 40000000000 for dot', () => {
      const bigUnit = prodCoin.baseUnitsToBigUnits('40000000000');
      bigUnit.should.equal('4');
    });

    it('should return 0.04 Dot when base unit is 400000000 for dot', () => {
      const bigUnit = prodCoin.baseUnitsToBigUnits('400000000');
      bigUnit.should.equal('0.04');
    });

    it('should return 4 test Dot when base unit is 4000000000000 for tdot', () => {
      const bigUnit = basecoin.baseUnitsToBigUnits('4000000000000');
      bigUnit.should.equal('4');
    });

    it('should return 0.04 test Dot when base unit is 400000000 for tdot', () => {
      const bigUnit = basecoin.baseUnitsToBigUnits('40000000000');
      bigUnit.should.equal('0.04');
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const unsignedTransaction: UnsignedTransaction = testData.unsignedTransaction;
      const explainedTransaction = await basecoin.explainTransaction(unsignedTransaction);
      explainedTransaction.should.deepEqual({
        changeOutputs: [],
        changeAmount: '0',
        sequenceId: 0,
        feeInfo: '10',
        txid: '0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
        type: '0',
        outputs: [
          {
            address: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9',
            valueString: '90034235235350',
            coinName: 'tdot',
            wallet: '62a1205751675b2f0fe72328',
          },
        ],
        blockNumber: 8619307,
      });
    });
  });
});

