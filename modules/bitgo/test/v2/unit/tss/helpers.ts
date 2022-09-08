import { SignatureShareRecord } from '@bitgo/sdk-core';
import { getRoute } from '../internal/tssUtils/common';
import * as nock from 'nock';

export async function nockSendSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: any, signerShare?: string, response?: SignatureShareRecord, tssType?: 'ecdsa' | 'eddsa'}, status = 200): Promise<nock.Scope> {
  const { signatureShare, signerShare, tssType } = params;
  const transactions = getRoute(tssType);
  const requestBody = signerShare === undefined ?
    { signatureShare } :
    { signatureShare, signerShare };

  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId + transactions}/signatureshares`, requestBody)
    .reply(status, (status === 200 ? (params.response ? params.response : params.signatureShare) : { error: 'some error' }));
}

export async function nockGetTxRequest(params: {walletId: string, txRequestId: string, response: any}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .get(`/api/v2/wallet/${params.walletId}/txrequests?txRequestIds=${params.txRequestId}&latest=true`)
    .reply(200, params.response);
}
