import { SignatureShareRecord } from '@bitgo/sdk-core';
import * as nock from 'nock';

export async function nockSendTxRequest(params: {coin:string, walletId: string, txRequestId: string}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/${params.coin}/wallet/${params.walletId}/tx/send`, { txRequestId: params.txRequestId })
    .reply(200);
}

export async function nockSendSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: unknown, signerShare?: string, tssType?: 'eddsa' | 'ecdsa'}, status = 200): Promise<nock.Scope> {
  const transactions = getRoute(params.tssType);
  return nock('https://bitgo.fakeurl')
    .persist(true)
    .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId + transactions}/signatureshares`)
    .reply(status, (status === 200 ? params.signatureShare : { error: 'some error' }));
}

export async function nockSendSignatureShareWithResponse(params: { walletId: string, txRequestId: string, signatureShare: unknown, response: unknown, tssType?: 'eddsa' | 'ecdsa'}, status = 200): Promise<nock.Scope> {
  const transactions = getRoute(params.tssType);
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId + transactions}/signatureshares`)
    .reply(status, (status === 200 ? params.response : { error: 'some error' }));
}

export async function nockDeleteSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: SignatureShareRecord, tssType?: 'eddsa' | 'ecdsa'}, status = 200): Promise<nock.Scope> {
  const transactions = getRoute(params.tssType);
  return nock('https://bitgo.fakeurl')
    .delete(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId + transactions}/signatureshares`)
    .reply(status, (status === 200 ? [params.signatureShare] : { error: 'some error' }));
}

export async function nockCreateTxRequest(params: { walletId: string, requestBody: unknown, response: unknown }): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${params.walletId}/txrequests`, params.requestBody)
    .reply(200, params.response);
}

export async function nockGetTxRequest(params: {walletId: string, txRequestId: string, response: unknown, notPersist?: boolean}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .persist(true)
    .get(`/api/v2/wallet/${params.walletId}/txrequests?txRequestIds=${params.txRequestId}&latest=true`)
    .reply(200, params.response);
}

export async function nockExchangeCommitments(params: {walletId: string, txRequestId: string, response: unknown, notPersist?: boolean}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .persist(true)
    .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId}/commit`)
    .reply(200, params.response);
}

export function getRoute(tssType: 'eddsa' | 'ecdsa' = 'eddsa'): string {
  if (tssType === 'ecdsa') {
    return '/transactions/0';
  }

  return '';
}
