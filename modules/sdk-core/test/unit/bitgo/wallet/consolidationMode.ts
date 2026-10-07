import * as assert from 'assert';
import sinon from 'sinon';
import 'should';
import 'should-sinon';
import { Wallet } from '../../../../src';

describe('Wallet - account consolidation mode (CHALO-1755)', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;
  let sendStub: sinon.SinonStub;

  const buildResponse = [{ txHex: 'aaa', consolidateId: 'c1' }];

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      url: sinon.stub().callsFake((path: string) => `/tsol${path}`),
      allowsAccountConsolidations: sinon.stub().returns(true),
      supportsTss: sinon.stub().returns(false),
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
      getFullName: sinon.stub().returns('TestSol'),
      postProcessPrebuild: sinon.stub().callsFake((prebuild: any) => Promise.resolve(prebuild)),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
      type: 'hot',
      multisigType: 'tss',
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);

    // Mirror the resource-management test stub shape: bitgo.post(...).send(body).result()
    const resultStub = sinon.stub().resolves(buildResponse);
    sendStub = sinon.stub().returns({ result: resultStub });
    mockBitGo.post.returns({ send: sendStub });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('prebuildConsolidateAccountParams', function () {
    it('includes consolidationMode in the whitelist', function () {
      const whitelistedParams = (wallet as any).prebuildConsolidateAccountParams();
      whitelistedParams.should.containEql('consolidationMode');
    });
  });

  describe('buildAccountConsolidations', function () {
    it('forwards an explicit single-asset mode in the build request body', async function () {
      const consolidations = await wallet.buildAccountConsolidations({
        consolidationMode: 'single-asset',
        consolidateAddresses: ['Recv1'],
      } as any);

      sinon.assert.calledOnce(mockBitGo.post);
      (mockBitGo.post.firstCall.args[0] as string).should.containEql(
        '/wallet/test-wallet-id/consolidateAccount/build'
      );
      sinon.assert.calledOnce(sendStub);
      const body = sendStub.firstCall.args[0];
      body.consolidationMode.should.equal('single-asset');

      consolidations.should.have.length(1);
      consolidations[0].walletId.should.equal('test-wallet-id');
    });

    it('forwards an explicit legacy-multi-asset mode in the build request body', async function () {
      await wallet.buildAccountConsolidations({ consolidationMode: 'legacy-multi-asset' } as any);

      const body = sendStub.firstCall.args[0];
      body.consolidationMode.should.equal('legacy-multi-asset');
    });

    it('omits consolidationMode from the request body when the caller does not set it', async function () {
      // The omitted-mode request must stay byte-identical to the pre-CHALO-1755 shape:
      // SDK SOL callers are never implicitly single-asset.
      await wallet.buildAccountConsolidations({ consolidateAddresses: ['Recv1'] } as any);

      const body = sendStub.firstCall.args[0];
      assert.strictEqual(body.consolidationMode, undefined);
      Object.keys(body).should.not.containEql('consolidationMode');
      body.consolidateAddresses.should.deepEqual(['Recv1']);
    });
  });
});
