import { SignatureShareRecord } from '@bitgo/sdk-core';
import * as nock from 'nock';

export async function nockSendSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: any, signerShare?: string, response?: SignatureShareRecord}, status = 200): Promise<nock.Scope> {
  const { signatureShare, signerShare } = params;
  const requestBody = signerShare === undefined ?
    { signatureShare } :
    { signatureShare, signerShare };

  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId}/signatureshares`, requestBody)
    .reply(status, (status === 200 ? (params.response ? params.response : params.signatureShare) : { error: 'some error' }));
}

export async function nockGetTxRequest(params: {walletId: string, txRequestId: string, response: any}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .get(`/api/v2/wallet/${params.walletId}/txrequests?txRequestIds=${params.txRequestId}&latest=true`)
    .reply(200, params.response);
}
