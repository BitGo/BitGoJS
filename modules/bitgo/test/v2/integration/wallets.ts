//
// Tests for Wallets
//

import * as should from 'should';
import { coroutine as co } from 'bluebird';
import { TestBitGo } from '../../lib/test_bitgo';
import { restore } from 'nock';
const Q = require('q');

describe('V2 Wallets:', function () {
  let bitgo;
  let wallets;
  let keychains;
  let basecoin;

  before(function () {
    // TODO: replace dev with test
    restore();
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    keychains = basecoin.keychains();
    return bitgo.authenticateTestUser(bitgo.testUserOTP());
  });

  describe('Per-coin tests', function () {
    function testWalletGeneration(coin) {
      return co(function* () {
        const basecoin = bitgo.coin(coin);
        const wallets = basecoin.wallets();
        const params: any = {
          label: `Test ${coin} wallet`,
          passphrase: 'yoplait',
        };

        if (coin === 'teth') {
          params.enterprise = TestBitGo.TEST_ENTERPRISE;
        }

        const wallet = yield wallets.generateWallet(params);
        const walletObject = wallet.wallet;
        walletObject._wallet.coin.should.equal(coin);
        const removal = yield wallet.wallet.remove();
        removal.deleted.should.equal(true);
      }).call(this);
    }

    // TODO enable add txlm when it's supported by the platform and IMS in test
    it(
      `should generate a tbtc wallet`,
      co(function* () {
        yield testWalletGeneration('tbtc');
      })
    );

    it(
      `should generate a tbch wallet`,
      co(function* () {
        yield testWalletGeneration('tbch');
      })
    );

    it(
      `should generate a txrp wallet`,
      co(function* () {
        yield testWalletGeneration('txrp');
      })
    );

    it(
      `should generate a teth wallet`,
      co(function* () {
        yield testWalletGeneration('teth');
      })
    );

    it(
      `should generate a tltc wallet`,
      co(function* () {
        yield testWalletGeneration('tltc');
      })
    );

    it(
      `should generate a talgo wallet`,
      co(function* () {
        yield testWalletGeneration('talgo');
      })
    );
  });

  describe('Generate Wallet', function () {
    const passphrase = 'yoplait';
    const label = 'v2 wallet';

    it(
      'arguments',
      co(function* () {
        yield wallets.generateWallet().should.be.rejected();
        yield wallets.generateWallet('invalid').should.be.rejected();
        yield wallets.generateWallet({}, 0).should.be.rejected();
        yield wallets
          .generateWallet({
            passphrase: passphrase,
            label: label,
            backupXpub: 'xpub',
            backupXpubProvider: 'krs',
          })
          .should.be.rejected();
        yield wallets
          .generateWallet({
            passphrase: passphrase,
            label: label,
            disableTransactionNotifications: 'blah',
          })
          .should.be.rejected();
      })
    );

    it('should make wallet with client-generated user and backup key', function () {
      const params = {
        passphrase: passphrase,
        label: label,
        disableTransactionNotifications: true,
      };

      return wallets
        .generateWallet(params)
        .then(function (res) {
          res.should.have.property('wallet');
          res.should.have.property('userKeychain');
          res.should.have.property('backupKeychain');
          res.should.have.property('bitgoKeychain');

          res.userKeychain.should.have.property('pub');
          res.userKeychain.should.have.property('prv');
          res.userKeychain.should.have.property('encryptedPrv');

          res.backupKeychain.should.have.property('pub');
          res.backupKeychain.should.have.property('prv');

          res.bitgoKeychain.should.have.property('pub');
          res.bitgoKeychain.isBitGo.should.equal(true);
          res.bitgoKeychain.should.not.have.property('prv');
          res.bitgoKeychain.should.not.have.property('encryptedPrv');

          res.wallet.should.have.property('_permissions');
          res.wallet._permissions.length.should.equal(3);
          res.wallet._permissions.should.containEql('admin');
          res.wallet._permissions.should.containEql('view');
          res.wallet._permissions.should.containEql('spend');
          return res.wallet.remove();
        })
        .then(function (removal) {
          removal.deleted.should.equal(true);
        });
    });

    it('should make wallet with client-generated user and krs backupkey', function () {
      const xpub = keychains.create().pub; // random xpub
      const params = {
        passphrase: passphrase,
        label: label,
        backupXpub: xpub,
      };
      return wallets
        .generateWallet(params)
        .then(function (res) {
          res.should.have.property('wallet');
          res.should.have.property('userKeychain');
          res.should.have.property('backupKeychain');
          res.should.have.property('bitgoKeychain');

          res.backupKeychain.should.have.property('pub');
          res.backupKeychain.should.not.have.property('prv');
          return res.wallet.remove();
        })
        .then(function (removal) {
          removal.deleted.should.equal(true);
        });
    });

    it('should make wallet with provided user key and backup key', function () {
      const backupXpub = keychains.create().pub; // random xpub
      const userXpub = keychains.create().pub; // random xpub
      const params = {
        label: label,
        backupXpub: backupXpub,
        userKey: userXpub,
      };

      return wallets
        .generateWallet(params)
        .then(function (res) {
          res.should.have.property('wallet');
          res.should.have.property('userKeychain');
          res.should.have.property('backupKeychain');
          res.should.have.property('bitgoKeychain');

          res.userKeychain.should.have.property('pub');
          res.userKeychain.should.not.have.property('prv');
          res.userKeychain.should.not.have.property('encryptedPrv');
          return res.wallet.remove();
        })
        .then(function (removal) {
          removal.deleted.should.equal(true);
        });
    });

    it('should make wallet with provided user key and custom derivation path', function () {
      const userXpub = keychains.create().pub; // random xpub
      const params = {
        label: label,
        userKey: userXpub,
        coldDerivationSeed: 'custom-derivation-seed',
        passphrase: passphrase,
      };

      return wallets
        .generateWallet(params)
        .then(function (res) {
          res.should.have.property('wallet');
          res.should.have.property('userKeychain');
          res.should.have.property('backupKeychain');
          res.should.have.property('bitgoKeychain');

          res.userKeychain.should.have.property('pub');
          res.userKeychain.should.have.property('derivationPath');
          res.userKeychain.derivationPath.should.equal('m/999999/112305623/88990619');
          res.userKeychain.should.not.have.property('prv');
          res.userKeychain.should.not.have.property('encryptedPrv');
          return res.wallet.remove();
        })
        .then(function (removal) {
          removal.deleted.should.equal(true);
        });
    });

    it('should generate wallet and freeze it', function () {
      const backupXpub = keychains.create().pub; // random xpub
      const userXpub = keychains.create().pub; // random xpub
      const params = {
        label: label,
        backupXpub: backupXpub,
        userKey: userXpub,
      };

      return bitgo
        .unlock({ otp: '0000000' })
        .then(function (res) {
          return wallets.generateWallet(params);
        })
        .then(function (res) {
          return res.wallet.freeze({ otp: '0000000' });
        })
        .then(function (freeze) {
          freeze.should.have.property('expires');
          freeze.should.have.property('time');
        });
    });
  });

  describe('Add Wallet', function () {
    let userKeychainId;
    let backupKeychainId;
    let bitgoKeychainId;

    it(
      'arguments',
      co(function* () {
        yield wallets.add().should.be.rejected();
        yield wallets.add('invalid').should.be.rejected();
        yield wallets.add({}, 0).should.be.rejected();
        yield wallets
          .add(
            {
              keys: [],
              m: 'bad',
              n: 3,
            },
            0
          )
          .should.be.rejected();

        yield wallets
          .add(
            {
              keys: [],
              m: 1,
              n: 3,
            },
            0
          )
          .should.be.rejected();

        yield wallets
          .add(
            {
              keys: [],
              m: 2,
              n: 3,
              tags: 'bad arg',
            },
            0
          )
          .should.be.rejected();

        yield wallets
          .add(
            {
              keys: [],
              m: 2,
              n: 3,
              tags: [],
              clientFlags: 'bad arg',
            },
            0
          )
          .should.be.rejected();
      })
    );

    it('should add a wallet with pre generated keys', function () {
      let userKeychain;

      // Add the user keychain
      const userKeychainPromise = Q.fcall(function () {
        userKeychain = keychains.create();
        return keychains.add(userKeychain);
      }).then(function (keychain) {
        userKeychainId = keychain.id;
      });

      const backupKeychainPromise = Q.fcall(function () {
        return keychains.createBackup();
      }).then(function (newBackupKeychain) {
        backupKeychainId = newBackupKeychain.id;
      });

      const bitgoKeychainPromise = keychains.createBitGo().then(function (keychain) {
        bitgoKeychainId = keychain.id;
      });

      // Add the user keychain
      return Q.all([userKeychainPromise, backupKeychainPromise, bitgoKeychainPromise])
        .then(function () {
          const params = {
            label: 'sample wallet',
            m: 2,
            n: 3,
            keys: [userKeychainId, backupKeychainId, bitgoKeychainId],
            isCold: true,
          };
          return wallets.add(params);
        })
        .then(function (res) {
          res.should.have.property('wallet');
          res.wallet.should.have.property('_wallet');
          res.wallet._wallet.should.have.property('keys');
          res.wallet._wallet.keys[0].should.equal(userKeychainId);
          res.wallet._wallet.keys[1].should.equal(backupKeychainId);
          res.wallet._wallet.keys[2].should.equal(bitgoKeychainId);
          return res.wallet.remove();
        })
        .then(function (removal) {
          removal.deleted.should.equal(true);
        });
    });
  });

  describe('Get Wallet', function () {
    const webhookUrl = 'https://mockbin.org/bin/dbd0a0cd-060a-4a64-8cd8-f3113b36cb7d';

    before(async function () {
      const currentWallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET1_ID });
      await currentWallet.removeWebhook({ url: webhookUrl, type: 'transfer' });
    });

    it('should get wallet', function () {
      return wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET1_ID }).then(function (wallet) {
        should.exist(wallet);
        wallet.should.have.property('baseCoin');
        wallet.should.have.property('bitgo');
        wallet.should.have.property('_wallet');
        wallet = wallet._wallet;
        wallet.label.should.equal('Test Wallet');
        wallet.balance.should.be.greaterThan(0);
        wallet.confirmedBalance.should.be.greaterThan(0);
        wallet.coin.should.equal('tbtc');
        wallet.id.should.equal(TestBitGo.V2.TEST_WALLET1_ID);
        wallet.approvalsRequired.should.equal(1);
        wallet.m.should.equal(2);
        wallet.n.should.equal(3);
      });
    });

    it('should get wallet by address', function () {
      return wallets.getWalletByAddress({ address: TestBitGo.V2.TEST_WALLET1_ADDRESS }).then(function (wallet) {
        should.exist(wallet);
        wallet.should.have.property('baseCoin');
        wallet.should.have.property('bitgo');
        wallet.should.have.property('_wallet');
        wallet = wallet._wallet;
        wallet.label.should.equal('Test Wallet');
        wallet.balance.should.be.greaterThan(0);
        wallet.confirmedBalance.should.be.greaterThan(0);
        wallet.coin.should.equal('tbtc');
        wallet.id.should.equal(TestBitGo.V2.TEST_WALLET1_ID);
        wallet.approvalsRequired.should.equal(1);
        wallet.m.should.equal(2);
        wallet.n.should.equal(3);
      });
    });

    it('should add webhook to wallet, simulate it, and then remove it', function () {
      let wallet;
      let count;
      let webhookId;
      return wallets
        .getWallet({ id: TestBitGo.V2.TEST_WALLET1_ID })
        .then(function (currentWallet) {
          wallet = currentWallet;
          return wallet.listWebhooks();
        })
        .then(function (webhooks) {
          webhooks.should.have.property('webhooks');
          count = webhooks.webhooks.length;
          return wallet.addWebhook({
            url: webhookUrl,
            type: 'transfer',
          });
        })
        .then(function (webhook) {
          webhook.should.have.property('id');
          webhook.should.have.property('url');
          webhook.should.have.property('type');
          webhook.should.have.property('coin');
          webhook.should.have.property('walletId');
          webhookId = webhook.id;
          return wallet.listWebhooks();
        })
        .then(function (webhooks) {
          webhooks.should.have.property('webhooks');
          webhooks.webhooks.length.should.equal(count + 1);
          return wallet.simulateWebhook({
            webhookId: webhookId,
            transferId: TestBitGo.V2.TEST_WEBHOOK_TRANSFER_SIMULATION_ID,
          });
        })
        .then(function (simulation) {
          simulation.should.have.property('webhookNotifications');
          const notification = simulation.webhookNotifications[0];
          notification.url.should.equal(webhookUrl);
          notification.hash.should.equal('96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea');
          notification.type.should.equal('transfer');
          notification.coin.should.equal('tbtc');
          return wallet.removeWebhook({
            url: webhookUrl,
            type: 'transfer',
          });
        })
        .then(function (webhookRemoval) {
          webhookRemoval.should.have.property('removed');
          return wallet.listWebhooks();
        })
        .then(function (webhooks) {
          webhooks.should.have.property('webhooks');
          webhooks.webhooks.length.should.equal(count);
        });
    });
  });

  describe('Get total wallet balances', function () {
    let knownBalanceBitgo;
    let knownBalanceBasecoin;
    let knownBalanceWallets;

    before(
      co(function* () {
        knownBalanceBitgo = new TestBitGo({ env: 'test' });
        knownBalanceBitgo.initializeTestVars();
        knownBalanceBasecoin = knownBalanceBitgo.coin('tltc');
        knownBalanceWallets = knownBalanceBasecoin.wallets();
        return knownBalanceBitgo.authenticateKnownBalanceTestUser(bitgo.testUserOTP());
      })
    );

    it(
      'should get total balance across all wallets',
      co(function* () {
        const result = yield knownBalanceWallets.getTotalBalances({});

        // make sure result looks structurally correct
        should.exist(result);
        result.should.have.property('balance');
        result.should.have.property('confirmedBalance');
        result.should.have.property('spendableBalance');
        result.should.have.property('balanceString');
        result.should.have.property('confirmedBalanceString');
        result.should.have.property('spendableBalanceString');

        // verify property types
        result.balance.should.be.a.Number();
        result.confirmedBalance.should.be.a.Number();
        result.spendableBalance.should.be.a.Number();
        result.balanceString.should.be.a.String();
        result.confirmedBalanceString.should.be.a.String();
        result.spendableBalanceString.should.be.a.String();

        // make sure balances match up with the known balance
        result.balance.should.equal(TestBitGo.TEST_KNOWN_BALANCE);
        result.confirmedBalance.should.equal(TestBitGo.TEST_KNOWN_BALANCE);
        result.spendableBalance.should.equal(TestBitGo.TEST_KNOWN_BALANCE);
        result.balanceString.should.equal(TestBitGo.TEST_KNOWN_BALANCE.toString());
        result.confirmedBalanceString.should.equal(TestBitGo.TEST_KNOWN_BALANCE.toString());
        result.spendableBalanceString.should.equal(TestBitGo.TEST_KNOWN_BALANCE.toString());
      })
    );
  });
});
