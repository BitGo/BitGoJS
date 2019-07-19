import 'should';
import * as crypto from 'crypto';
import * as stellar from 'stellar-sdk';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import { Wallet } from '../../../../src/v2/wallet';

const TestV2BitGo = require('../../../lib/test_bitgo');

import * as nock from 'nock';
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

  it('should validate address', function() {
    basecoin.isValidAddress('GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1').should.equal(true);
    basecoin.isValidAddress('GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=x').should.equal(false);
    basecoin.isValidAddress('SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ').should.equal(false); // private key
    basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8').should.equal(false); // xrp account
  });

  it('should validate stellar username', function() {
    basecoin.isValidStellarUsername('foo@bar.baz').should.equal(true);
    basecoin.isValidStellarUsername('foo_bar9.baz').should.equal(true);
    basecoin.isValidStellarUsername('foo+bar_9.baz').should.equal(true);
    basecoin.isValidStellarUsername('').should.equal(false);
    basecoin.isValidStellarUsername('foo bar.baz').should.equal(false); // whitespace is not allowed
    basecoin.isValidStellarUsername('Foo@bar.baz').should.equal(false); // only lowercase letters are allowed
  });

  it('verifyAddress should work', function() {
    basecoin.verifyAddress({
      address: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4',
      rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4'
    });
    basecoin.verifyAddress({
      address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=1',
      rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2'
    });

    (() => {
      basecoin.verifyAddress({
        address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2?memoId=243432',
        rootAddress: 'GBRIS6W5OZNWWFJA6GYRF3JBK5WZNX5WWD2KC6NCOOIEMF7H6JMQLUI4'
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2=x',
        rootAddress: 'GDU2FEL6THGGOFDHHP4I5FHNWY4S2SXYUBCEDB5ZREMD6UFRT4SYWSW2'
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'SBKGCMBY56MHTT4EGE3YJIYL4CPWKSGJ7VDEQF4J3B3YO576KNL7DOYJ'
      });
    }).should.throw();

    (() => {
      basecoin.verifyAddress({
        address: 'r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8'
      });
    }).should.throw();
  });

  it('Should be able to explain an XLM transaction', co(function *() {
    const signedExplanation = yield basecoin.explainTransaction({ txBase64: 'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAB9AAEvJEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAB1RFU1RJTkcAAAAAAQAAAAAAAAABAAAAALgEl4p84728zfXtl/JdOsx3QbI97mcybqcXdfgdv54zAAAAAAAAAAEqBfIAAAAAAAAAAAFWi1PfAAAAQDoqo7juOBZawMlk8znIbYqSKemjgmINosp/P4+0SFGo/xJy1YgD6YEc65aWuyBxucFFBXCSlAxP2Z7nPMyjewM=' });
    signedExplanation.outputAmount.should.equal('5000000000');
    signedExplanation.fee.fee.should.equal('500');
    signedExplanation.memo.value.should.equal('TESTING');
    signedExplanation.memo.type.should.equal('text');
    signedExplanation.changeOutputs.length.should.equal(0);
    signedExplanation.changeAmount.should.equal('0');
    const unsignedExplanation = yield basecoin.explainTransaction({ txBase64: 'AAAAAMDHAbd3O7B2auR1e+EH/LRKe8IcQBOF+XP2lOxWi1PfAAAAZAAEvJEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEAAAABAAAAAAAAAAEAAAAAuASXinzjvbzN9e2X8l06zHdBsj3uZzJupxd1+B2/njMAAAAAAAAAAlQL5AAAAAAAAAAAAA==' });
    unsignedExplanation.outputAmount.should.equal('10000000000');
    unsignedExplanation.fee.fee.should.equal('100');
    unsignedExplanation.memo.value.should.equal('1');
    unsignedExplanation.memo.type.should.equal('id');
    unsignedExplanation.changeOutputs.length.should.equal(0);
    unsignedExplanation.changeAmount.should.equal('0');
  }));

  it('isValidMemoId should work', function() {
    basecoin.isValidMemo({ value: '1', type: 'id' }).should.equal(true);
    basecoin.isValidMemo({ value: 'uno', type: 'text' }).should.equal(true);
    const buffer = new Buffer(32).fill(10);
    basecoin.isValidMemo({ value: buffer, type: 'hash' }).should.equal(true);
    basecoin.isValidMemo({ value: buffer.toString('hex'), type: 'hash' }).should.equal(true);
    basecoin.isValidMemo({ value: 1, type: 'id' }).should.equal(false);
    basecoin.isValidMemo({ value: 1, type: 'text' }).should.equal(false);
    basecoin.isValidMemo({ value: '1', type: 'hash' }).should.equal(false);
    basecoin.isValidMemo({ value: '1', type: 'return' }).should.equal(false);
  });

  it('should supplement wallet generation', co(function *() {
    const walletParams = yield basecoin.supplementGenerateWallet({});
    walletParams.should.have.property('rootPrivateKey');
    basecoin.isValidPrv(walletParams.rootPrivateKey).should.equal(true);
  }));

  it('should supplement wallet generation with provided private key', co(function *() {
    const rootPrivateKey = basecoin.generateKeyPair().prv;
    const walletParams = yield basecoin.supplementGenerateWallet({ rootPrivateKey });
    walletParams.should.have.property('rootPrivateKey');
    walletParams.rootPrivateKey.should.equal(rootPrivateKey);
  }));

  it('should validate pub key', () => {
    const { pub } = basecoin.keychains().create();
    basecoin.isValidPub(pub).should.equal(true);
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

    it('should fail to verify a transaction without recipients', co(function *() {

      const prebuilt = {
        txBase64: 'AAAAAP1qe44j+i4uIT+arbD4QDQBt8ryEeJd7a0jskQ3nwDeAAAAAAB/4cUAAAACAAAAAAAAAAIAAAAAAAAAAQAAAAAAAAAAAAAAAA==',
        txInfo: {
          fee: 0,
          sequence: '35995558267060226',
          source: 'GD6WU64OEP5C4LRBH6NK3MHYIA2ADN6K6II6EXPNVUR3ERBXT4AN4ACD',
          operations: [],
          signatures: []
        },
        feeInfo: {
          height: 123456,
          xlmBaseFee: '100',
          xlmBaseReserve: '5000000'
        },
        walletId: '5a78dd561c6258a907f1eeaee132f796'
      };

      const keyPair = {
        pub: 'GAA4LVBE2HEKECNWDRT2NLTSBWFIZRGTEQFC7BLOREMMPNDHFRUGP3VZ',
        prv: 'SCIVSTUJX7SYJZHKMJI4YF7YWA27FU7XN5EH4OWBFL2Y2KTYI7IP2DFZ'
      };

      // sign transaction
      const tx = yield wallet.signTransaction({
        txPrebuild: prebuilt,
        prv: keyPair.prv
      });

      const txParams = {
        recipients: [{
          address: 'GAUKA3ZTH3DZ6THBCPL6AOQBCEEBIFYDU4FGXUCHOC7PILXGUPTUBJ6E',
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
        e.message.should.equal('transaction prebuild does not have any operations');
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

    describe('Federation lookups:', function() {
      describe('Look up by stellar address:', function() {
        it('should fail to loop up an invalid stellar address with a bitgo.com domain', co(function *() {
          const stellarAddress = 'invalid*bitgo.com';
          try {
            yield basecoin.federationLookupByName(stellarAddress);
          } catch (e) {
            e.message.should.equal('account not found');
          }
        }));

        it('should resolve a stellar address into an account', co(function *() {
          const stellarAddress = 'test12345*lobstr.co';
          const accountId = 'GB5MEYCR4V2NRZH4NSI465ZEFRXPBZ74P43BMYN7AWVMAI5NNCKNZSVY';

          nock('https://lobstr.co')
          .get('/.well-known/stellar.toml')
          .reply(200, 'FEDERATION_SERVER=\'https://lobstr.co/federation\'');

          nock('https://lobstr.co')
          .get('/federation')
          .query({
            q: stellarAddress,
            type: 'name'
          })
          .reply(200, {
            stellar_address: stellarAddress,
            account_id: accountId
          });

          const res = yield basecoin.federationLookupByName(stellarAddress);
          res.should.have.property('stellar_address');
          res.should.have.property('account_id');
          res.stellar_address.should.equal(stellarAddress);
          res.account_id.should.equal(accountId);
        }));

        it('should resolve a stellar address with a bitgo.com domain', co(function *() {
          const stellarAddress = 'tester*bitgo.com';

          nock('https://test.bitgo.com')
          .get('/api/v2/txlm/federation')
          .query({
            q: stellarAddress,
            type: 'name'
          })
          .reply(200, {
            stellar_address: stellarAddress,
            account_id: 'GCBYY3S62QY43PMEKGJHRCBHEFJOHCLGSMWXREUZYDQHJHQ2LK4I42JA',
            memo_type: 'id',
            memo: '0'
          });

          const res = yield basecoin.federationLookupByName(stellarAddress);
          res.should.have.property('stellar_address');
          res.should.have.property('account_id');
          res.should.have.property('memo_type');
          res.should.have.property('memo');
          res.stellar_address.should.equal(stellarAddress);
          res.account_id.should.equal('GCBYY3S62QY43PMEKGJHRCBHEFJOHCLGSMWXREUZYDQHJHQ2LK4I42JA');
          res.memo_type.should.equal('id');
          res.memo.should.equal('0');
        }));
      });

      describe('Look up by account id:', function() {
        it('should fail to look up an account if the account id is invalid', co(function *() {
          const accountId = '123';

          nock('https://test.bitgo.com')
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id'
          })
          .reply(400, {
            detail: 'invalid id: ' + accountId
          });

          try {
            yield basecoin.federationLookupByAccountId(accountId);
          } catch (e) {
            e.message.should.equal(`invalid id: ${accountId}`);
          }
        }));

        it('should return only account_id for non-bitgo accounts', co(function *() {
          const accountId = 'GCROXHYJSTCS3CQQIU7GFC7YQIRIVGPYZQRZEM6PN7P7TAZ3PU4CHJRG';

          nock('https://test.bitgo.com')
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id'
          })
          .reply(200, {
            account_id: accountId
          });

          const res = yield basecoin.federationLookupByAccountId(accountId);
          res.should.not.have.property('stellar_address');
          res.should.not.have.property('memo_type');
          res.should.not.have.property('memo');
          res.should.have.property('account_id');
          res.account_id.should.equal(accountId);
        }));

        it('should resolve a valid account id into an account', co(function *() {
          const accountId = 'GDDHCKMYYYCVXOSAVMSEIYGYNX74LIAV3ACXYQ6WPMDUF7W3KZNWTHTH';

          nock('https://test.bitgo.com')
          .get('/api/v2/txlm/federation')
          .query({
            q: accountId,
            type: 'id'
          })
          .reply(200, {
            stellar_address: 'tester*bitgo.com',
            account_id: accountId,
            memo_type: 'id',
            memo: '0'
          });

          const res = yield basecoin.federationLookupByAccountId(accountId);
          res.should.have.property('stellar_address');
          res.should.have.property('account_id');
          res.should.have.property('memo_type');
          res.should.have.property('memo');
          res.account_id.should.equal(accountId);
          res.stellar_address.should.equal('tester*bitgo.com');
        }));
      });
    });
  });

  describe('Keypairs:', () => {
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

    it('should deterministically derive a child key from master seed and entropy seed', () => {
      const seed = Buffer.alloc(32).fill(0).toString('hex');
      const masterSeed = '0x01020304050607080910111213141516171819202122232425262728293031';

      const derivedKey = basecoin.deriveKeyWithSeed({ key: masterSeed, seed, });

      derivedKey.should.have.properties({
        key: 'GCJR3ORBWOKGFA3FTGYDDQVFEEMCYXFHY6KAUOTU4MQMFHK4LLSWWGLW',
        derivationPath: 'm/999999\'/230673453\'/206129755\'',
      });
    });
  });
});
