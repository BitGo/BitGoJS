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

  const enterpriseId = 'test-enterprise-id';
  const walletPassphrase = 'test-passphrase';
  const encryptedPrv = 'encrypted-prv';
  const decryptedPrv = 'decrypted-prv';
  const signature = 'aabbccdd';

  beforeEach(function () {
    const postStub = sinon.stub();
    postStub.returns({
      send: sinon.stub().returns({
        result: sinon.stub().resolves({ signature }),
      }),
    });

    mockBitGo = {
      post: postStub,
      decrypt: sinon.stub().returns(decryptedPrv),
    };

    mockBaseCoin = {
      keychains: sinon.stub().returns({
        get: sinon.stub().resolves({ encryptedPrv }),
      }),
      signMessage: sinon.stub().resolves(Buffer.from(signature, 'hex')),
    };

    mockWallet = {
      id: sinon.stub().returns('test-wallet-id'),
      keyIds: sinon.stub().returns(['user-key-id', 'backup-key-id', 'bitgo-key-id']),
      url: sinon.stub().returns('https://example.com/wallet/test-wallet-id/tx/sign'),
      toJSON: sinon.stub().returns({
        id: 'test-wallet-id',
        keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
        userKeySigningRequired: undefined,
      }),
      baseCoin: mockBaseCoin,
      bitgo: mockBitGo,
    };

    tradingAccount = new TradingAccount(enterpriseId, mockWallet, mockBitGo);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('signPayload', function () {
    const payload = { data: 'test-payload' };
    const payloadString = 'test-payload-string';

    describe('without walletPassphrase (BitGo remote signing)', function () {
      it('should sign using the BitGo key remotely when no passphrase is provided', async function () {
        const result = await tradingAccount.signPayload({ payload });

        mockWallet.toJSON.calledOnce.should.be.true();
        mockWallet.url.calledWith('/tx/sign').should.be.true();
        mockBitGo.post.calledOnce.should.be.true();
        result.should.equal(signature);
      });

      it('should sign a string payload remotely when no passphrase is provided', async function () {
        const result = await tradingAccount.signPayload({ payload: payloadString });

        result.should.equal(signature);
      });

      it('should throw if userKeySigningRequired is set and no passphrase is provided', async function () {
        mockWallet.toJSON.returns({
          id: 'test-wallet-id',
          keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
          userKeySigningRequired: 'true',
        });

        await tradingAccount
          .signPayload({ payload })
          .should.be.rejectedWith(
            'Wallet must use user key to sign ofc transaction, please provide the wallet passphrase'
          );
      });

      it('should throw if wallet has fewer than 2 keys and no passphrase is provided', async function () {
        mockWallet.toJSON.returns({
          id: 'test-wallet-id',
          keys: ['user-key-id'],
          userKeySigningRequired: undefined,
        });

        await tradingAccount.signPayload({ payload }).should.be.rejectedWith('Wallet does not support BitGo signing');
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
  });
});
