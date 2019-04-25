import * as should from 'should';
import 'should-http';
import * as Promise from 'bluebird';
const co = Promise.coroutine;

import request = require('supertest-as-promised');
const BN = require('ethereumjs-util').BN;

const expressApp = require('../../../../src/expressApp');
const TestV2BitGo = require('../../../lib/test_bitgo');
const testUtil = require('../../../integration/testutil');

describe('ETH:', function() {
  let bitgo;
  let wallet;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();

    yield bitgo.authenticateTestUser(bitgo.testUserOTP());
    wallet = yield bitgo.coin('teth').wallets().getWallet({ id: TestV2BitGo.V2.TEST_ETH_WALLET_ID });
  }));

  describe('Keychains', function() {
    it('should fail to create a key without an enterprise ID', function() {
      const ethKeychains = bitgo.coin('eth').keychains();
      try {
        ethKeychains.createBitGo();
        throw new Error();
      } catch (e) {
        e.message.should.containEql('expecting enterprise when adding BitGo key');
      }
    });
  });

  describe('Non-BitGo Recovery', function() {
    it('should construct a recovery transaction without BitGo', co(function *() {
      const basecoin = bitgo.coin('teth');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
        '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
        'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
        'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
        't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    }));

    it('should error when the backup key is unfunded (cannot pay gas)', co(function *() {
      const basecoin = bitgo.coin('teth');
      const error = yield bitgo.getAsyncError(basecoin.recover({
        userKey: '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
        'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
        'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
        backupKey: '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
        ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
        '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
        'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
        walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054'
      }));

      should.exist(error);
      error.message.should.equal('Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0. This address must have a balance of at least 0.01 ETH to perform recoveries. Try sending some ETH to this address then retry.');
    }));
  });

  describe('Token Recovery', function() {
    it('should successfully construct a recovery transaction for tokens stuck in a wallet', co(function *() {
      // There should be 42 Potatokens stuck in our test wallet
      const tx = yield wallet.recoverToken({
        tokenContractAddress: TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
        recipient: TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
        walletPassphrase: TestV2BitGo.V2.TEST_ETH_WALLET_PASSPHRASE
      });

      should.exist(tx);
      tx.should.have.property('halfSigned');

      const txInfo = tx.halfSigned;
      txInfo.should.have.property('contractSequenceId');
      txInfo.should.have.property('expireTime');
      txInfo.should.have.property('gasLimit');
      txInfo.gasLimit.should.equal(500000);
      txInfo.should.have.property('gasPrice');
      txInfo.gasPrice.should.equal(20000000000);
      txInfo.should.have.property('operationHash');
      txInfo.should.have.property('signature');
      txInfo.should.have.property('tokenContractAddress');
      txInfo.tokenContractAddress.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_ADDRESS);
      txInfo.should.have.property('walletId');
      txInfo.walletId.should.equal(TestV2BitGo.V2.TEST_ETH_WALLET_ID);
      txInfo.should.have.property('recipient');
      txInfo.recipient.should.have.property('address');
      txInfo.recipient.address.should.equal(TestV2BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
      txInfo.recipient.should.have.property('amount');
      txInfo.recipient.amount.should.equal('4200');
    }));
  });

  describe('Non-BitGo Token Recovery', function() {
    it('should construct a token recovery transaction without BitGo', co(function *() {
      const basecoin = yield bitgo.token('0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsnQ0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOtoKDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrIt9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0x5df5a96b478bb1808140d87072143e60262e8670'
      });

      // id and tx will always be different because of expireTime
      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
    }));

    it('should construct a token recovery transaction without BitGo and with KRS', co(function *() {
      const basecoin = yield bitgo.token('0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de');
      const recovery = yield basecoin.recover({
        userKey: '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsnQ0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
        backupKey: 'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
        walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
        walletPassphrase: TestV2BitGo.V2.TEST_RECOVERY_PASSCODE,
        recoveryDestination: '0x5df5a96b478bb1808140d87072143e60262e8670',
        krsProvider: 'keyternal'
      });

      should.exist(recovery);
      recovery.should.have.property('id');
      recovery.should.have.property('tx');
      recovery.should.have.property('coin');
      recovery.coin.should.equal('erc20');
      recovery.should.have.property('backupKey');
      recovery.backupKey.should.equal('xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm');
    }));
  });

  describe('Token Flush Thresholds', function() {
    it('should be updated', co(function *() {
      yield wallet.updateTokenFlushThresholds({ terc: 10 });
      wallet.tokenFlushThresholds().should.match({ terc: '10' });

      // tokens that are not updated remain unchanged
      yield wallet.updateTokenFlushThresholds({ tbst: 100 });
      wallet.tokenFlushThresholds().should.match({ tbst: '100', terc: '10' });
    }));
  });

  describe('Express', () => {
    let agent;
    let testWalletId;
    let testWalletPassphrase;
    let testWalletFirstAddress;

    const authHeader = {
      Authorization: 'Bearer ' + TestV2BitGo.TEST_ACCESSTOKEN
    };

    before(co(function *() {
      if ((process as any).browser) {
        this.skip();
      }

      const args = {
        debug: false,
        env: 'test',
        logfile: '/dev/null'
      };
      const bitgo = new TestV2BitGo();
      bitgo.initializeTestVars();
      const app = expressApp.app(args);
      agent = request.agent(app);
      yield bitgo.checkFunded(agent);

      // this should exist on the test env hand have some eth funding
      testWalletId = TestV2BitGo.V2.TEST_ETH_WALLET_ID;
      testWalletPassphrase = TestV2BitGo.V2.TEST_ETH_WALLET_PASSPHRASE;

      // this address belongs to the test wallet
      testWalletFirstAddress = TestV2BitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS;

      yield testUtil.unlockToken(agent, TestV2BitGo.TEST_ACCESSTOKEN, 30);
    }));

    it('can do sendcoins', co(function *() {
      // fetch one new address
      let res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
      .set(authHeader);
      res.statusCode.should.equal(200);
      const { addresses } = res.body;
      const destAddress = addresses[1].address;

      res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendcoins`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        address: destAddress,
        amount: '10000'
      });
      res.should.have.status(200);
    }));


    it('can do sendmany', co(function *() {
      // fetch two new addresses
      let res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
      .set(authHeader);
      res.should.have.status(200);
      const { addresses } = res.body;
      const destAddress1 = addresses[1].address;
      const destAddress2 = addresses[2].address;

      res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendmany`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        recipients: [
          { address: destAddress1, amount: '10000' },
          { address: destAddress2, amount: '20000' }
        ]
      });

      // Ethereum does not support "sendmany" with multiple recipients, see JIRA BG-994
      res.should.have.status(400);

      // Sendmany with single recipient is fine
      res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/sendmany`)
      .set(authHeader)
      .send({
        walletPassphrase: testWalletPassphrase,
        recipients: [
          { address: destAddress1, amount: '10000' }
        ]
      });
      res.should.have.status(200);
    }));

    it('can create new wallet and delete it', co(function *() {
      const label = 'bitgoExpressEth.js temporary test wallet';
      let res = yield agent
      .post('/api/v2/teth/wallet/generate')
      .set(authHeader)
      .send({ passphrase: testWalletPassphrase, label, enterprise: TestV2BitGo.TEST_ENTERPRISE });
      res.statusCode.should.equal(200);

      res = yield agent
      .delete(`/api/v2/teth/wallet/${res.body.id}`)
      .set(authHeader)
      .send({ passphrase: testWalletPassphrase });
      res.statusCode.should.equal(200);
    }));

    it('can list wallets', co(function *() {
      const res = yield agent
      .get('/api/v2/teth/wallet')
      .set(authHeader);
      res.statusCode.should.equal(200);
      res.body.wallets.length.should.not.equal(0);
    }));

    it('can fetch testWallet', co(function *() {
      const res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}`)
      .set(authHeader);
      res.statusCode.should.equal(200);
      res.body.id.should.equal(testWalletId);

      ((new BN(res.body.spendableBalanceString)).gt(0)).should.equal(true);
    }));

    it('can list deposit addresses', co(function *() {
      const res = yield agent
      .get(`/api/v2/teth/wallet/${testWalletId}/addresses`)
      .set(authHeader);
      res.statusCode.should.equal(200);
      res.body.addresses
      .filter(({ address }) => address === testWalletFirstAddress).length
      .should.equal(1);
    }));

    it('can create new address', co(function *() {
      const res = yield agent
      .post(`/api/v2/teth/wallet/${testWalletId}/address`)
      .set(authHeader);
      res.statusCode.should.equal(200);
    }));
  });
});
