const assert = require('assert');
const crypto = require('crypto');
const stellar = require('stellar-base');
const Promise = require('bluebird');
const co = Promise.coroutine;
const Wallet = require('../../../../src/v2/wallet');

require('should');

const TestV2BitGo = require('../../../lib/test_bitgo');

const nock = require('nock');
nock.enableNetConnect();

describe('XLM:', function() {
  let bitgo;
  let basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('txlm');
  });

  after(function() {
    nock.cleanAll();
  });

  it('should generate a keypair from random seed', function() {
    const keyPair = basecoin.generateKeyPair();
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = keyPair.pub;
    basecoin.isValidAddress(address).should.equal(true);

    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  });

  it('should generate a keypair from seed', function() {
    const seed = crypto.randomBytes(32);
    const keyPair = basecoin.generateKeyPair(seed);
    keyPair.should.have.property('pub');
    keyPair.should.have.property('prv');

    const address = keyPair.pub;
    basecoin.isValidAddress(address).should.equal(true);

    basecoin.isValidPub(keyPair.pub).should.equal(true);
    basecoin.isValidPrv(keyPair.prv).should.equal(true);

    const secret = keyPair.prv;
    stellar.StrKey.encodeEd25519SecretSeed(seed).should.equal(secret);
  });

  it('should validate address', function() {
    basecoin.isValidAddress('GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=x').should.equal(false);
    basecoin.isValidAddress('SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ').should.equal(false); // private key
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.equal(false); // xrp account
  });

  it('verifyAddress should work', function() {
    basecoin.verifyAddress({ address: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4', rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4' });
    basecoin.verifyAddress({ address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1', rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2' });
    assert.throws(() => { basecoin.verifyAddress({ address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=243432', rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4' }); });
    assert.throws(() => { basecoin.verifyAddress({ address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2=x', rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2' }); });
    assert.throws(() => { basecoin.verifyAddress({ address: 'SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ' }); });
    assert.throws(() => { basecoin.verifyAddress({ address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8' }); });
  });

  describe('Transaction Verification', function() {
    let basecoin;
    let wallet;
    let halfSignedTransaction;

    const userKeychain = {
      pub: 'GA34NPQ4M54HHZBKSDZ5B3J3BZHTXKCZD4UFO2OYZERPOASK4DAATSIB',
      prv: 'SDADJSTZNIKF46NM7LE3ZHMX4TJ2VJBL7PTERNDLWHZ5U6KNO5S7XFJD'
    };
    const backupKeychain = {
      pub: 'GC3D3ZNNK7GHLMSWJA54DQO6QJUJJF7K6J5JGCEW45ZT6QMKZ6PMUHUM',
      prv: 'SA22TDBINLZMGYUDVXGUP2JMYIQ3DTJE53PNQUVCDK73XRS6TDVYU7WW'
    };
    const prebuild = {
      txBase64: 'AAAAAGRnXg19FteG/7zPd+jDC7LDvRlzgfFC+JrPhRep0kYiAAAAZAB/4cUAAAACAAAAAAAAAAAAAAABAAAAAQAAAABkZ14NfRbXhv+8z3fowwuyw70Zc4HxQviaz4UXqdJGIgAAAAEAAAAAmljT/+FedddnAHwo95dOC4RNy6eVLSehaJY34b9GxuYAAAAAAAAAAAehIAAAAAAAAAAAAA==',
      txInfo: {
        fee: 100,
        sequence: '35995558267060226',
        source: 'GBSGOXQNPULNPBX7XTHXP2GDBOZMHPIZOOA7CQXYTLHYKF5J2JDCF7LT',
        operations: [
          {
            amount: '12.8', // 12.8 XLM
            asset: { code: 'XLM' },
            destination: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
            type: 'payment'
          }
        ],
        signatures: []
      },
      feeInfo: {
        height: 123456,
        xlmBaseFee: '100',
        xlmBaseReserve: '5000000'
      },
      walletId: '5a78dd561c6258a907f1eeaee132f796'
    };
    const signedTxBase64 = 'AAAAAGRnXg19FteG/7zPd+jDC7LDvRlzgfFC+JrPhRep0kYiAAAAZAB/4cUAAAACAAAAAAAAAAAAAAABAAAAAQAAAABkZ14NfRbXhv+8z3fowwuyw70Zc4HxQviaz4UXqdJGIgAAAAEAAAAAmljT/+FedddnAHwo95dOC4RNy6eVLSehaJY34b9GxuYAAAAAAAAAAAehIAAAAAAAAAAAAUrgwAkAAABAOExcvVJIUJv9HuVfbV0y7lRPRARv4wDtcdhHG7QN40h5wQ2uwPF52OGQ8KY+66a1A/8lNKB75sgj2xj44s8lDQ==';

    before(co(function *() {
      basecoin = bitgo.coin('txlm');
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: [
              'admin',
              'view',
              'spend'
            ]
          }
        ],
        coin: 'txlm',
        label: 'Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2'
        ],
        tags: [
          '5a78dd561c6258a907f1eeaee132f796'
        ],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: 'GBSGOXQNPULNPBX7XTHXP2GDBOZMHPIZOOA7CQXYTLHYKF5J2JDCF7LT',
          chain: 0,
          index: 0,
          coin: 'txlm',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {}
        },
        pendingApprovals: []
      };
      wallet = new Wallet(bitgo, basecoin, walletData);
    }));

    it('should sign a prebuild', co(function *() {
      // sign transaction
      halfSignedTransaction = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: userKeychain.prv
      });
      halfSignedTransaction.halfSigned.txBase64.should.equal(signedTxBase64);
    }));

    it('should verify the user signature on a tx', co(function *() {
      const userPub = userKeychain.pub;
      const tx = new stellar.Transaction(halfSignedTransaction.halfSigned.txBase64);
      const validSignature = basecoin.verifySignature(userPub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(true);
    }));

    it('should fail to verify the wrong signature on a tx', co(function *() {
      const keyPair = basecoin.generateKeyPair();
      const tx = new stellar.Transaction(halfSignedTransaction.halfSigned.txBase64);
      const validSignature = basecoin.verifySignature(keyPair.pub, tx.hash(), tx.signatures[0].signature());
      validSignature.should.equal(false);
    }));

    it('should fail to verify a transaction signed with the wrong key', co(function *() {
      // sign transaction
      const tx = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });

      const txParams = {
        recipients: [{
          address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
          amount: '128000000'
        }]
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub }
        }
      };
      try {
        yield basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      } catch (e) {
        e.message.should.equal('transaction signed with wrong key');
      }
    }));

    it('should fail to verify a transaction to the wrong recipient', co(function *() {
      // sign transaction
      const tx = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });

      const txParams = {
        recipients: [{
          address: 'GAK3NSB43EVCZKDH4PYGJPCVPOYZ7X7KIR3ZTWSYRKRMJWGG5TABM6TH',
          amount: '128000000'
        }]
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub }
        }
      };
      try {
        yield basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      } catch (e) {
        e.message.should.equal('transaction prebuild does not match expected recipient');
      }
    }));

    it('should fail to verify a transaction with the wrong amount', co(function *() {
      // sign transaction
      const tx = yield wallet.signTransaction({
        txPrebuild: prebuild,
        prv: backupKeychain.prv
      });

      const txParams = {
        recipients: [{
          address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
          amount: '130000000'
        }]
      };
      const txPrebuild = {
        txBase64: tx.halfSigned.txBase64
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub }
        }
      };
      try {
        yield basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      } catch (e) {
        e.message.should.equal('transaction prebuild does not match expected amount');
      }
    }));

    it('should verify a transaction', co(function *() {
      const txParams = {
        recipients: [{
          address: 'GCNFRU774FPHLV3HAB6CR54XJYFYITOLU6KS2J5BNCLDPYN7I3DOMIPY',
          amount: '128000000'
        }]
      };
      const txPrebuild = {
        txBase64: halfSignedTransaction.halfSigned.txBase64
      };
      const verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub }
        }
      };
      const validTransaction = yield basecoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    }));
  });
});

