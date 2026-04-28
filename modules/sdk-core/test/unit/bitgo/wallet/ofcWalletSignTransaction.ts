/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src';

describe('Wallet - OFC signTransaction', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  beforeEach(function () {
    mockBitGo = {
      url: sinon.stub().returns('https://test.bitgo.com'),
      post: sinon.stub(),
      get: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('ofc'),
      url: sinon.stub().returns('https://test.bitgo.com/wallet'),
      keychains: sinon.stub(),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub(),
      presignTransaction: sinon.stub().resolvesArg(0),
      keyIdsForSigning: sinon.stub().returns([0]),
      signTransaction: sinon.stub().resolves({ halfSigned: { payload: 'test', signature: 'aabbcc' } }),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      coin: 'ofcusdt',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
      multisigType: 'onchain',
      enterprise: 'ent-id',
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should pass wallet instance to baseCoin.signTransaction', async function () {
    const txPrebuild = { txInfo: { payload: '{"amount":"100"}' } } as any;
    const prv = 'test-prv';

    await wallet.signTransaction({ txPrebuild, prv });

    mockBaseCoin.signTransaction.calledOnce.should.be.true();
    const callArgs = mockBaseCoin.signTransaction.getCall(0).args[0];
    callArgs.wallet.should.equal(wallet);
  });

  it('should pass prv to baseCoin.signTransaction when provided directly', async function () {
    const txPrebuild = { txInfo: { payload: '{"amount":"100"}' } } as any;
    const prv = 'test-prv';

    await wallet.signTransaction({ txPrebuild, prv });

    const callArgs = mockBaseCoin.signTransaction.getCall(0).args[0];
    callArgs.prv.should.equal(prv);
  });

  it('should pass wallet instance to baseCoin.signTransaction even when no prv is available', async function () {
    sinon.stub(wallet, 'getUserPrv').returns(undefined as any);
    const txPrebuild = { txInfo: { payload: '{"amount":"100"}' } } as any;

    await wallet.signTransaction({ txPrebuild });

    mockBaseCoin.signTransaction.calledOnce.should.be.true();
    const callArgs = mockBaseCoin.signTransaction.getCall(0).args[0];
    callArgs.wallet.should.equal(wallet);
  });
});
