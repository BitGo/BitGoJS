//
// Tests for Wallets
//

import 'should';
import * as Bluebird from 'bluebird';
import * as nock from 'nock';
import * as common from '../../../src/common';
import * as _ from 'lodash';
import { TestBitGo } from '../../lib/test_bitgo';
const co = Bluebird.coroutine;

describe('V2 Wallets:', function() {
  let wallets;
  let bgUrl;

  before(co(function *before() {
    nock('https://bitgo.fakeurl')
    .persist()
    .get('/api/v1/client/constants')
    .reply(200, { ttl: 3600, constants: {} });

    const bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();

    const basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  after(function() {
    nock.cleanAll();
    nock.pendingMocks().length.should.equal(0);
  });

  describe('Add Wallet:', function() {
    it('throws on invalid arguments', co(function *() {
      // isCustodial flag is not a boolean
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, isCustodial: 1 })
      .should.be.rejectedWith('invalid argument for isCustodial - boolean expected');

      // type is not a string
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, type: 1 })
      .should.be.rejectedWith('Expecting parameter string: type but found number');

      // Address is an invalid address
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, address: '$' })
        .should.be.rejectedWith('invalid argument for address - valid address string expected');

      // signingKeyId is invalid
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, signingKeyId: 1243 })
        .should.be.rejectedWith('invalid argument for signingKeyId - valid key id string expected');

      // gasPrice is a number
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, gasPrice: '17' })
        .should.be.rejectedWith('invalid argument for gasPrice - number expected')
    }));

    it('creates a paired custodial wallet', co(function *createPairedCustodialWallet() {
      nock(bgUrl)
      .post('/api/v2/tbtc/wallet', function(body) {
        body.isCustodial.should.be.true();
        body.should.have.property('keys');
        body.m.should.equal(2);
        body.n.should.equal(3);
        return true;
      })
      .reply(200, {});
      yield wallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, isCustodial: true });
    }));

    it('creates an eos wallet with custom address', co(function *createWalletCustomAddress() {
      const eosBitGo = new TestBitGo({ env: 'mock' });
      eosBitGo.initializeTestVars();
      const eosWallets = eosBitGo.coin('teos').wallets();
      const address = 'testeosaddre';
      nock(bgUrl)
        .post('/api/v2/teos/wallet', function(body) {
          body.should.have.property('keys');
          body.m.should.equal(2);
          body.n.should.equal(3);
          body.address.should.equal(address);
          return true;
        })
        .reply(200, {});
      yield eosWallets.add({ label: 'label', enterprise: 'enterprise', keys: [], m: 2, n: 3, address });
    }));

    it('creates a single custodial wallet', co(function *createSingleCustodialWallet() {
      nock(bgUrl)
      .post('/api/v2/tbtc/wallet', function(body) {
        body.type.should.equal('custodial');
        body.should.not.have.property('keys');
        body.should.not.have.property('m');
        body.should.not.have.property('n');
        return true;
      })
      .reply(200, {});
      yield wallets.add({ label: 'label', enterprise: 'enterprise', type: 'custodial' });
    }));

    it('creates a wallet with custom gasPrice', co(function *createWalletCustomGasPrice() {
      const ethBitGo = new TestBitGo({ env: 'mock' });
      ethBitGo.initializeTestVars();
      const ethWallets = ethBitGo.coin('teth').wallets();
      nock(bgUrl)
        .post('/api/v2/teth/wallet', function(body) {
          body.type.should.equal('custodial');
          body.gasPrice.should.equal(20000000000);
          body.should.not.have.property('keys');
          body.should.not.have.property('m');
          body.should.not.have.property('n');
          return true;
        })
        .reply(200, {});
      yield ethWallets.add({ label: 'label', enterprise: 'enterprise', type: 'custodial', gasPrice: 20000000000 });
    }));
  });

  describe('Generate wallet:', function() {
    it('should validate parameters', co(function *() {
      let params = {};
      yield wallets.generateWallet(params).should.be.rejectedWith('Missing parameter: label');

      params = {
        label: 'abc',
        backupXpub: 'backup',
        backupXpubProvider: 'provider'
      };

      yield wallets.generateWallet(params).should.be.rejectedWith('Cannot provide more than one backupXpub or backupXpubProvider flag');

      params = {
        label: 'abc',
        passcodeEncryptionCode: 123
      };
      yield wallets.generateWallet(params).should.be.rejectedWith('passcodeEncryptionCode must be a string');

      params = {
        label: 'abc',
        enterprise: 1234
      };
      yield wallets.generateWallet(params).should.be.rejectedWith('invalid enterprise argument, expecting string');

      params = {
        label: 'abc',
        disableTransactionNotifications: 'string'
      };

      yield wallets.generateWallet(params).should.be.rejectedWith('invalid disableTransactionNotifications argument, expecting boolean');

      params = {
        label: 'abc',
        gasPrice: 'string'
      };

      yield wallets.generateWallet(params).should.be.rejectedWith('invalid gas price argument, expecting number');

      params = {
        label: 'abc',
        disableKRSEmail: 'string'
      };

      yield wallets.generateWallet(params).should.be.rejectedWith('invalid disableKRSEmail argument, expecting boolean');

      params = {
        label: 'abc',
        krsSpecific: {
          malicious: {
            javascript: {
              code: 'bad.js'
            }
          }
        }
      };

      yield wallets.generateWallet(params).should.be.rejectedWith('krsSpecific object contains illegal values. values must be strings, booleans, or numbers');
    }));

    it('should correctly disable krs emails when creating backup keychains', co(function *() {
      const params = {
        label: 'my_wallet',
        disableKRSEmail: true,
        backupXpubProvider: 'test',
        passphrase: 'test123',
        userKey: 'xpub123'
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

      yield wallets.generateWallet(params);
    }));

    it('should correctly pass through the krsSpecific param when creating backup keychains', co(function *() {
      const params = {
        label: 'my_wallet',
        backupXpubProvider: 'test',
        passphrase: 'test123',
        userKey: 'xpub123',
        krsSpecific: { coverage: 'insurance', expensive: true, howExpensive: 25 }
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

      yield wallets.generateWallet(params);
    }));
  });

  describe('Sharing', () => {
    it('should share a wallet to viewer', co(function *() {
      const shareId = '123';

      nock(bgUrl)
        .get(`/api/v2/tbtc/walletshare/${shareId}`)
        .reply(200, {});
      const acceptShareNock = nock(bgUrl)
        .post(`/api/v2/tbtc/walletshare/${shareId}`, { walletShareId: shareId, state: 'accepted' })
        .reply(200, {});

      yield wallets.acceptShare({ walletShareId: shareId });
      acceptShareNock.isDone().should.be.True();
    }));
  });
});
