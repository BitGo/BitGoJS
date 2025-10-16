import * as assert from 'assert';
import * as t from 'io-ts';
import * as sinon from 'sinon';
import { agent as supertest } from 'supertest';
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { BitGo } from 'bitgo';
import {
  ShareWalletParams,
  ShareWalletBody,
  ShareWalletResponse,
  PostShareWallet,
} from '../../../src/typedRoutes/api/v2/shareWallet';
import { assertDecode } from './common';
import { app } from '../../../src/expressApp';
import { DefaultConfig } from '../../../src/config';

describe('ShareWallet API Tests', function () {
  let agent: ReturnType<typeof supertest>;

  before(function () {
    const testApp = app(DefaultConfig);
    agent = supertest(testApp);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Success Cases', function () {
    it('should successfully share wallet with view permissions (no keychain)', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const email = 'viewer@example.com';
      const permissions = 'view';
      const message = 'Sharing for review';

      const shareResponse = {
        id: 'share123',
        coin,
        wallet: walletId,
        fromUser: 'fromUser456',
        toUser: 'toUserId123',
        permissions,
        message,
        state: 'active',
      };

      // Stub wallet.shareWallet to return the expected response
      const shareWalletStub = sinon.stub().resolves(shareResponse);
      const walletStub = {
        shareWallet: shareWalletStub,
      } as any;

      // Stub the wallet retrieval chain
      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;
      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        permissions,
        message,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', 'share123');
      res.body.should.have.property('wallet', walletId);
      res.body.should.have.property('permissions', permissions);
      res.body.should.have.property('message', message);
    });

    it('should successfully share wallet with optional skipKeychain flag', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const email = 'spender@example.com';
      const permissions = 'view,spend';

      const shareResponse = {
        id: 'share456',
        coin,
        wallet: walletId,
        fromUser: 'fromUser456',
        toUser: 'toUserId789',
        permissions,
        state: 'active',
      };

      const shareWalletStub = sinon.stub().resolves(shareResponse);
      const walletStub = { shareWallet: shareWalletStub } as any;
      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;
      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        permissions,
        skipKeychain: true,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', 'share456');
    });

    it('should successfully share wallet with optional disableEmail flag', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const email = 'disableemail@example.com';
      const permissions = 'view';

      const shareResponse = {
        id: 'share555',
        coin,
        wallet: walletId,
        fromUser: 'fromUser456',
        toUser: 'toUserId555',
        permissions,
        state: 'active',
      };

      const shareWalletStub = sinon.stub().resolves(shareResponse);
      const walletStub = { shareWallet: shareWalletStub } as any;
      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;
      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        permissions,
        disableEmail: true,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', 'share555');
    });
  });

  describe('Error Cases', function () {
    it('should return 500 when wallet not found', async function () {
      const coin = 'tbtc';
      const walletId = 'nonexistent_wallet_id';
      const email = 'user@example.com';
      const permissions = 'view';

      // Stub coin.wallets().get() to reject with error
      const getWalletStub = sinon.stub().rejects(new Error('wallet not found'));
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;
      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        permissions,
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
    });

    it('should return 500 when shareWallet fails', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const email = 'invalid@example.com';
      const permissions = 'view';

      // Stub wallet.shareWallet to reject with error
      const shareWalletStub = sinon.stub().rejects(new Error('invalid email address'));
      const walletStub = { shareWallet: shareWalletStub } as any;
      const getWalletStub = sinon.stub().resolves(walletStub);
      const walletsStub = { get: getWalletStub } as any;
      const coinStub = { wallets: sinon.stub().returns(walletsStub) } as any;
      sinon.stub(BitGo.prototype, 'coin').returns(coinStub);

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        permissions,
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
    });

    it('should return 400 when email is missing', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const permissions = 'view';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        permissions,
        // email is missing
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/email/);
    });

    it('should return 400 when permissions is missing', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';
      const email = 'test@example.com';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email,
        // permissions is missing
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/permissions/);
    });

    it('should return 400 when request body has invalid types', async function () {
      const coin = 'tbtc';
      const walletId = '59cd72485007a239fb00282ed480da1f';

      const res = await agent.post(`/api/v2/${coin}/wallet/${walletId}/share`).send({
        email: 123, // should be string
        permissions: 'view',
      });

      res.status.should.equal(400);
      res.body.should.be.an.Array();
      res.body[0].should.match(/email.*string/);
    });
  });

  describe('Codec Validation', function () {
    it('should validate ShareWalletParams with required coin and id', function () {
      const validParams = {
        coin: 'tbtc',
        id: '59cd72485007a239fb00282ed480da1f',
      };

      const decodedParams = assertDecode(t.exact(t.type(ShareWalletParams)), validParams);
      assert.ok(decodedParams);
      assert.strictEqual(decodedParams.coin, 'tbtc');
      assert.strictEqual(decodedParams.id, '59cd72485007a239fb00282ed480da1f');
    });

    it('should validate ShareWalletBody with required fields', function () {
      const validBody = {
        email: 'test@example.com',
        permissions: 'view,spend',
      };

      const decodedBody = assertDecode(t.exact(t.type(ShareWalletBody)), validBody);
      assert.ok(decodedBody);
      assert.strictEqual(decodedBody.email, 'test@example.com');
      assert.strictEqual(decodedBody.permissions, 'view,spend');
    });

    it('should validate ShareWalletBody with optional fields', function () {
      const validBody = {
        email: 'test@example.com',
        permissions: 'view',
        walletPassphrase: 'myPassphrase',
        message: 'Test message',
        reshare: false,
        skipKeychain: true,
        disableEmail: false,
      };

      const decodedBody = assertDecode(t.exact(t.type(ShareWalletBody)), validBody);
      assert.ok(decodedBody);
      assert.strictEqual(decodedBody.walletPassphrase, 'myPassphrase');
      assert.strictEqual(decodedBody.message, 'Test message');
      assert.strictEqual(decodedBody.reshare, false);
      assert.strictEqual(decodedBody.skipKeychain, true);
      assert.strictEqual(decodedBody.disableEmail, false);
    });

    it('should validate successful response (200)', function () {
      const validResponse = {
        id: 'share123',
        coin: 'tbtc',
        wallet: '59cd72485007a239fb00282ed480da1f',
        fromUser: 'user1',
        toUser: 'user2',
        permissions: 'view,spend',
      };

      const decodedResponse = assertDecode(ShareWalletResponse[200], validResponse);
      assert.ok(decodedResponse);
      assert.strictEqual(decodedResponse.id, 'share123');
      assert.strictEqual(decodedResponse.wallet, '59cd72485007a239fb00282ed480da1f');
    });

    it('should validate response with optional keychain field', function () {
      const validResponse = {
        id: 'share123',
        coin: 'tbtc',
        wallet: '59cd72485007a239fb00282ed480da1f',
        fromUser: 'user1',
        toUser: 'user2',
        permissions: 'view,spend',
        keychain: {
          pub: 'xpub123',
          encryptedPrv: 'encrypted',
          fromPubKey: 'from',
          toPubKey: 'to',
          path: 'm',
        },
      };

      const decodedResponse = assertDecode(ShareWalletResponse[200], validResponse);
      assert.ok(decodedResponse);
      assert.ok(decodedResponse.keychain);
    });
  });

  describe('Route Definition', function () {
    it('should have correct route configuration', function () {
      assert.strictEqual(PostShareWallet.method, 'POST');
      assert.strictEqual(PostShareWallet.path, '/api/v2/{coin}/wallet/{id}/share');
      assert.ok(PostShareWallet.request);
      assert.ok(PostShareWallet.response);
    });

    it('should have correct response types', function () {
      assert.ok(PostShareWallet.response[200]);
      assert.ok(PostShareWallet.response[400]);
    });
  });
});
