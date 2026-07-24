/**
 * @prettier
 */
import sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { OfcToken } from '../../../../src/coins';

const OFC_ZEC_CONFIG = {
  coin: 'ofczec',
  decimalPlaces: 8,
  name: 'OFCZEC',
  type: 'ofczec',
  backingCoin: 'zec',
  isFiat: false,
};

describe('Wallet - OFC createAddress', function () {
  let mockBitGo: any;
  let ofcToken: OfcToken;
  let keychainsGetStub: sinon.SinonStub;

  function makePostChain(resolved: unknown): any {
    const chain: any = {};
    chain.send = sinon.stub().returns(chain);
    chain.result = sinon.stub().resolves(resolved);
    return chain;
  }

  beforeEach(function () {
    keychainsGetStub = sinon.stub().resolves({ id: 'user-key-id', pub: 'xpub-value' });
    mockBitGo = {
      url: sinon.stub().returns('https://test.bitgo.com/'),
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };
    ofcToken = new OfcToken(mockBitGo, OFC_ZEC_CONFIG);
    mockBitGo.coin = sinon.stub().returns(ofcToken);
    sinon.stub(OfcToken.prototype, 'keychains').returns({ get: keychainsGetStub } as any);
  });

  afterEach(function () {
    sinon.restore();
  });

  const mockAddressResponse = {
    id: 'new-address-id',
    address: 'bg-aabbccddeeff00112233445566778899',
    chain: 0,
    index: 1,
  };

  describe('single-key OFC wallet (userKeySigningRequired: true)', function () {
    it('should create a receive address without fetching any keychains', async function () {
      const walletData = {
        id: 'wallet-id',
        coin: 'ofc',
        keys: ['user-key-id'],
        type: 'trading',
        multisigType: 'onchain',
        enterprise: 'ent-id',
        userKeySigningRequired: true,
      };
      const wallet = new Wallet(mockBitGo, ofcToken, walletData);
      mockBitGo.post.returns(makePostChain(mockAddressResponse));

      const result = await wallet.createAddress({ onToken: 'ofczec' });

      result.should.have.property('id', 'new-address-id');
      result.should.have.property('address', 'bg-aabbccddeeff00112233445566778899');
      keychainsGetStub.called.should.be.false();
    });
  });

  describe('two-key OFC wallet (userKeySigningRequired: false)', function () {
    it('should create a receive address without fetching keychains', async function () {
      const walletData = {
        id: 'wallet-id',
        coin: 'ofc',
        keys: ['user-key-id', 'bitgo-key-id'],
        type: 'trading',
        multisigType: 'onchain',
        enterprise: 'ent-id',
        userKeySigningRequired: false,
      };
      const wallet = new Wallet(mockBitGo, ofcToken, walletData);
      mockBitGo.post.returns(makePostChain(mockAddressResponse));

      const result = await wallet.createAddress({ onToken: 'ofczec' });

      result.should.have.property('id', 'new-address-id');
      keychainsGetStub.called.should.be.false();
    });

    it('should succeed even if keychains().get() would fail for a server-managed key', async function () {
      keychainsGetStub.rejects(new Error('key not found'));
      const walletData = {
        id: 'wallet-id',
        coin: 'ofc',
        keys: ['user-key-id', 'bitgo-key-id'],
        type: 'trading',
        multisigType: 'onchain',
        enterprise: 'ent-id',
        userKeySigningRequired: false,
      };
      const wallet = new Wallet(mockBitGo, ofcToken, walletData);
      mockBitGo.post.returns(makePostChain(mockAddressResponse));

      const result = await wallet.createAddress({ onToken: 'ofczec' });
      result.should.have.property('id', 'new-address-id');
    });
  });

  describe('non-OFC wallet (eth)', function () {
    it('should still fetch keychains for address verification', async function () {
      const mockEthCoin: any = {
        getFamily: sinon.stub().returns('eth'),
        isEVM: sinon.stub().returns(true),
        supportsTss: sinon.stub().returns(false),
        url: sinon.stub().returns('/api/v2/eth/wallet/wallet-id/address'),
        isWalletAddress: sinon.stub().resolves(true),
        keychains: sinon.stub().returns({ get: keychainsGetStub }),
      };
      const walletData = {
        id: 'wallet-id',
        coin: 'eth',
        keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
        coinSpecific: { pendingChainInitialization: false },
      };
      const wallet = new Wallet(mockBitGo, mockEthCoin, walletData);
      mockBitGo.post.returns(makePostChain({ id: 'eth-addr-id', address: '0xabc', coinSpecific: {} }));

      await wallet.createAddress({});

      keychainsGetStub.callCount.should.equal(3);
    });
  });

  describe('missing onToken parameter', function () {
    it('should throw for OFC wallets when onToken is omitted', async function () {
      const walletData = {
        id: 'wallet-id',
        coin: 'ofc',
        keys: ['user-key-id'],
        type: 'trading',
        multisigType: 'onchain',
        enterprise: 'ent-id',
      };
      const wallet = new Wallet(mockBitGo, ofcToken, walletData);

      await wallet.createAddress({}).should.be.rejectedWith('onToken is a mandatory parameter for OFC wallets');
    });
  });
});
