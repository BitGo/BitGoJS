/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { Ofc, OfcToken, SignTransactionOptions } from '../../../src/coins';
import { BaseCoin, Wallet } from '../../../src';

const TEST_TOKEN_CONFIG = {
  coin: 'ofcusdt',
  decimalPlaces: 6,
  name: 'OFCUSDT',
  type: 'ofcusdt',
  backingCoin: 'usdt',
  isFiat: false,
};

describe('Ofc / OfcToken', function () {
  let mockBitGo: any;
  let signMessageStub: sinon.SinonStub;
  const hexSignature = 'deadbeef';
  const signatureBytes = Buffer.from('aabbccdd', 'hex');
  const walletData = {
    id: 'wallet-id',
    keys: ['userKey', 'bitgoKey'],
    type: 'trading',
    multisigType: 'onchain',
    enterprise: 'ent-id',
    userKeySigningRequired: false,
  };

  beforeEach(function () {
    signMessageStub = sinon.stub(BaseCoin.prototype, 'signMessage').resolves(signatureBytes);
    mockBitGo = {
      url: sinon.stub().returns('https://test.bitgo.com/'),
      post: sinon.stub(),
    };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('signMessage', function () {
    let ofc: Ofc;

    beforeEach(function () {
      mockBitGo.post.returnsThis();
      mockBitGo.send = sinon.stub().returnsThis();
      mockBitGo.result = sinon.stub().resolves({ signature: hexSignature });
      ofc = new Ofc(mockBitGo);
      mockBitGo.coin = sinon.stub().returns(ofc);
    });

    describe('with a Wallet instance', function () {
      it('should delegate to wallet.toTradingAccount().signPayload() and return a Buffer', async function () {
        const wallet = new Wallet(mockBitGo, ofc, walletData);

        const message = 'test message';
        const result = await ofc.signMessage(wallet, message);

        mockBitGo.send.calledOnceWith({ payload: message }).should.be.true();
        mockBitGo.result.calledOnce.should.be.true();
        result.should.deepEqual(Buffer.from(hexSignature, 'hex'));
      });
    });

    describe('with a prv key', function () {
      it('should delegate to the base class signMessage with the exact key and message', async function () {
        const key = {
          prv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqhuCo36EkzGH6qiT9mJHBvuPKtLRYD4NxFb5hgXMQBB2LLT6mxLDHHo',
        };
        const message = 'test message';
        const result = await ofc.signMessage(key, message);

        signMessageStub.calledOnceWith(key, message).should.be.true();
        result.should.equal(signatureBytes);
      });
    });
  });

  describe('signTransaction (OfcToken)', function () {
    let ofcToken: OfcToken;
    const payload = '{"amount":"100","from":"alice","to":"bob"}';

    beforeEach(function () {
      ofcToken = new OfcToken(mockBitGo, TEST_TOKEN_CONFIG);
      mockBitGo.coin = sinon.stub().returns(ofcToken);
    });

    describe('with wallet and no prv (BitGo remote signing)', function () {
      it('should POST to the wallet sign endpoint with the payload and return the halfSigned result', async function () {
        const sendStub = sinon.stub();
        const resultStub = sinon.stub().resolves({ signature: hexSignature });
        sendStub.returns({ result: resultStub });
        mockBitGo.post.returns({ send: sendStub });

        const wallet = new Wallet(mockBitGo, ofcToken, walletData);
        const expectedUrl = ofcToken.url('/wallet/' + walletData.id + '/tx/sign');
        const result = await ofcToken.signTransaction({ txPrebuild: { payload }, wallet });

        mockBitGo.post.calledOnceWith(expectedUrl).should.be.true();
        sendStub.calledOnceWith({ payload }).should.be.true();
        result.should.deepEqual({ halfSigned: { payload, signature: hexSignature } });
      });
    });

    describe('with wallet and prv (local signing routed through wallet)', function () {
      it('should pass prv directly to signPayload and sign via baseCoin.signMessage', async function () {
        const prv = 'test-prv';
        const wallet = new Wallet(mockBitGo, ofcToken, walletData);
        const result = await ofcToken.signTransaction({ txPrebuild: { payload }, wallet, prv });

        signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
        mockBitGo.post.called.should.be.false();
        result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
      });
    });

    describe('with prv only (local signing without wallet)', function () {
      it('should pass the prv to baseCoin.signMessage and return the correct halfSigned result', async function () {
        const prv = 'test-prv';

        const result = await ofcToken.signTransaction({ txPrebuild: { payload }, prv });

        signMessageStub.calledOnceWith({ prv }, payload).should.be.true();
        mockBitGo.post.called.should.be.false();
        result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
      });
    });

    describe('with neither wallet nor prv', function () {
      it('should throw an error', async function () {
        await ofcToken
          .signTransaction({ txPrebuild: { payload } } as SignTransactionOptions)
          .should.be.rejectedWith('You must pass in either one of wallet or prv');
      });
    });
  });
});
