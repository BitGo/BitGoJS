/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { Ofc } from '../../../src/coins/ofc';
import { OfcToken } from '../../../src/coins/ofcToken';
import { BaseCoin } from '../../../src/bitgo/baseCoin/baseCoin';
import { Wallet } from '../../../src';

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

  beforeEach(function () {
    mockBitGo = { url: sinon.stub().returns('https://test.bitgo.com') };
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('signMessage', function () {
    let ofc: Ofc;

    beforeEach(function () {
      ofc = new Ofc(mockBitGo);
    });

    describe('with a Wallet instance', function () {
      it('should delegate to wallet.toTradingAccount().signPayload() and return a Buffer', async function () {
        const hexSignature = 'deadbeef';
        const signPayloadStub = sinon.stub().resolves(hexSignature);

        const mockBaseCoin = { supportsTss: sinon.stub().returns(false), getMPCAlgorithm: sinon.stub() };
        const walletData = {
          id: 'wallet-id',
          keys: ['key1', 'key2', 'key3'],
          multisigType: 'onchain',
          enterprise: 'ent-id',
        };
        const wallet = new Wallet(mockBitGo, mockBaseCoin as any, walletData);
        sinon.stub(wallet, 'toTradingAccount').returns({ signPayload: signPayloadStub } as any);

        const message = 'test message';
        const result = await ofc.signMessage(wallet, message);

        signPayloadStub.calledOnceWith({ payload: message }).should.be.true();
        result.should.deepEqual(Buffer.from(hexSignature, 'hex'));
      });
    });

    describe('with a prv key', function () {
      it('should delegate to the base class signMessage', async function () {
        const expectedResult = Buffer.from('basesignature', 'hex');
        const superSignMessageStub = sinon.stub(BaseCoin.prototype, 'signMessage').resolves(expectedResult);

        const key = {
          prv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqhuCo36EkzGH6qiT9mJHBvuPKtLRYD4NxFb5hgXMQBB2LLT6mxLDHHo',
        };
        const message = 'test message';
        const result = await ofc.signMessage(key, message);

        superSignMessageStub.calledOnceWith(key, message).should.be.true();
        result.should.equal(expectedResult);
      });
    });
  });

  describe('signTransaction (OfcToken)', function () {
    let ofcToken: OfcToken;
    const payload = '{"amount":"100","from":"alice","to":"bob"}';

    beforeEach(function () {
      ofcToken = new OfcToken(mockBitGo, TEST_TOKEN_CONFIG);
    });

    describe('with wallet and no prv (BitGo remote signing)', function () {
      it('should call wallet.toTradingAccount().signPayload() without a passphrase', async function () {
        const hexSignature = 'aabbccdd';
        const signPayloadStub = sinon.stub().resolves(hexSignature);
        const mockWallet = { toTradingAccount: sinon.stub().returns({ signPayload: signPayloadStub }) };

        const result = await ofcToken.signTransaction({ txPrebuild: { payload }, wallet: mockWallet as any });

        signPayloadStub.calledOnceWith({ payload, walletPassphrase: undefined }).should.be.true();
        result.should.deepEqual({ halfSigned: { payload, signature: hexSignature } });
      });
    });

    describe('with wallet and prv (local signing routed through wallet)', function () {
      it('should call wallet.toTradingAccount().signPayload() with the wallet passphrase', async function () {
        const hexSignature = 'aabbccdd';
        const passphrase = 'test-passphrase';
        const signPayloadStub = sinon.stub().resolves(hexSignature);
        const mockWallet = { toTradingAccount: sinon.stub().returns({ signPayload: signPayloadStub }) };

        const result = await ofcToken.signTransaction({
          txPrebuild: { payload },
          wallet: mockWallet as any,
          prv: passphrase,
        });

        signPayloadStub.calledOnceWith({ payload, walletPassphrase: passphrase }).should.be.true();
        result.should.deepEqual({ halfSigned: { payload, signature: hexSignature } });
      });
    });

    describe('with prv only (local signing without wallet)', function () {
      it('should sign locally and return the correct halfSigned result', async function () {
        const signatureBytes = Buffer.from('ccddee', 'hex');
        sinon.stub(BaseCoin.prototype, 'signMessage').resolves(signatureBytes);

        const result = await ofcToken.signTransaction({ txPrebuild: { payload }, prv: 'test-prv' });

        result.should.deepEqual({ halfSigned: { payload, signature: signatureBytes.toString('hex') } });
      });

      it('should pass the prv to signMessage', async function () {
        const signatureBytes = Buffer.from('ccddee', 'hex');
        const superSignMessageStub = sinon.stub(BaseCoin.prototype, 'signMessage').resolves(signatureBytes);
        const prv = 'test-prv';

        await ofcToken.signTransaction({ txPrebuild: { payload }, prv });

        superSignMessageStub.calledOnceWith({ prv }, payload).should.be.true();
      });
    });

    describe('with neither wallet nor prv', function () {
      it('should throw an error', async function () {
        await ofcToken
          .signTransaction({ txPrebuild: { payload } })
          .should.be.rejectedWith('You must pass in either one of wallet or prv');
      });
    });
  });
});
