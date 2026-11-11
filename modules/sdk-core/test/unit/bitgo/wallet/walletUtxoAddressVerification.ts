import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { IBaseCoin } from '../../../../src/bitgo/baseCoin';

describe('Wallet - UTXO address verification with coinSpecific.derivationPrefix', function () {
  const derivationPrefix = '44/0/1528449227/506574854';
  let wallet: Wallet;
  let mockBitGo: { post: sinon.SinonStub; setRequestTracer: sinon.SinonStub };
  let mockBaseCoin: Record<string, sinon.SinonStub>;

  function mockCreatedAddress(address: unknown) {
    mockBitGo.post.returns({
      send: sinon.stub().returns({
        result: sinon.stub().resolves(address),
      }),
    });
  }

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      getFamily: sinon.stub().returns('btc'),
      isEVM: sinon.stub().returns(false),
      isWalletAddress: sinon.stub(),
      keychains: sinon.stub().returns({
        get: sinon.stub().callsFake(({ id }: { id: string }) => Promise.resolve({ id, pub: `xpub-${id}` })),
      }),
      url: sinon.stub().returns('/api/v2/btc/wallet/test-wallet-id/address'),
    };

    wallet = new Wallet(mockBitGo as unknown as BitGoBase, mockBaseCoin as unknown as IBaseCoin, {
      id: 'test-wallet-id',
      keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
      coinSpecific: {},
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('forwards the whole address coinSpecific, including derivationPrefix, to isWalletAddress', async function () {
    mockCreatedAddress({
      id: 'address-id',
      address: 'bc1qexample',
      chain: 20,
      index: 4,
      coinSpecific: { witnessScript: 'aa', outputScript: 'bb', derivationPrefix },
    });
    mockBaseCoin.isWalletAddress.resolves(true);

    await wallet.createAddress({ chain: 20 });

    const verificationData = mockBaseCoin.isWalletAddress.getCall(0).args[0];
    verificationData.coinSpecific.derivationPrefix.should.equal(derivationPrefix);
    verificationData.chain.should.equal(20);
    verificationData.index.should.equal(4);
    verificationData.keychains
      .map((k: { pub: string }) => k.pub)
      .should.deepEqual(['xpub-user-key-id', 'xpub-backup-key-id', 'xpub-bitgo-key-id']);
  });

  it('does not add a derivationPrefix for legacy addresses', async function () {
    mockCreatedAddress({
      id: 'address-id',
      address: 'bc1qexample',
      chain: 20,
      index: 4,
      coinSpecific: { witnessScript: 'aa', outputScript: 'bb' },
    });
    mockBaseCoin.isWalletAddress.resolves(true);

    await wallet.createAddress({ chain: 20 });

    const verificationData = mockBaseCoin.isWalletAddress.getCall(0).args[0];
    assert.strictEqual(verificationData.coinSpecific.derivationPrefix, undefined);
  });

  it('propagates a verification failure for a prefixed address instead of skipping it', async function () {
    mockCreatedAddress({
      id: 'address-id',
      address: 'bc1qexample',
      chain: 20,
      index: 4,
      coinSpecific: { derivationPrefix },
    });
    mockBaseCoin.isWalletAddress.rejects(new Error('cannot verify derivationPrefix'));

    await wallet.createAddress({ chain: 20, allowSkipVerifyAddress: true }).should.be.rejectedWith(/derivationPrefix/);
  });
});
