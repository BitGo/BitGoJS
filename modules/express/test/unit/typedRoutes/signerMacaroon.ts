import * as assert from 'assert';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { agent as supertest } from 'supertest';
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { BitGo } from 'bitgo';
import { PostSignerMacaroon } from '../../../src/typedRoutes/api/v2/signerMacaroon';
import { LndSignerClient } from '../../../src/lightning/lndSignerClient';

describe('Signer Macaroon Typed Routes Tests', function () {
  let agent: ReturnType<typeof supertest>;
  const tempFilePath = '/tmp/test-lightning-signer.json';

  before(function () {
    // Create a temporary JSON file for lightning signer config
    fs.writeFileSync(tempFilePath, JSON.stringify({}));

    const { app } = require('../../../src/expressApp');
    // Configure app with lightning signer enabled
    const config = {
      ...require('../../../src/config').DefaultConfig,
      lightningSignerFileSystemPath: tempFilePath,
    };
    const testApp = app(config);
    agent = supertest(testApp);
  });

  after(function () {
    // Clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Success Cases', function () {
    it('should successfully create signer macaroon without IP caveat', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';
      const passphrase = 'MyWalletPassphrase123';

      const walletResponse = {
        id: walletId,
        coin,
        coinSpecific: {
          [coin]: {
            encryptedSignerMacaroon: 'encrypted_new_signer_macaroon',
            encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
            signerHost: 'https://signer.example.com',
            signerTlsCert: 'base64cert==',
            watchOnlyExternalIp: '192.168.1.100',
            keys: ['userAuthKeyId', 'nodeAuthKeyId'],
          },
        },
      };

      // Stub LndSignerClient.create
      // Use a valid base64 macaroon converted to hex for the mock
      const validMacaroonBase64 =
        'AgEDbG5kAvgBAwoQMgU7rDi802Yqg/tHll24nhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgZKiUvEzxGd2QKGUS+9R5ZWevG09S06fMJUnt+k1XXXQ=';
      const validMacaroonHex = Buffer.from(validMacaroonBase64, 'base64').toString('hex');

      const mockLndClient = {
        bakeMacaroon: sinon.stub().resolves({ macaroon: validMacaroonHex }),
      } as any;
      sinon.stub(LndSignerClient, 'create').resolves(mockLndClient);

      // Mock keychains for updateWalletCoinSpecific
      const userAuthKey = {
        id: 'userAuthKeyId',
        pub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        encryptedPrv: 'encrypted_user_auth_prv',
        source: 'user' as const,
        coinSpecific: {
          [coin]: { purpose: 'userAuth' as const },
        },
      };

      const nodeAuthKey = {
        id: 'nodeAuthKeyId',
        pub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
        encryptedPrv: 'encrypted_node_auth_prv',
        source: 'user' as const,
        coinSpecific: {
          [coin]: { purpose: 'nodeAuth' as const },
        },
      };

      const keychainsGetStub = sinon.stub();
      keychainsGetStub.withArgs({ id: 'userAuthKeyId' }).resolves(userAuthKey);
      keychainsGetStub.withArgs({ id: 'nodeAuthKeyId' }).resolves(nodeAuthKey);
      const keychainsStub = { get: keychainsGetStub } as any;

      // Stub the BitGo.put call that updateWalletCoinSpecific makes
      const putStub = sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(walletResponse),
        }),
      });

      // Stub wallet methods
      const walletStub = {
        subType: sinon.stub().returns('lightningSelfCustody'),
        coin: sinon.stub().returns(coin),
        coinSpecific: sinon.stub().returns({
          encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
          watchOnlyExternalIp: '192.168.1.100',
          keys: ['userAuthKeyId', 'nodeAuthKeyId'],
        }),
        url: sinon.stub().returns(`/api/v2/${coin}/wallet/${walletId}`),
        bitgo: {
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          encrypt: sinon.stub().callsFake(({ input }: { input: string }) => `encrypted_${input}`),
          put: putStub,
        },
        baseCoin: {
          getFamily: sinon.stub().returns('lnbtc'),
          getChain: sinon.stub().returns(coin),
          keychains: sinon.stub().returns(keychainsStub),
        },
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = {
        wallets: sinon.stub().returns(walletsStub),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);
      sinon.stub(BitGo.prototype, 'decrypt').callsFake(walletStub.bitgo.decrypt);
      sinon.stub(BitGo.prototype, 'put').callsFake(putStub as any);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', walletId);
      res.body.should.have.property('coin', coin);
      res.body.should.have.property('coinSpecific');
      res.body.coinSpecific.should.have.property(coin);
      res.body.coinSpecific[coin].should.have.property('encryptedSignerMacaroon');

      getWalletStub.should.have.been.calledOnceWith({ id: walletId, includeBalance: false });
    });

    it('should successfully create signer macaroon with IP caveat', async function () {
      const coin = 'lnbtc';
      const walletId = 'lightningWallet456';
      const passphrase = 'MyWalletPassphrase456';

      const walletResponse = {
        id: walletId,
        coin,
        coinSpecific: {
          [coin]: {
            encryptedSignerMacaroon: 'encrypted_new_signer_macaroon_with_ip',
            encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
            signerHost: 'https://signer.example.com',
            signerTlsCert: 'base64cert==',
            watchOnlyExternalIp: '10.0.0.5',
            keys: ['userAuthKeyId', 'nodeAuthKeyId'],
          },
        },
      };

      // Stub LndSignerClient.create
      // Use a valid base64 macaroon converted to hex for the mock
      const validMacaroonBase64 =
        'AgEDbG5kAvgBAwoQMgU7rDi802Yqg/tHll24nhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgZKiUvEzxGd2QKGUS+9R5ZWevG09S06fMJUnt+k1XXXQ=';
      const validMacaroonHex = Buffer.from(validMacaroonBase64, 'base64').toString('hex');

      const mockLndClient = {
        bakeMacaroon: sinon.stub().resolves({ macaroon: validMacaroonHex }),
      } as any;
      sinon.stub(LndSignerClient, 'create').resolves(mockLndClient);

      // Mock keychains for updateWalletCoinSpecific
      const userAuthKey = {
        id: 'userAuthKeyId',
        pub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        encryptedPrv: 'encrypted_user_auth_prv',
        source: 'user' as const,
        coinSpecific: {
          [coin]: { purpose: 'userAuth' as const },
        },
      };

      const nodeAuthKey = {
        id: 'nodeAuthKeyId',
        pub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
        encryptedPrv: 'encrypted_node_auth_prv',
        source: 'user' as const,
        coinSpecific: {
          [coin]: { purpose: 'nodeAuth' as const },
        },
      };

      const keychainsGetStub = sinon.stub();
      keychainsGetStub.withArgs({ id: 'userAuthKeyId' }).resolves(userAuthKey);
      keychainsGetStub.withArgs({ id: 'nodeAuthKeyId' }).resolves(nodeAuthKey);
      const keychainsStub = { get: keychainsGetStub } as any;

      // Stub the BitGo.put call that updateWalletCoinSpecific makes
      const putStub = sinon.stub().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(walletResponse),
        }),
      });

      // Stub wallet methods
      const walletStub = {
        subType: sinon.stub().returns('lightningSelfCustody'),
        coin: sinon.stub().returns(coin),
        coinSpecific: sinon.stub().returns({
          encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
          watchOnlyExternalIp: '10.0.0.5',
          keys: ['userAuthKeyId', 'nodeAuthKeyId'],
        }),
        url: sinon.stub().returns(`/api/v2/${coin}/wallet/${walletId}`),
        bitgo: {
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          encrypt: sinon.stub().callsFake(({ input }: { input: string }) => `encrypted_${input}`),
          put: putStub,
        },
        baseCoin: {
          getFamily: sinon.stub().returns('lnbtc'),
          getChain: sinon.stub().returns(coin),
          keychains: sinon.stub().returns(keychainsStub),
        },
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = {
        wallets: sinon.stub().returns(walletsStub),
        keychains: sinon.stub().returns(keychainsStub),
      } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);
      sinon.stub(BitGo.prototype, 'decrypt').callsFake(walletStub.bitgo.decrypt);
      sinon.stub(BitGo.prototype, 'put').callsFake(putStub as any);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
        addIpCaveatToMacaroon: true,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', walletId);
      res.body.should.have.property('coin', coin);
      res.body.should.have.property('coinSpecific');
      res.body.coinSpecific.should.have.property(coin);
      res.body.coinSpecific[coin].should.have.property('encryptedSignerMacaroon');

      getWalletStub.should.have.been.calledOnceWith({ id: walletId, includeBalance: false });
    });
  });

  describe('Codec Validation', function () {
    it('should return 400 when passphrase is missing', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        addIpCaveatToMacaroon: true,
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/passphrase/);
    });

    it('should return 400 when passphrase is not a string', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase: 12345,
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/passphrase/);
    });

    it('should return 400 when addIpCaveatToMacaroon is not a boolean', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase: 'MyPassphrase',
        addIpCaveatToMacaroon: 'true',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/addIpCaveatToMacaroon/);
    });
  });

  describe('Handler Validation', function () {
    it('should return 400 when coin is not a lightning coin', async function () {
      const coin = 'tbtc'; // Not a lightning coin
      const walletId = 'wallet123';
      const passphrase = 'MyPassphrase';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/Invalid coin to create signer macaroon/);
    });

    it('should return 400 when wallet is not self-custody lightning', async function () {
      const coin = 'tlnbtc';
      const walletId = 'custodialWallet123';
      const passphrase = 'MyPassphrase';

      // Stub wallet that is NOT self-custody
      const walletStub = {
        subType: sinon.stub().returns('lightningCustody'),
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/not a self custodial lighting wallet/);
    });

    it('should return 400 when encrypted admin macaroon is missing', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';
      const passphrase = 'MyPassphrase';

      // Stub LndSignerClient.create
      const mockLndClient = {} as any;
      sinon.stub(LndSignerClient, 'create').resolves(mockLndClient);

      // Stub wallet without encryptedSignerAdminMacaroon
      const walletStub = {
        subType: sinon.stub().returns('lightningSelfCustody'),
        coinSpecific: sinon.stub().returns({
          // Missing encryptedSignerAdminMacaroon
          watchOnlyExternalIp: '192.168.1.100',
        }),
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/Missing encryptedSignerAdminMacaroon/);
    });

    it('should return 400 when IP caveat is requested but external IP is not set', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';
      const passphrase = 'MyPassphrase';

      // Stub wallet without watchOnlyExternalIp
      const walletStub = {
        subType: sinon.stub().returns('lightningSelfCustody'),
        coinSpecific: sinon.stub().returns({
          encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
          // Missing watchOnlyExternalIp
        }),
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
        addIpCaveatToMacaroon: true,
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/Cannot create signer macaroon because the external IP is not set/);
    });

    it('should return 500 when external IP is invalid', async function () {
      const coin = 'tlnbtc';
      const walletId = 'lightningWallet123';
      const passphrase = 'MyPassphrase';

      // Stub wallet with invalid IP
      const walletStub = {
        subType: sinon.stub().returns('lightningSelfCustody'),
        coinSpecific: sinon.stub().returns({
          encryptedSignerAdminMacaroon: 'encrypted_admin_macaroon',
          watchOnlyExternalIp: 'not-an-ip-address',
        }),
      } as any;

      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;

      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/signermacaroon`).send({
        passphrase,
        addIpCaveatToMacaroon: true,
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
      res.body.error.should.match(/Invalid IP address/);
    });
  });

  describe('Route Definition', function () {
    it('should have correct route metadata', function () {
      assert.strictEqual(PostSignerMacaroon.method, 'POST');
      assert.strictEqual(PostSignerMacaroon.path, '/api/v2/{coin}/wallet/{walletId}/signermacaroon');
    });
  });
});
