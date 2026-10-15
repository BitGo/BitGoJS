import * as assert from 'assert';
import * as sinon from 'sinon';
import { sendSignatureShareV2 } from '../../../../src/bitgo/tss/common';
import { BitGoBase, RequestType, TxRequest, MPCAlgorithm } from '../../../../src';

describe('sendSignatureShareV2 request type dispatch', function () {
  afterEach(function () {
    sinon.restore();
  });

  async function captureRequestType(
    mpcAlgorithm: MPCAlgorithm,
    multisigTypeVersion: 'MPCv2' | undefined,
    signingType?: 'redPallasRerand'
  ): Promise<string> {
    let capturedBody: { type: string } | undefined;
    const send = sinon.stub().callsFake((body) => {
      capturedBody = body;
      return { result: sinon.stub().resolves({} as TxRequest) };
    });
    const mockBitGo = {
      url: sinon.stub().returns('/mock/url'),
      post: sinon.stub().returns({ send }),
      setRequestTracer: sinon.stub(),
    } as unknown as BitGoBase;

    await sendSignatureShareV2(
      mockBitGo,
      'walletId',
      'txRequestId',
      [],
      RequestType.tx,
      mpcAlgorithm,
      'signerGpgPublicKey',
      undefined,
      multisigTypeVersion,
      undefined,
      signingType
    );

    if (!capturedBody) {
      throw new Error('request body should have been captured');
    }
    return capturedBody.type;
  }

  it('resolves ecdsaMpcV2 for MPCv2 + ecdsa', async function () {
    assert.strictEqual(await captureRequestType('ecdsa', 'MPCv2'), 'ecdsaMpcV2');
  });

  it('resolves eddsaMpcV2 for MPCv2 + eddsa', async function () {
    assert.strictEqual(await captureRequestType('eddsa', 'MPCv2'), 'eddsaMpcV2');
  });

  it('resolves redPallasMpcV2 for MPCv2 + redpallas (DSG rounds)', async function () {
    assert.strictEqual(await captureRequestType('redpallas', 'MPCv2'), 'redPallasMpcV2');
  });

  it('resolves redPallasRerand for MPCv2 + redpallas + rerand signingType', async function () {
    assert.strictEqual(await captureRequestType('redpallas', 'MPCv2', 'redPallasRerand'), 'redPallasRerand');
  });

  it('rejects rerand signingType for non-redpallas algorithms', async function () {
    await assert.rejects(captureRequestType('eddsa', 'MPCv2', 'redPallasRerand'), /only supported for MPCv2 redpallas/);
    await assert.rejects(
      captureRequestType('redpallas', undefined, 'redPallasRerand'),
      /only supported for MPCv2 redpallas/
    );
  });

  it('resolves eddsaMpcV1 for undefined multisigTypeVersion + eddsa', async function () {
    assert.strictEqual(await captureRequestType('eddsa', undefined), 'eddsaMpcV1');
  });

  it('resolves an empty type for redpallas without MPCv2 (no MPCv1 variant exists)', async function () {
    assert.strictEqual(await captureRequestType('redpallas', undefined), '');
  });
});
