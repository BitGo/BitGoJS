import 'should';
import sinon from 'sinon';
import { exchangeEddsaCommitments } from '../../../../src/bitgo/tss/common';
import {
  BitGoBase,
  CommitmentShareRecord,
  CommitmentType,
  EncryptedSignerShareRecord,
  RequestType,
} from '../../../../src';

function makeMockBitGo(result: unknown): { bitgo: BitGoBase; post: sinon.SinonStub } {
  const send = sinon.stub().returnsThis();
  const resultStub = sinon.stub().resolves(result);
  const post = sinon.stub().returns({ send, result: resultStub });
  const bitgo = {
    post,
    url: sinon.stub().callsFake((path: string) => path),
    setRequestTracer: sinon.stub(),
  } as unknown as BitGoBase;
  return { bitgo, post };
}

describe('exchangeEddsaCommitments', function () {
  const walletId = 'walletId';
  const txRequestId = 'txRequestId';
  const commitmentShare: CommitmentShareRecord = {
    from: 'user',
    to: 'bitgo',
    type: CommitmentType.COMMITMENT,
    share: 'commitmentShareValue',
  };
  const encryptedSignerShare: EncryptedSignerShareRecord = {
    from: 'user',
    to: 'bitgo',
    type: 'encryptedSignerShare',
    share: 'encryptedSignerShareValue',
  };

  afterEach(function () {
    sinon.restore();
  });

  it('posts to /transactions/0/commit for a tx request with apiMode full', async function () {
    const { bitgo, post } = makeMockBitGo({ commitmentShare });
    await exchangeEddsaCommitments(
      bitgo,
      walletId,
      txRequestId,
      commitmentShare,
      encryptedSignerShare,
      'full',
      undefined,
      RequestType.tx
    );
    post.calledOnceWith(`/wallet/${walletId}/txrequests/${txRequestId}/transactions/0/commit`).should.be.true();
  });

  it('posts to /messages/0/commit for a message request with apiMode full', async function () {
    const { bitgo, post } = makeMockBitGo({ commitmentShare });
    await exchangeEddsaCommitments(
      bitgo,
      walletId,
      txRequestId,
      commitmentShare,
      encryptedSignerShare,
      'full',
      undefined,
      RequestType.message
    );
    post.calledOnceWith(`/wallet/${walletId}/txrequests/${txRequestId}/messages/0/commit`).should.be.true();
  });

  it('defaults to RequestType.tx when requestType is not provided, preserving prior behavior', async function () {
    const { bitgo, post } = makeMockBitGo({ commitmentShare });
    await exchangeEddsaCommitments(bitgo, walletId, txRequestId, commitmentShare, encryptedSignerShare, 'full');
    post.calledOnceWith(`/wallet/${walletId}/txrequests/${txRequestId}/transactions/0/commit`).should.be.true();
  });

  it('posts to plain /commit regardless of requestType when apiMode is lite', async function () {
    const { bitgo, post } = makeMockBitGo({ commitmentShare });
    await exchangeEddsaCommitments(
      bitgo,
      walletId,
      txRequestId,
      commitmentShare,
      encryptedSignerShare,
      'lite',
      undefined,
      RequestType.message
    );
    post.calledOnceWith(`/wallet/${walletId}/txrequests/${txRequestId}/commit`).should.be.true();
  });
});
