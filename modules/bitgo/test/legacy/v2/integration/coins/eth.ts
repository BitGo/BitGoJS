import * as should from 'should';
import 'should-http';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';
import * as nock from 'nock';
nock.restore();

describe('ETH:', function () {
  let bitgo;
  let wallet;

  before(
    co(function* () {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();

      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
      wallet = yield bitgo.coin('teth').wallets().getWallet({ id: TestBitGo.V2.TEST_ETH_WALLET_ID });
    })
  );

  describe('Send Transaction', function () {
    it('should send to multiple recipients in single transaction', async function () {
      await bitgo.unlock({ otp: '0000000' });

      const transaction = await wallet.sendMany({
        recipients: [
          {
            amount: '1',
            address: '0x431745b89e73230b3bc8a19e019194efb4b99efd',
          },
          {
            amount: '5',
            address: '0x431745b89e73230b3bc8a19e019194efb4b99efd',
          },
        ],
        walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE,
      });

      should.exist(transaction);
      transaction.should.have.property('transfer');
      transaction.should.have.property('txid');
      transaction.should.have.property('tx');
      transaction.status.should.containEql('signed');
      transaction.transfer.entries.should.have.lengthOf(2);
      transaction.transfer.entries[0].address.should.equal('0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e');
      transaction.transfer.entries[0].value.should.equal(-6);
      transaction.transfer.entries[1].address.should.equal('0x431745b89e73230b3bc8a19e019194efb4b99efd');
      transaction.transfer.entries[1].value.should.equal(6);
      transaction.transfer.value.should.equal(-6);
    });
  });

  describe('Keychains', function () {
    it('should fail to create a key without an enterprise ID', function () {
      const ethKeychains = bitgo.coin('eth').keychains();
      try {
        ethKeychains.createBitGo();
        throw new Error();
      } catch (e) {
        e.message.should.containEql('expecting enterprise when adding BitGo key');
      }
    });
  });

  describe('Non-BitGo Recovery', function () {
    it(
      'should construct a recovery transaction without BitGo',
      co(function* () {
        const basecoin = bitgo.coin('teth');
        const recovery = yield basecoin.recover({
          userKey:
            '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI\n' +
            '8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsn\n' +
            'Q0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
          backupKey:
            '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
            ':"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOto\n' +
            'KDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrI\n' +
            't9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
          walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
        });

        // id and tx will always be different because of expireTime
        should.exist(recovery);
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
      })
    );

    it(
      'should error when the backup key is unfunded (cannot pay gas)',
      co(function* () {
        const basecoin = bitgo.coin('teth');
        yield basecoin
          .recover({
            userKey:
              '{"iv":"VNvG6t3fHfxMcfvNuafYYA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
              ':"ccm","adata":"","cipher":"aes","salt":"mc9pCk3H43w=","ct":"Qe4Z1evaXcrOMC\n' +
              'cQ/XMVVBO9M/99D1QQ6LxkG8z3fQtwwOVXM3/6doNrriprUqs+adpFC93KRcAaDroL1E6o17J2k\n' +
              'mcpXRd2CuXRFORZmZ/6QBfjKfCJ3aq0kEkDVv37gZNVT3aNtGkNSQdCEWKQLwd1++r5AkA="}\n',
            backupKey:
              '{"iv":"EjD7x0OJX9kNM/C3yEDvyQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
              ':"ccm","adata":"","cipher":"aes","salt":"Na9NvRRe3n8=","ct":"B/AtSLHolsdNLr\n' +
              '4Dlij4kQ0E6NyUUs6wo6T2HtPDAPO0hyhPPbh1OAYqIS7VlL9xmJRFC2zPxwRJvzf6OWC/m48HX\n' +
              'vgLoXYgahArhalzJVlRxcXUz4HOhozRWfv/eK3t5HJfm+25+WBOiW8YgSE7hVEYTbeBRD4="}',
            walletContractAddress: '0x22ff743216b58aeb3efc46985406b50112e9e176',
            walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
            recoveryDestination: '0xac05da78464520aa7c9d4c19bd7a440b111b3054',
          })
          .should.be.rejectedWith(
            'Backup key address 0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6 has balance 0. This address must have a balance of at least 0.01 ETH to perform recoveries. Try sending some ETH to this address then retry.'
          );
      })
    );
  });

  describe('Token Recovery', function () {
    it(
      'should successfully construct a recovery transaction for tokens stuck in a wallet',
      co(function* () {
        // There should be 42 Potatokens stuck in our test wallet
        const tx = yield wallet.recoverToken({
          tokenContractAddress: TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
          recipient: TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT,
          walletPassphrase: TestBitGo.V2.TEST_ETH_WALLET_PASSPHRASE,
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
        txInfo.tokenContractAddress.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_ADDRESS);
        txInfo.should.have.property('walletId');
        txInfo.walletId.should.equal(TestBitGo.V2.TEST_ETH_WALLET_ID);
        txInfo.should.have.property('recipient');
        txInfo.recipient.should.have.property('address');
        txInfo.recipient.address.should.equal(TestBitGo.V2.TEST_ERC20_TOKEN_RECIPIENT);
        txInfo.recipient.should.have.property('amount');
        txInfo.recipient.amount.should.equal('4200');
      })
    );
  });

  describe('Non-BitGo Token Recovery', function () {
    it(
      'should construct a token recovery transaction without BitGo',
      co(function* () {
        const basecoin = yield bitgo.token('0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de');
        const recovery = yield basecoin.recover({
          userKey:
            '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsnQ0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
          backupKey:
            '{"iv":"asB356ofC7nZtg4NBvQkiQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"1hr2HhBbBIk=","ct":"8CZc6upt+XNOtoKDD38TUg3ZUjzW+DraZlkcku2bNp0JS2s1g/iC6YTGUGtPoxDxumDlXwlWQx+5WPjZu79M8DCrIt9aZaOvHkGH9aFtMbavFX419TcrwDmpUeQFN0hRkfrIHXyHNbTpGSVAjHvHMtzDMaw+ACg="}',
          walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '0x5df5a96b478bb1808140d87072143e60262e8670',
        });

        // id and tx will always be different because of expireTime
        should.exist(recovery);
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
      })
    );

    it(
      'should construct a token recovery transaction without passphrase for advanced cold wallets',
      co(function* () {
        const basecoin = yield bitgo.token('0x945ac907cf021a6bcd07852bb3b8c087051706a9');
        const recovery = yield basecoin.recover({
          userKey:
            'xpub6BkS6QAreYc5ftRBYdApmdDmqCcMeSyPa9LkKjoipNBoudoDh6rH164izFzS3mvKrZ6MuawQEEdL33wJyb6XsoRuLfrn4pQUHf4BELaxZ1m',
          backupKey:
            'xpub6CXBBAHb5xF1ry8BDe2cbY1QB1nuiR6dtXzvVbEGKCz8jiYJrpToJbsjFmHWHY2JY11DWBWoFcUGcT7JoKGirHiQNLZ3AxsE3GaZoZzbXG5',
          walletContractAddress: '0xa5558d6e7c64af892c6e74095bd334a21c13e4c3',
          recoveryDestination: '0x5df5a96b478bb1808140d87072143e60262e8670',
        });

        // id and tx will always be different because of expireTime
        should.exist(recovery);
        recovery.should.have.property('recipients');
        recovery.should.have.property('amount');
      })
    );

    it(
      'should construct a token recovery transaction without BitGo and with KRS',
      co(function* () {
        const basecoin = yield bitgo.token('0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de');
        const recovery = yield basecoin.recover({
          userKey:
            '{"iv":"+TkmT3GJ5msVWQjBrt3lsw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"cCE20fGIobs=","ct":"NVIdYIh91J3aRI8GG0JE3DhXW3AUmz2G5RqMejdz1+t4/vovIP7lleegI7VYyWiiLvlM0OCFf3EVvV/RyXr8+2vsnQ0Vn8c2CV5FRZ80OjGYrW3A/6T/zpOz6E8CMvnD++iIpeO4r2eZJavejZxdzlxF0BRz7VI="}',
          backupKey:
            'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm',
          walletContractAddress: '0x5df5a96b478bb1808140d87072143e60262e8670',
          walletPassphrase: TestBitGo.V2.TEST_RECOVERY_PASSCODE,
          recoveryDestination: '0x5df5a96b478bb1808140d87072143e60262e8670',
          krsProvider: 'keyternal',
        });

        should.exist(recovery);
        recovery.should.have.property('id');
        recovery.should.have.property('tx');
        recovery.should.have.property('coin');
        recovery.coin.should.equal('erc20');
        recovery.should.have.property('backupKey');
        recovery.backupKey.should.equal(
          'xpub661MyMwAqRbcGsCNiG4BzbxLmXnJFo4K5gVSE2b9AxufAtpuTun1SYwg9Uykqqf4DrKrDZ6KqPm9ehthWbCma7pnaMrtXY11nY7MeFbEDPm'
        );
      })
    );
  });

  describe('Token Flush Thresholds', function () {
    it(
      'should be updated',
      co(function* () {
        yield wallet.updateTokenFlushThresholds({ terc: 10 });
        wallet.tokenFlushThresholds().should.match({ terc: '10' });

        // tokens that are not updated remain unchanged
        yield wallet.updateTokenFlushThresholds({ tbst: 100 });
        wallet.tokenFlushThresholds().should.match({ tbst: '100', terc: '10' });
      })
    );
  });
});
