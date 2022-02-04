//
// Tests for Wallets
//

import 'should';
import * as nock from 'nock';
import * as common from '../../../src/common';
import * as _ from 'lodash';
import { TestBitGo } from '../../lib/test_bitgo';

describe('V2 Wallets:', function () {
  let wallets;
  let bgUrl;

  before(function () {
    nock('https://bitgo.fakeurl')
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants: {} });

    const bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();

    const basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  after(function () {
    nock.cleanAll();
    nock.pendingMocks().length.should.equal(0);
  });

  describe('Add Wallet:', function () {
    it('throws on invalid arguments', async function () {
      // isCustodial flag is not a boolean
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, isCustodial: 1 })
        .should.be.rejectedWith('invalid argument for isCustodial - boolean expected');

      // type is not a string
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, type: 1 })
        .should.be.rejectedWith('Expecting parameter string: type but found number');

      // Address is an invalid address
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, address: '$' })
        .should.be.rejectedWith('invalid argument for address - valid address string expected');

      // gasPrice is a number
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, gasPrice: '17' })
        .should.be.rejectedWith('invalid argument for gasPrice - number expected');

      // walletVersion is a number
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, walletVersion: '1' })
        .should.be.rejectedWith('invalid argument for walletVersion - number expected');
    });

    it('creates a paired custodial wallet', async function () {
      nock(bgUrl)
        .post('/api/v2/tbtc/wallet', function (body) {
          body.isCustodial.should.be.true();
          body.should.have.property('keys');
          body.m.should.equal(2);
          body.n.should.equal(3);
          return true;
        })
        .reply(200, {});
      await wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, isCustodial: true });
    });

    it('creates an eos wallet with custom address', async function () {
      const eosBitGo = new TestBitGo({ env: 'mock' });
      eosBitGo.initializeTestVars();
      const eosWallets = eosBitGo.coin('teos').wallets();
      const address = 'testeosaddre';
      nock(bgUrl)
        .post('/api/v2/teos/wallet', function (body) {
          body.should.have.property('keys');
          body.m.should.equal(2);
          body.n.should.equal(3);
          body.address.should.equal(address);
          return true;
        })
        .reply(200, {});
      await eosWallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, address });
    });

    it('creates a single custodial wallet', async function () {
      nock(bgUrl)
        .post('/api/v2/tbtc/wallet', function (body) {
          body.type.should.equal('custodial');
          body.should.not.have.property('keys');
          body.should.not.have.property('m');
          body.should.not.have.property('n');
          return true;
        })
        .reply(200, {});
      await wallets.add({ label: 'label', enterprise: 'enterprise', type: 'custodial' });
    });

    it('creates a wallet with custom gasPrice', async function () {
      const ethBitGo = new TestBitGo({ env: 'mock' });
      ethBitGo.initializeTestVars();
      const ethWallets = ethBitGo.coin('teth').wallets();
      nock(bgUrl)
        .post('/api/v2/teth/wallet', function (body) {
          body.type.should.equal('custodial');
          body.gasPrice.should.equal(20000000000);
          body.should.not.have.property('keys');
          body.should.not.have.property('m');
          body.should.not.have.property('n');
          return true;
        })
        .reply(200, {});
      await ethWallets.add({ label: 'label', enterprise: 'enterprise', type: 'custodial', gasPrice: 20000000000 });
    });

    it('creates a new wallet with walletVersion', async function () {
      const ethBitGo = new TestBitGo({ env: 'mock' });
      ethBitGo.initializeTestVars();
      const ethWallets = ethBitGo.coin('teth').wallets();
      nock(bgUrl)
        .post('/api/v2/teth/wallet', function (body) {
          body.type.should.equal('custodial');
          body.walletVersion.should.equal(1);
          body.should.not.have.property('keys');
          body.should.not.have.property('m');
          body.should.not.have.property('n');
          return true;
        })
        .reply(200, {});
      await ethWallets.add({ label: 'label', enterprise: 'enterprise', type: 'custodial', walletVersion: 1 });
    });
  });

  describe('Generate wallet:', function () {
    it('should validate parameters', async function () {
      let params = {};
      await wallets.generateWallet(params).should.be.rejectedWith('Missing parameter: label');

      params = {
        label: 'abc',
        backupXpub: 'backup',
        backupXpubProvider: 'provider',
      };

      await wallets.generateWallet(params).should.be.rejectedWith('Cannot provide more than one backupXpub or backupXpubProvider flag');

      params = {
        label: 'abc',
        passcodeEncryptionCode: 123,
      };
      await wallets.generateWallet(params).should.be.rejectedWith('passcodeEncryptionCode must be a string');

      params = {
        label: 'abc',
        enterprise: 1234,
      };
      await wallets.generateWallet(params).should.be.rejectedWith('invalid enterprise argument, expecting string');

      params = {
        label: 'abc',
        disableTransactionNotifications: 'string',
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid disableTransactionNotifications argument, expecting boolean');

      params = {
        label: 'abc',
        gasPrice: 'string',
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid gas price argument, expecting number or number as string');

      params = {
        label: 'abc',
        gasPrice: true,
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid gas price argument, expecting number or number as string');

      params = {
        label: 'abc',
        gasPrice: 123,
        eip1559: {
          maxFeePerGas: 1234,
          maxPriorityFeePerGas: 123,
        },
      };

      await wallets.generateWallet(params).should.be.rejectedWith('can not use both eip1559 and gasPrice values');

      params = {
        label: 'abc',
        eip1559: {
          maxFeePerGas: 'q1234',
          maxPriorityFeePerGas: '123',
        },
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid max fee argument, expecting number or number as string');

      params = {
        label: 'abc',
        eip1559: {
          maxFeePerGas: 1234,
          maxPriorityFeePerGas: '123a',
        },
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid priority fee argument, expecting number or number as string');

      params = {
        label: 'abc',
        disableKRSEmail: 'string',
      };

      await wallets.generateWallet(params).should.be.rejectedWith('invalid disableKRSEmail argument, expecting boolean');

      params = {
        label: 'abc',
        krsSpecific: {
          malicious: {
            javascript: {
              code: 'bad.js',
            },
          },
        },
      };

      await wallets.generateWallet(params).should.be.rejectedWith('krsSpecific object contains illegal values. values must be strings, booleans, or numbers');
    });

    it('should correctly disable krs emails when creating backup keychains', async function () {
      const params = {
        label: 'my_wallet',
        disableKRSEmail: true,
        backupXpubProvider: 'test',
        passphrase: 'test123',
        userKey: 'xpub123',
      };

      // bitgo key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'bitgo' }))
        .reply(200);

      // user key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.conforms({ pub: (p) => p.startsWith('xpub') }))
        .reply(200);

      // backup key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'backup', provider: params.backupXpubProvider, disableKRSEmail: true }))
        .reply(200);

      // wallet
      nock(bgUrl)
        .post('/api/v2/tbtc/wallet')
        .reply(200);

      await wallets.generateWallet(params);
    });

    it('should correctly pass through the krsSpecific param when creating backup keychains', async function () {
      const params = {
        label: 'my_wallet',
        backupXpubProvider: 'test',
        passphrase: 'test123',
        userKey: 'xpub123',
        krsSpecific: { coverage: 'insurance', expensive: true, howExpensive: 25 },
      };

      // bitgo key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'bitgo' }))
        .reply(200);

      // user key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.conforms({ pub: (p) => p.startsWith('xpub') }))
        .reply(200);

      // backup key
      nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'backup', provider: params.backupXpubProvider, krsSpecific: { coverage: 'insurance', expensive: true, howExpensive: 25 } }))
        .reply(200);

      // wallet
      nock(bgUrl)
        .post('/api/v2/tbtc/wallet')
        .reply(200);

      await wallets.generateWallet(params);
    });

    it('should send the cold derivation seed for a user key', async () => {
      const params = {
        label: 'my-cold-wallet',
        passphrase: 'test123',
        userKey: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        coldDerivationSeed: '123',
      };

      // bitgo key
      const bitgoKeyNock = nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'bitgo' }))
        .reply(200);

      // user key
      const userKeyNock = nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({
          derivedFromParentWithSeed: params.coldDerivationSeed,
        }))
        .reply(200);

      // backup key
      const backupKeyNock = nock(bgUrl)
        .post('/api/v2/tbtc/key', _.matches({ source: 'backup' }))
        .reply(200);

      // wallet
      const walletNock = nock(bgUrl)
        .post('/api/v2/tbtc/wallet')
        .reply(200);

      await wallets.generateWallet(params);
      for (const scope of [bitgoKeyNock, userKeyNock, backupKeyNock, walletNock]) {
        scope.done();
      }
    });

    describe('should build a wallet and create user Key with addressDerivationKeypair property', () => {
      const coins = ['tdot', 'tsol'];
      const coinBitGo = new TestBitGo({ env: 'mock' });
      coins.forEach((coinName) => {
        it(`should succeed for ${coinName}`, async () => {
          coinBitGo.initializeTestVars();
          const coin = coinBitGo.coin(coinName);
          const coinWallets = coin.wallets();
          const params = {
            label: `${coinName} wallet`,
            passphrase: 'test123',
          };

          // bitgo key
          const bitgoNock = nock(bgUrl)
            .post(`/api/v2/${coinName}/key`, _.matches({ source: 'bitgo' }))
            .reply(200, {
              source: 'bitgo',
              pub: 'xpub661MyMwAqRbcG2BHZQ4yyTUahESFuDxGdYvi5BboL55NUw5awfZNowj7bYyxmPDcVgW7ocrVKD45u7hejWUmhXFa6G8SEMrj7wm5g9weJnH',
              prv: 'xprv9s21ZrQH143K3Y6pTNXycKXr9CbmVmERGL17GoCBmjYPc8kSQ8F8G9QdkJGAyriQ9Bmzn3jqsmbQLzFRbgxn8rnaE4LWJuts9pjxvSeVX8F',
            });

          // user key
          const userNock = nock(bgUrl)
            .post(`/api/v2/${coinName}/key`, _.conforms({ addressDerivationKeypair: (a) => _.isString(a.pub) && _.isString(a.encryptedPrv) }))
            .reply(200, (uri, requestBody) => {
              const parsedBody = JSON.parse(requestBody as string);
              parsedBody.should.properties(['pub', 'encryptedPrv', 'addressDerivationKeypair']);
              parsedBody.addressDerivationKeypair.should.properties(['pub', 'encryptedPrv']);
              return parsedBody;
            });

          // backup key
          const backupNock = nock(bgUrl)
            .post(`/api/v2/${coinName}/key`, _.matches({ source: 'backup' }))
            .reply(200, (uri, requestBody) => JSON.parse(requestBody as string));

          // wallet
          const walletNock = nock(bgUrl)
            .post(`/api/v2/${coinName}/wallet`)
            .reply(200);

          await coinWallets.generateWallet(params);

          bitgoNock.isDone().should.be.true();
          userNock.isDone().should.be.true();
          backupNock.isDone().should.be.true();
          walletNock.isDone().should.be.true();
        });
      });

    });
  });

  describe('Sharing', () => {
    it('should share a wallet to viewer', async function () {
      const shareId = '123';

      nock(bgUrl)
        .get(`/api/v2/tbtc/walletshare/${shareId}`)
        .reply(200, {});
      const acceptShareNock = nock(bgUrl)
        .post(`/api/v2/tbtc/walletshare/${shareId}`, { walletShareId: shareId, state: 'accepted' })
        .reply(200, {});

      await wallets.acceptShare({ walletShareId: shareId });
      acceptShareNock.done();
    });
  });
});
