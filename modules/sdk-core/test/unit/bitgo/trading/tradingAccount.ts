/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { TradingAccount } from '../../../../src/bitgo/trading/tradingAccount';

describe('TradingAccount', function () {
  let tradingAccount: TradingAccount;
  let mockBitGo: any;
  let mockWallet: any;
  let mockBaseCoin: any;
  let sendStub: sinon.SinonStub;

  const enterpriseId = 'test-enterprise-id';
  const walletPassphrase = 'test-passphrase';
  const encryptedPrv = 'encrypted-prv';
  const decryptedPrv = 'decrypted-prv';
  const signature = 'aabbccdd';
  const payload = { data: 'test-payload' };
  const payloadString = JSON.stringify(payload);

  beforeEach(function () {
    sendStub = sinon.stub();
    sendStub.withArgs({ payload: payloadString }).returns({ result: sinon.stub().resolves({ signature }) });

    mockBitGo = {
      post: sinon.stub().returns({ send: sendStub }),
      decrypt: sinon
        .stub()
        .callsFake(({ input, password }) =>
          input === encryptedPrv && password === walletPassphrase ? decryptedPrv : undefined
        ),
    };

    mockBaseCoin = {
      keychains: sinon.stub().returns({
        get: sinon.stub().resolves({ encryptedPrv }),
      }),
      signMessage: sinon.stub().callsFake(async (key: { prv: string }) => {
        if (key.prv === decryptedPrv) {
          return Buffer.from(signature, 'hex');
        }
        throw new Error(`signMessage called with unexpected prv: ${key.prv}`);
      }),
    };

    mockWallet = {
      id: sinon.stub().returns('test-wallet-id'),
      keyIds: sinon.stub().returns(['user-key-id', 'bitgo-key-id']),
      url: sinon.stub().returns('https://example.com/wallet/test-wallet-id/tx/sign'),
      toJSON: sinon.stub().returns({
        id: 'test-wallet-id',
        keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
        coinSpecific: {},
      }),
      baseCoin: mockBaseCoin,
      bitgo: mockBitGo,
    };

    tradingAccount = new TradingAccount(enterpriseId, mockWallet, mockBitGo);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('id', function () {
    it('should return the wallet id', function () {
      tradingAccount.id.should.equal('test-wallet-id');
      mockWallet.id.calledOnce.should.be.true();
    });
  });

  describe('signPayload', function () {
    describe('without walletPassphrase or prv (BitGo remote signing)', function () {
      it('should sign using the BitGo key remotely when no passphrase is provided', async function () {
        const result = await tradingAccount.signPayload({ payload });

        mockWallet.toJSON.calledOnce.should.be.true();
        mockWallet.url.calledWith('/tx/sign').should.be.true();
        mockBitGo.post.calledOnce.should.be.true();
        sendStub.calledWith({ payload: JSON.stringify(payload) }).should.be.true();
        result.should.equal(signature);
      });

      it('should sign a string payload remotely when no passphrase is provided', async function () {
        const result = await tradingAccount.signPayload({ payload: payloadString });
        sendStub.calledWith({ payload: payloadString }).should.be.true();
        result.should.equal(signature);
      });

      it('should throw if coinSpecific.userKeySigningRequired is true and no passphrase and prv are provided', async function () {
        mockWallet.toJSON.onCall(mockWallet.toJSON.callCount).returns({
          id: 'test-wallet-id',
          keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
          coinSpecific: { userKeySigningRequired: true },
        });

        await tradingAccount
          .signPayload({ payload })
          .should.be.rejectedWith(
            'Wallet must use user key to sign ofc transaction, please provide the wallet passphrase or visit your wallet settings page to configure one.'
          );
      });

      it('should fall back to top-level userKeySigningRequired when coinSpecific does not carry it', async function () {
        mockWallet.toJSON.onCall(mockWallet.toJSON.callCount).returns({
          id: 'test-wallet-id',
          keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
          coinSpecific: {},
          userKeySigningRequired: true,
        });

        await tradingAccount
          .signPayload({ payload })
          .should.be.rejectedWith(
            'Wallet must use user key to sign ofc transaction, please provide the wallet passphrase or visit your wallet settings page to configure one.'
          );
      });

      it('should prefer coinSpecific.userKeySigningRequired over top-level when both are present', async function () {
        mockWallet.toJSON.onCall(mockWallet.toJSON.callCount).returns({
          id: 'test-wallet-id',
          keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
          coinSpecific: { userKeySigningRequired: false },
          userKeySigningRequired: true,
        });

        const result = await tradingAccount.signPayload({ payload });
        result.should.equal(signature);
      });

      it('should throw if wallet has fewer than 2 keys and no passphrase and prv are provided', async function () {
        mockWallet.toJSON.onCall(mockWallet.toJSON.callCount).returns({
          id: 'test-wallet-id',
          keys: ['user-key-id'],
          coinSpecific: {},
        });

        await tradingAccount
          .signPayload({ payload })
          .should.be.rejectedWith(
            'Wallet does not support BitGo signing. Please reach out to support@bitgo.com to resolve this issue.'
          );
      });
    });

    describe('with walletPassphrase (local user key signing)', function () {
      it('should decrypt the user key and sign the payload locally', async function () {
        const result = await tradingAccount.signPayload({ payload, walletPassphrase });

        mockBaseCoin.keychains().get.calledWith({ id: 'user-key-id' }).should.be.true();
        mockBitGo.decrypt.calledWith({ input: encryptedPrv, password: walletPassphrase }).should.be.true();
        mockBaseCoin.signMessage.calledOnce.should.be.true();
        result.should.equal(Buffer.from(signature, 'hex').toString('hex'));
      });

      it('should stringify a Record payload before signing locally', async function () {
        await tradingAccount.signPayload({ payload, walletPassphrase });

        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[1].should.equal(JSON.stringify(payload));
      });

      it('should pass a string payload directly to signMessage', async function () {
        await tradingAccount.signPayload({ payload: payloadString, walletPassphrase });

        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[1].should.equal(payloadString);
      });
    });

    describe('with both walletPassphrase and prv', function () {
      it('should use prv directly and not call decrypt when both are provided', async function () {
        await tradingAccount.signPayload({ payload, walletPassphrase, prv: decryptedPrv });

        mockBitGo.decrypt.called.should.be.false();
        mockBaseCoin.keychains.called.should.be.false();
        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[0].should.deepEqual({ prv: decryptedPrv });
      });
    });

    describe('with prv (local user key signing without decryption)', function () {
      it('should sign using the provided prv without calling decrypt', async function () {
        const result = await tradingAccount.signPayload({ payload, prv: decryptedPrv });

        mockBitGo.decrypt.called.should.be.false();
        mockBaseCoin.keychains.called.should.be.false();
        mockBaseCoin.signMessage.calledOnce.should.be.true();
        result.should.equal(Buffer.from(signature, 'hex').toString('hex'));
      });

      it('should not use BitGo remote signing when prv is provided', async function () {
        await tradingAccount.signPayload({ payload, prv: decryptedPrv });

        mockBitGo.post.called.should.be.false();
      });

      it('should pass the prv directly to signMessage', async function () {
        await tradingAccount.signPayload({ payload, prv: decryptedPrv });

        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[0].should.deepEqual({ prv: decryptedPrv });
      });

      it('should stringify a Record payload before signing with prv', async function () {
        await tradingAccount.signPayload({ payload, prv: decryptedPrv });

        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[1].should.equal(JSON.stringify(payload));
      });

      it('should pass a string payload directly to signMessage when signing with prv', async function () {
        await tradingAccount.signPayload({ payload: payloadString, prv: decryptedPrv });

        const signMessageCall = mockBaseCoin.signMessage.getCall(0);
        signMessageCall.args[1].should.equal(payloadString);
      });
    });
  });
});
