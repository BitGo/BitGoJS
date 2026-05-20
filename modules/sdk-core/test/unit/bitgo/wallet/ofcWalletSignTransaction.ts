/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { Wallet, BaseCoin } from '../../../../src';
import { OfcToken } from '../../../../src/coins';

const TEST_TOKEN_CONFIG = {
  coin: 'ofcusdt',
  decimalPlaces: 6,
  name: 'OFCUSDT',
  type: 'ofcusdt',
  backingCoin: 'usdt',
  isFiat: false,
};

describe('Wallet - OFC', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let ofcToken: OfcToken;
  let signMessageStub: sinon.SinonStub;
  const signatureBytes = Buffer.from('aabbccdd', 'hex');
  const payload = '{"amount":"100","from":"alice","to":"bob"}';
  const prv = 'test-prv';
  // bg-<32 hex chars> is valid for OfcToken without needing to resolve the backing coin
  const recipients = [{ address: 'bg-aabbccddeeff00112233445566778899', amount: '100' }];
  const userPub =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC51xERxh8vDMjc3PiGpQ3VeQcHBiGxbsrRXbCKQZZxBtDMrmBRzxRMkBJGsC9bsYb5tggVF3jGfEE';

  const walletData = {
    id: 'test-wallet-id',
    coin: 'ofcusdt',
    keys: ['user-key', 'backup-key', 'bitgo-key'],
    type: 'trading',
    multisigType: 'onchain',
    enterprise: 'ent-id',
  };

  /**
   * Creates a fluent request mock that handles .query().send().result() and .send().result()
   * chains, resolving with the provided value.
   */
  function makeRequestChain(resolved: unknown): any {
    const chain: any = {};
    chain.query = sinon.stub().returns(chain);
    chain.send = sinon.stub().returns(chain);
    chain.result = sinon.stub().resolves(resolved);
    return chain;
  }

  beforeEach(function () {
    signMessageStub = sinon.stub(BaseCoin.prototype, 'signMessage');
    signMessageStub.withArgs({ prv }, payload).resolves(signatureBytes);
    sinon.stub(BaseCoin.prototype, 'keychains').returns({
      getKeysForSigning: sinon.stub().resolves([{ id: walletData.keys[0], pub: userPub }]),
    } as any);
    mockBitGo = {
      url: sinon.stub().returns('https://test.bitgo.com/'),
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };
    ofcToken = new OfcToken(mockBitGo, TEST_TOKEN_CONFIG);
    mockBitGo.coin = sinon.stub().returns(ofcToken);
    wallet = new Wallet(mockBitGo, ofcToken, walletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('with userKeySigningRequired: true (local signing via user key)', function () {
    const buildUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/build');
    const signUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/sign');
    const sendUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/send');

    describe('signTransaction', function () {
      it('should call baseCoin.signMessage with the prv and payload', async function () {
        const result = await wallet.signTransaction({ txPrebuild: { payload } as any, prv });

        signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
        mockBitGo.post.called.should.be.false();
        result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
      });

      describe('with walletPassphrase and keychain', function () {
        const walletPassphrase = 'test-passphrase';
        const encryptedPrv = 'encrypted-prv-blob';

        beforeEach(function () {
          // compiled wallet.js: getUserPrv (sync) → decryptKeychainPrivateKey → bitgo.decrypt
          // TypeScript source:  getUserPrvAsync        → decryptKeychainPrivateKeyAsync → bitgo.decryptAsync
          mockBitGo.decrypt = sinon.stub().returns(prv);
          mockBitGo.decryptAsync = sinon.stub().resolves(prv);
        });

        it('should decrypt the keychain with the passphrase and sign via baseCoin.signMessage', async function () {
          const result = await wallet.signTransaction({
            txPrebuild: { payload } as any,
            walletPassphrase,
            keychain: { pub: userPub, encryptedPrv } as any,
          });

          const decryptCalled =
            mockBitGo.decrypt.calledWith({ input: encryptedPrv, password: walletPassphrase }) ||
            mockBitGo.decryptAsync.calledWith({ input: encryptedPrv, password: walletPassphrase });
          decryptCalled.should.be.true();
          signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
          mockBitGo.post.called.should.be.false();
          result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
        });
      });
    });

    describe('prebuildAndSignTransaction', function () {
      beforeEach(function () {
        mockBitGo.post.withArgs(buildUrl()).returns(makeRequestChain({ payload }));
      });

      it('should call the prebuild API then sign locally with the prv', async function () {
        const result = await wallet.prebuildAndSignTransaction({ prv });

        mockBitGo.post.calledWith(buildUrl()).should.be.true();
        mockBitGo.post.calledWith(signUrl()).should.be.false();
        signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
        result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
      });
    });

    describe('sendMany', function () {
      beforeEach(function () {
        mockBitGo.post.withArgs(buildUrl()).returns(makeRequestChain({ payload }));
        mockBitGo.post.withArgs(sendUrl()).returns(makeRequestChain({ txid: 'test-txid', status: 'signed' }));
      });

      it('should prebuild, sign locally, and submit to the send endpoint', async function () {
        const result = await wallet.sendMany({ recipients, prv });

        mockBitGo.post.calledWith(buildUrl()).should.be.true();
        signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
        mockBitGo.post.calledWith(sendUrl()).should.be.true();
        result.should.deepEqual({ txid: 'test-txid', status: 'signed' });
      });
    });
  });

  describe('with userKeySigningRequired: false (remote signing via BitGo key)', function () {
    const signUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/sign');
    const buildUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/build');
    const sendUrl = () => ofcToken.url('/wallet/' + walletData.id + '/tx/send');
    const hexSignature = 'deadbeef';
    let remoteWallet: Wallet;

    beforeEach(function () {
      remoteWallet = new Wallet(mockBitGo, ofcToken, { ...walletData, userKeySigningRequired: false });
      // compiled wallet.js calls getUserPrv (sync) for all coins; stub to return undefined
      // so the remote signing path reaches baseCoin.signTransaction with prv: undefined
      (remoteWallet as any).getUserPrv = sinon.stub().returns(undefined);
      mockBitGo.post.withArgs(signUrl()).returns(makeRequestChain({ signature: hexSignature }));
    });

    it('should sign locally when userKeySigningRequired is true and prv is provided', async function () {
      const strictWallet = new Wallet(mockBitGo, ofcToken, { ...walletData, userKeySigningRequired: true });
      const result = await strictWallet.signTransaction({ txPrebuild: { payload } as any, prv });

      signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
      mockBitGo.post.calledWith(signUrl()).should.be.false();
      result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
    });

    describe('signTransaction', function () {
      it('should POST to the sign endpoint and return the halfSigned result', async function () {
        const result = await remoteWallet.signTransaction({ txPrebuild: { payload } as any });

        mockBitGo.post.calledWith(signUrl()).should.be.true();
        signMessageStub.called.should.be.false();
        result.should.deepEqual({ halfSigned: { payload, signature: hexSignature } });
      });
    });

    describe('prebuildAndSignTransaction', function () {
      beforeEach(function () {
        mockBitGo.post.withArgs(buildUrl()).returns(makeRequestChain({ payload }));
      });

      it('should prebuild and remotely sign the transaction', async function () {
        const result = await remoteWallet.prebuildAndSignTransaction({});

        mockBitGo.post.calledWith(buildUrl()).should.be.true();
        mockBitGo.post.calledWith(signUrl()).should.be.true();
        signMessageStub.called.should.be.false();
        result.should.deepEqual({ halfSigned: { payload, signature: hexSignature } });
      });
    });

    describe('sendMany', function () {
      beforeEach(function () {
        mockBitGo.post.withArgs(buildUrl()).returns(makeRequestChain({ payload }));
        mockBitGo.post.withArgs(sendUrl()).returns(makeRequestChain({ txid: 'test-txid', status: 'signed' }));
      });

      it('should prebuild, remotely sign, and send the transaction', async function () {
        const result = await remoteWallet.sendMany({ recipients });

        mockBitGo.post.calledWith(buildUrl()).should.be.true();
        mockBitGo.post.calledWith(signUrl()).should.be.true();
        signMessageStub.called.should.be.false();
        result.should.deepEqual({ txid: 'test-txid', status: 'signed' });
      });
    });
  });
});
