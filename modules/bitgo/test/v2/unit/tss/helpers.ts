import * as openpgp from 'openpgp';
import { createSharedDataProof, SignatureShareRecord } from '@bitgo/sdk-core';
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

export async function nockGetChallenges(params: {walletId: string, response: any}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .get('/api/v2/wallet/' + params.walletId + '/challenges')
    .reply(200, params.response);
}

export async function createWalletSignatures(
  privateKeyArmored: string,
  publicKeyToCertArmoredUser: string,
  publicKeyToCertArmoredBackup: string,
  notations: { name: string; value: string }[]
): Promise<string> {
  const userWalletSigArmored = await createSharedDataProof(privateKeyArmored, publicKeyToCertArmoredUser, notations);
  const backupWalletSigArmored = await createSharedDataProof(privateKeyArmored, publicKeyToCertArmoredBackup, notations);

  const certsUserKey = await openpgp.readKey({ armoredKey: userWalletSigArmored });
  const certsBackupKey = await openpgp.readKey({ armoredKey: backupWalletSigArmored });

  const mergedWalletKeys = new openpgp.PacketList();
  certsUserKey.toPacketList().forEach((packet) => mergedWalletKeys.push(packet));
  certsBackupKey.toPacketList().forEach((packet) => mergedWalletKeys.push(packet));

  // the underlying function only requires two arguments but the according .d.ts file for openpgp has the further
  // arguments marked as mandatory as well.
  // Once the following PR has been merged and released we no longer need the ts-ignore:
  // https://github.com/openpgpjs/openpgpjs/pull/1576
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return openpgp.armor(openpgp.enums.armor.publicKey, mergedWalletKeys.write());
}
