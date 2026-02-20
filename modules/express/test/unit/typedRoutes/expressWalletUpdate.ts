import * as assert from 'assert';
import * as sinon from 'sinon';
import { agent as supertest } from 'supertest';
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { BitGo } from 'bitgo';
import { app } from '../../../src/expressApp';
import { DefaultConfig } from '../../../src/config';
import { PutExpressWalletUpdate } from '../../../src/typedRoutes/api/v2/expressWalletUpdate';

describe('Express Wallet Update Typed Routes Tests', function () {
  let agent: ReturnType<typeof supertest>;

  before(function () {
    const testApp = app(DefaultConfig);
    agent = supertest(testApp);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Success Cases', function () {
    it('should successfully update lightning wallet with signer details', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';
      const signerHost = 'https://signer.example.com';
      const signerTlsCert = 'base64encodedcert==';
      const signerMacaroon = 'base64encodedmacaroon==';
      const passphrase = 'MyWalletPassphrase123';

      const updateResponse = {
        id: walletId,
        label: 'Test Lightning Wallet',
        coin,
        keys: ['key1', 'key2', 'key3'],
        approvalsRequired: 1,
        balance: 1000000,
        confirmedBalance: 1000000,
        spendableBalance: 1000000,
        balanceString: '1000000',
        confirmedBalanceString: '1000000',
        spendableBalanceString: '1000000',
        enterprise: 'enterprise123',
        multisigType: 'tss' as const,
        coinSpecific: {
          [coin]: {
            signerHost,
            signerTlsCert,
          },
        },
        pendingApprovals: [],
      };

      // Stub bitgo.put() for lightning update
      const putStub = sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(updateResponse),
        }),
      });

      // Mock keychains for auth keys
      const userAuthKey = {
        id: 'userAuthKeyId123',
        pub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        encryptedPrv: 'encryptedUserAuthKey',
        source: 'user' as const,
        coinSpecific: {
          [coin]: {
            purpose: 'userAuth',
          },
        },
      };
      const nodeAuthKey = {
        id: 'nodeAuthKeyId456',
        pub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
        encryptedPrv: 'encryptedNodeAuthKey',
        source: 'user' as const,
        coinSpecific: {
          [coin]: {
            purpose: 'nodeAuth',
          },
        },
      };

      const keychainsGetStub = sinon.stub();
      keychainsGetStub.withArgs({ id: userAuthKey.id }).resolves(userAuthKey);
      keychainsGetStub.withArgs({ id: nodeAuthKey.id }).resolves(nodeAuthKey);

      const keychainsStub = {
        get: keychainsGetStub,
      } as any;

      const baseCoinStub = {
        getFamily: sinon.stub().returns('lnbtc'),
        getChain: sinon.stub().returns(coin),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      // Mock the wallet with necessary methods
      const walletStub = {
        url: sinon.stub().returns(`/api/v2/${coin}/wallet/${walletId}`),
        coin: sinon.stub().returns(coin),
        subType: sinon.stub().returns('lightningSelfCustody'),
        baseCoin: baseCoinStub,
        coinSpecific: sinon.stub().returns({
          keys: [userAuthKey.id, nodeAuthKey.id],
        }),
        bitgo: {
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          encrypt: sinon.stub().callsFake(({ input }: { input: string }) => `encrypted_${input}`),
          put: putStub,
        },
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;

      const coinStub = {
        wallets: sinon.stub().returns(walletsStub),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);
      sinon.stub(BitGo.prototype, 'put').callsFake(putStub as any);

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost,
        signerTlsCert,
        signerMacaroon,
        passphrase,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', walletId);
      res.body.should.have.property('coin', coin);
      getWalletStub.should.have.been.calledOnceWith({ id: walletId, includeBalance: false });
    });

    it('should successfully update lightning wallet on mainnet', async function () {
      const coin = 'lnbtc';
      const walletId = 'lightningWallet456';
      const signerHost = 'https://mainnet-signer.example.com';
      const signerTlsCert = 'mainnetCert==';
      const signerMacaroon = 'mainnetMacaroon==';
      const passphrase = 'SecurePassphrase456';

      const updateResponse = {
        id: walletId,
        label: 'Mainnet Lightning Wallet',
        coin,
        keys: ['mainnetKey1', 'mainnetKey2', 'mainnetKey3'],
        approvalsRequired: 1,
        balance: 5000000,
        confirmedBalance: 5000000,
        spendableBalance: 5000000,
        balanceString: '5000000',
        confirmedBalanceString: '5000000',
        spendableBalanceString: '5000000',
        enterprise: 'mainnetEnterprise456',
        multisigType: 'tss' as const,
        coinSpecific: {
          [coin]: {
            signerHost,
            signerTlsCert,
          },
        },
        pendingApprovals: [],
      };

      const putStub = sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(updateResponse),
        }),
      });

      const userAuthKey = {
        id: 'userAuthKeyMainnet',
        pub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        encryptedPrv: 'encryptedMainnetKey',
        source: 'user' as const,
        coinSpecific: {
          [coin]: {
            purpose: 'userAuth',
          },
        },
      };
      const nodeAuthKey = {
        id: 'nodeAuthKeyMainnet',
        pub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
        encryptedPrv: 'encryptedMainnetNodeKey',
        source: 'user' as const,
        coinSpecific: {
          [coin]: {
            purpose: 'nodeAuth',
          },
        },
      };

      const keychainsGetStub = sinon.stub();
      keychainsGetStub.withArgs({ id: userAuthKey.id }).resolves(userAuthKey);
      keychainsGetStub.withArgs({ id: nodeAuthKey.id }).resolves(nodeAuthKey);

      const keychainsStub = {
        get: keychainsGetStub,
      } as any;

      const baseCoinStub = {
        getFamily: sinon.stub().returns('lnbtc'),
        getChain: sinon.stub().returns(coin),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      const walletStub = {
        url: sinon.stub().returns(`/api/v2/${coin}/wallet/${walletId}`),
        coin: sinon.stub().returns(coin),
        subType: sinon.stub().returns('lightningSelfCustody'),
        baseCoin: baseCoinStub,
        coinSpecific: sinon.stub().returns({
          keys: [userAuthKey.id, nodeAuthKey.id],
        }),
        bitgo: {
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          encrypt: sinon.stub().callsFake(({ input }: { input: string }) => `encrypted_${input}`),
          put: putStub,
        },
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;

      const coinStub = {
        wallets: sinon.stub().returns(walletsStub),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);
      sinon.stub(BitGo.prototype, 'put').callsFake(putStub as any);

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost,
        signerTlsCert,
        signerMacaroon,
        passphrase,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', walletId);
    });
  });

  describe('Error Cases', function () {
    it('should return 500 when bitgo.put fails', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const putStub = sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().rejects(new Error('API error')),
        }),
      });

      const walletStub = {
        url: sinon.stub().returns(`/api/v2/${coin}/wallet/${walletId}`),
        coin: sinon.stub().returns(coin),
        subType: sinon.stub().returns('lightningSelfCustody'),
        bitgo: {
          decrypt: sinon.stub().returns('decryptedPrivateKey'),
          put: putStub,
        },
        keys: ['userAuthKeyId', 'backupKeyId', 'nodeAuthKeyId'],
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;

      const keychainsGetStub = sinon.stub().resolves({
        id: 'keyId',
        encryptedPrv: 'encryptedPrivateKey',
      });

      const keychainsStub = {
        get: keychainsGetStub,
      } as any;

      const coinStub = {
        wallets: sinon.stub().returns(walletsStub),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);
      sinon.stub(BitGo.prototype, 'put').callsFake(putStub as any);

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        signerTlsCert: 'cert',
        passphrase: 'password',
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
    });

    it('should return 400 when signerHost is missing', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        // signerHost missing
        signerTlsCert: 'cert',
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/signerHost/);
    });

    it('should return 400 when signerTlsCert is missing', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        // signerTlsCert missing
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/signerTlsCert/);
    });

    it('should return 400 when passphrase is missing', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        signerTlsCert: 'cert',
        // passphrase missing
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/passphrase/);
    });

    it('should return 400 when signerHost has invalid type', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 123, // should be string
        signerTlsCert: 'cert',
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/signerHost/);
    });

    it('should return 400 when signerTlsCert has invalid type', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        signerTlsCert: 123, // should be string
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/signerTlsCert/);
    });

    it('should return 400 when passphrase has invalid type', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        signerTlsCert: 'cert',
        passphrase: 123, // should be string
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/passphrase/);
    });

    it('should return 400 when signerMacaroon has invalid type', async function () {
      const coin = 'tlnbtc';
      const walletId = 'wallet123';

      const res = await agent.put(`/express/api/v2/${coin}/wallet/${walletId}`).send({
        signerHost: 'https://signer.example.com',
        signerTlsCert: 'cert',
        signerMacaroon: { invalid: 'object' }, // should be string
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/signerMacaroon/);
    });
  });

  describe('Route Definition', function () {
    it('should have correct route configuration', function () {
      assert.strictEqual(PutExpressWalletUpdate.method, 'PUT');
      assert.strictEqual(PutExpressWalletUpdate.path, '/express/api/v2/{coin}/wallet/{id}');
      assert.ok(PutExpressWalletUpdate.request);
      assert.ok(PutExpressWalletUpdate.response);
    });
  });
});
