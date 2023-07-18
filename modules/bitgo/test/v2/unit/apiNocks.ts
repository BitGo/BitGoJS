import * as nock from 'nock';

export async function nockGetSigningKey(params: {
  userId: string;
  enterpriseId: string;
  response: any;
}): Promise<nock.Scope> {
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/enterprise/${params.enterpriseId}/user/${params.userId}/signingkey`)
    .reply(200, params.response);
}
