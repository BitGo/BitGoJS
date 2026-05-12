import {
  BaseCoin,
  BitgoGPGPublicKey,
  common,
  ECDSAUtils,
  EDDSAUtils,
  RequestTracer,
  RequestType,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { EddsaMPSDsg, MPSComms, MPSTypes, MPSUtil } from '@bitgo/sdk-lib-mpc';
import * as openpgp from 'openpgp';
import nock = require('nock');
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import {
  EddsaMPCv2SignatureShareRound1Input,
  EddsaMPCv2SignatureShareRound1Output,
  EddsaMPCv2SignatureShareRound2Input,
  EddsaMPCv2SignatureShareRound2Output,
  EddsaMPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import { BitGo } from '../../../../../../src';

const MPCv2PartiesEnum = ECDSAUtils.MPCv2PartiesEnum;

interface SignatureShareApiBody {
  signatureShares: SignatureShareRecord[];
  signerGpgPublicKey: string;
}

describe('signTxRequest:', function () {
  let tssUtils: EDDSAUtils.EddsaMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitgoGpgKey: openpgp.SerializedKeyPair<string> & { revocationCertificate: string };
  let bitgoPrvKeyObj: openpgp.PrivateKey;
  const coinName = 'sol';

  const reqId = new RequestTracer();
  const txRequestId = 'randomTxReqId';
  const signableHex =
    '02010206c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c4f5f5987bfe26aa66013efd96d36360f2b4336c91f993259fb56051305614d42f2ea13f8ff9d7958dbf269c6e36bfdf5cb5c43de4b4e1d3efb7dab3d5d028604000000000000000000000000000000000000000000000000000000000000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea94000003a621f6d1cc4b8fb2a739aa08e4034da0fc588ece3bd857630de30f7edde45dd0204030205010404000000040200030c02000000f0a29a3b00000000';
  const serializedTxHex = `02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003bc9df0b397bec2ed3b6444a8c33f38267cc08b5fb2a7d37e26b6c487e26d15b7c07830eb78e26a88db5de4aa6986a327f09aed8c01533e5b972748ddf60b80f${signableHex}`;
  const messageRaw = 'TOO MANY SECRETS';
  const messageEncoded = Buffer.from(messageRaw).toString('hex');
  const txParams = {
    recipients: [
      {
        address: 'HMEgbR4S2hLKfst2VZUVpHVUu4FioFPyW5iUuJvZdMvs',
        amount: '999990000',
      },
    ],
  };
  const txRequest: TxRequest = {
    txRequestId,
    enterpriseId: '4517abfb-f567-4b7a-9f91-407509d29403',
    transactions: [
      {
        unsignedTx: {
          serializedTxHex,
          signableHex,
          derivationPath: 'm/0', // Needs this when key derivation is supported
        },
        state: 'pendingSignature',
        signatureShares: [],
      },
    ],
    unsignedTxs: [],
    date: new Date().toISOString(),
    intent: { intentType: 'payment' },
    latest: true,
    state: 'pendingUserSignature',
    walletType: 'hot',
    walletId: 'walletId',
    policiesChecked: true,
    version: 1,
    userId: 'userId',
    apiVersion: 'full',
  };

  const txRequestForMessageSigning: TxRequest = {
    txRequestId,
    enterpriseId: '4517abfb-f567-4b7a-9f91-407509d29403',
    messages: [
      {
        messageRaw,
        messageEncoded,
        derivationPath: 'm/0',
        state: 'pendingSignature',
        signatureShares: [],
      },
    ],
    unsignedTxs: [],
    date: new Date().toISOString(),
    intent: { intentType: 'payment' },
    latest: true,
    state: 'pendingUserSignature',
    walletType: 'hot',
    walletId: 'walletId',
    policiesChecked: true,
    version: 1,
    userId: 'userId',
    apiVersion: 'full',
  };

  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;

  before(async () => {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    bitgoGpgKey = await openpgp.generateKey({
      userIDs: [{ name: 'bitgo', email: 'bitgo@test.com' }],
      curve: 'ed25519',
      format: 'armored',
    });
    bitgoPrvKeyObj = await openpgp.readPrivateKey({ armoredKey: bitgoGpgKey.privateKey });
    const constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKey.publicKey,
        bitgoEddsaMpcv2PublicKey: bitgoGpgKey.publicKey,
      },
    };
    nock(bgUrl).get('/api/v1/client/constants').times(20).reply(200, { ttl: 3600, constants });

    const [userDkg, backupDkg, bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
    backupKeyShare = backupDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();

    baseCoin = bitgo.coin(coinName);

    const walletData = {
      id: txRequest.walletId,
      enterprise: txRequest.enterpriseId,
      coin: coinName,
      coinSpecific: {
        rootAddress: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
      },
      multisigType: 'tss',
      multisigTypeVersion: 'MPCv2',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new EDDSAUtils.EddsaMPCv2Utils(bitgo, baseCoin, wallet);
  });

  beforeEach(async function () {
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, txRequest.enterpriseId!, bitgoGpgKey);
  });

  after(function () {
    nock.cleanAll();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('successfully signs a txRequest with user key for an mps hot wallet with WP', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: userPrvBase64,
      reqId,
      txParams,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('successfully signs a txRequest with backup key for an mps hot wallet with WP', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest, RequestType.tx, 0, MPCv2PartiesEnum.BACKUP);
    await Promise.all(nockPromises);

    const backupPrvBase64 = Buffer.from(backupKeyShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: backupPrvBase64,
      mpcv2PartyId: MPCv2PartiesEnum.BACKUP,
      reqId,
      txParams,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('successfully signs a txRequest with a message for an mps hot wallet with WP', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequestForMessageSigning, RequestType.message);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils.signTxRequestForMessage({
      txRequest: txRequestForMessageSigning,
      prv: userPrvBase64,
      reqId,
      messageRaw: txRequestForMessageSigning.messages![0].messageRaw,
      bufferToSign: Buffer.from(messageEncoded, 'hex'),
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('should throw if round 1 response has wrong type', async function () {
    nock('https://bitgo.fakeurl')
      .post(`/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}/transactions/0/sign`)
      .reply(200, {
        txRequestId,
        transactions: [
          {
            signatureShares: [
              {
                from: SignatureShareType.BITGO,
                to: SignatureShareType.USER,
                share: JSON.stringify({ type: 'round2Output', data: {} }),
              },
            ],
          },
        ],
      });

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils
      .signTxRequest({ txRequest, prv: userPrvBase64, reqId, txParams })
      .should.be.rejectedWith(/Unexpected signature share response/);
  });

  it('should throw if round 2 response has wrong type', async function () {
    const messageBuffer = Buffer.from(signableHex, 'hex');
    const bitgoDsg = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoDsg.initDsg(
      bitgoKeyShare,
      messageBuffer,
      txRequest.transactions![0].unsignedTx.derivationPath,
      MPCv2PartiesEnum.USER
    );
    const bitgoMsg1 = bitgoDsg.getFirstMessage();

    // Round 1: return a valid round1Output so the orchestration can proceed
    nock('https://bitgo.fakeurl')
      .post(
        `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}/transactions/0/sign`,
        (body) =>
          (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound1Input).type === 'round1Input'
      )
      .reply(
        200,
        async (_uri: string, body: { signatureShares: SignatureShareRecord[]; signerGpgPublicKey: string }) => {
          const parsedShare = JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound1Input;
          const userMsg1Bytes = Buffer.from(parsedShare.data.msg1.message, 'base64');
          const userDeserializedMsg1: MPSTypes.DeserializedMessage = {
            from: MPCv2PartiesEnum.USER,
            payload: new Uint8Array(userMsg1Bytes),
          };
          // Advance bitgo session (we don't need bitgoMsg2 for this test)
          bitgoDsg.handleIncomingMessages([bitgoMsg1, userDeserializedMsg1]);
          const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoPrvKeyObj);
          const round1Output: EddsaMPCv2SignatureShareRound1Output = {
            type: 'round1Output',
            data: { msg1: bitgoSignedMsg1 },
          };
          return {
            txRequestId,
            transactions: [
              {
                signatureShares: [
                  {
                    from: SignatureShareType.BITGO,
                    to: SignatureShareType.USER,
                    share: JSON.stringify(round1Output),
                  },
                ],
              },
            ],
          };
        }
      );

    // Round 2: return a share with wrong type (round3Output instead of round2Output)
    nock('https://bitgo.fakeurl')
      .post(
        `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}/transactions/0/sign`,
        (body) =>
          (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound2Input).type === 'round2Input'
      )
      .reply(200, {
        txRequestId,
        transactions: [
          {
            signatureShares: [
              {
                from: SignatureShareType.USER,
                to: SignatureShareType.BITGO,
                share: 'placeholder',
              },
              {
                from: SignatureShareType.BITGO,
                to: SignatureShareType.USER,
                share: JSON.stringify({ type: 'round3Output', data: {} }),
              },
            ],
          },
        ],
      });

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils
      .signTxRequest({ txRequest, prv: userPrvBase64, reqId, txParams })
      .should.be.rejectedWith(/Unexpected signature share response. Unable to parse data./);
  });

  it('successfully signs a txRequest after receiving multiple 429 errors in round 2', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest, RequestType.tx, 3);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: userPrvBase64,
      reqId,
      txParams,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('successfully signs a txRequest after receiving multiple 429 errors in round 1', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest, RequestType.tx, 3, MPCv2PartiesEnum.USER, 1);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: userPrvBase64,
      reqId,
      txParams,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('successfully signs a txRequest after receiving multiple 429 errors in round 3', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest, RequestType.tx, 3, MPCv2PartiesEnum.USER, 3);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: userPrvBase64,
      reqId,
      txParams,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.true();
  });

  it('fails to sign a txRequest after receiving over 3 429 errors in round 2', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(txRequest, RequestType.tx, 4);
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils
      .signTxRequest({
        txRequest,
        prv: userPrvBase64,
        reqId,
        txParams,
      })
      .should.be.rejectedWith('Too many requests, slow down!');
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.false();
    nockPromises[2].isDone().should.be.false();
    nockPromises[3].isDone().should.be.false();
  });

  it('should throw if round 3 response is malformed', async function () {
    const nockPromises = await getNockPromisesForEddsaSigning(
      txRequest,
      RequestType.tx,
      0,
      MPCv2PartiesEnum.USER,
      2,
      true
    );
    await Promise.all(nockPromises);

    const userPrvBase64 = Buffer.from(userKeyShare).toString('base64');
    await tssUtils
      .signTxRequest({
        txRequest,
        prv: userPrvBase64,
        reqId,
        txParams,
      })
      .should.be.rejectedWith('Invalid txRequest object after round 3');
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
    nockPromises[3].isDone().should.be.false();
  });

  async function getNockPromisesForEddsaSigning(
    txRequest: TxRequest,
    requestType: RequestType = RequestType.tx,
    rateLimitErrorCount = 0,
    signerPartyId: ECDSAUtils.MPCv2PartiesEnum = MPCv2PartiesEnum.USER,
    rateLimitRound = 2,
    malformedRound3Response = false
  ): Promise<nock.Scope[]> {
    const txOrMessageToSign =
      requestType === RequestType.message
        ? txRequest.messages![0].messageEncoded!
        : txRequest.transactions![0].unsignedTx.signableHex;
    const messageBuffer = Buffer.from(txOrMessageToSign, 'hex');
    const bitgoSession = new EddsaMPSDsg.DSG(MPCv2PartiesEnum.BITGO);
    bitgoSession.initDsg(
      bitgoKeyShare,
      messageBuffer,
      txRequest.transactions?.[0].unsignedTx.derivationPath || 'm/0',
      signerPartyId
    );
    const bitgoMsg1 = bitgoSession.getFirstMessage();
    let bitgoMsg2: MPSTypes.DeserializedMessage | undefined;

    return [
      await nockTxRequestResponseSignatureShareRoundOne(
        bitgoSession,
        txRequest,
        bitgoMsg1,
        bitgoPrvKeyObj,
        (msg) => {
          bitgoMsg2 = msg;
        },
        requestType,
        signerPartyId,
        rateLimitRound === 1 ? rateLimitErrorCount : 0
      ),
      await nockTxRequestResponseSignatureShareRoundTwo(
        txRequest,
        () => bitgoMsg2!,
        bitgoPrvKeyObj,
        requestType,
        rateLimitRound === 2 ? rateLimitErrorCount : 0,
        signerPartyId
      ),
      await nockTxRequestResponseSignatureShareRoundThree(
        txRequest,
        requestType,
        signerPartyId,
        rateLimitRound === 3 ? rateLimitErrorCount : 0,
        malformedRound3Response
      ),
      await nockSendTxRequest(txRequest, requestType),
    ];
  }
});

async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
  coin: string,
  enterpriseId: string,
  bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>
): Promise<BitgoGPGPublicKey> {
  const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
    name: 'irrelevant',
    publicKey: bitgoGpgKeyPair.publicKey,
    mpcv2PublicKey: bitgoGpgKeyPair.publicKey,
    eddsaMpcv2PublicKey: bitgoGpgKeyPair.publicKey,
    enterpriseId,
  };
  nock('https://bitgo.fakeurl')
    .get(`/api/v2/${coin}/tss/pubkey`)
    .times(4)
    .query({ enterpriseId })
    .reply(200, bitgoGPGPublicKeyResponse);
  return bitgoGPGPublicKeyResponse;
}

async function nockTxRequestResponseSignatureShareRoundOne(
  bitgoSession: EddsaMPSDsg.DSG,
  txRequest: TxRequest,
  bitgoMsg1: MPSTypes.DeserializedMessage,
  bitgoGpgPrivKey: openpgp.PrivateKey,
  saveBitgoMsg2: (msg: MPSTypes.DeserializedMessage) => void,
  requestType: RequestType = RequestType.tx,
  signerPartyId: ECDSAUtils.MPCv2PartiesEnum = MPCv2PartiesEnum.USER,
  rateLimitErrorCount = 0
): Promise<nock.Scope> {
  const route = requestType === RequestType.message ? '/messages/0' : '/transactions/0';
  const signerShareType = signerPartyId === MPCv2PartiesEnum.USER ? SignatureShareType.USER : SignatureShareType.BACKUP;
  const scope = nock('https://bitgo.fakeurl');

  if (rateLimitErrorCount > 0) {
    scope
      .post(
        `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
        (body) =>
          (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound1Input).type === 'round1Input'
      )
      .times(rateLimitErrorCount)
      .reply(429, {
        error: 'Too many requests, slow down!',
        name: 'TooManyRequests',
        requestId: 'cm5qx01lh0013b2ek2sxl4w00',
        context: {},
      });
  }

  return scope
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
      (body) =>
        (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound1Input).type === 'round1Input'
    )
    .reply(200, async (_uri: string, body: SignatureShareApiBody) => {
      const parsedShare = JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound1Input;
      const userMsg1Bytes = Buffer.from(parsedShare.data.msg1.message, 'base64');
      const userDeserializedMsg1: MPSTypes.DeserializedMessage = {
        from: signerPartyId,
        payload: new Uint8Array(userMsg1Bytes),
      };
      const [bitgoMsg2] = bitgoSession.handleIncomingMessages([bitgoMsg1, userDeserializedMsg1]);
      saveBitgoMsg2(bitgoMsg2);

      const bitgoSignedMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
      const round1Output: EddsaMPCv2SignatureShareRound1Output = {
        type: 'round1Output',
        data: { msg1: bitgoSignedMsg1 },
      };
      const resource = requestType === RequestType.message ? 'messages' : 'transactions';
      return {
        txRequestId: txRequest.txRequestId,
        [resource]: [
          {
            signatureShares: [
              {
                from: SignatureShareType.BITGO,
                to: signerShareType,
                share: JSON.stringify(round1Output),
              },
            ],
          },
        ],
      };
    });
}

async function nockTxRequestResponseSignatureShareRoundTwo(
  txRequest: TxRequest,
  getBitgoMsg2: () => MPSTypes.DeserializedMessage,
  bitgoGpgPrivKey: openpgp.PrivateKey,
  requestType: RequestType = RequestType.tx,
  rateLimitErrorCount = 0,
  signerPartyId: ECDSAUtils.MPCv2PartiesEnum = MPCv2PartiesEnum.USER
): Promise<nock.Scope> {
  const route = requestType === RequestType.message ? '/messages/0' : '/transactions/0';
  const scope = nock('https://bitgo.fakeurl');
  const signerShareType = signerPartyId === MPCv2PartiesEnum.USER ? SignatureShareType.USER : SignatureShareType.BACKUP;

  if (rateLimitErrorCount > 0) {
    scope
      .post(
        `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
        (body) =>
          (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound2Input).type === 'round2Input'
      )
      .times(rateLimitErrorCount)
      .reply(429, {
        error: 'Too many requests, slow down!',
        name: 'TooManyRequests',
        requestId: 'cm5qx01lh0013b2ek2sxl4w00',
        context: {},
      });
  }

  return scope
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
      (body) =>
        (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound2Input).type === 'round2Input'
    )
    .reply(200, async () => {
      const bitgoMsg2 = getBitgoMsg2();
      const bitgoSignedMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);
      const round2Output: EddsaMPCv2SignatureShareRound2Output = {
        type: 'round2Output',
        data: { msg2: bitgoSignedMsg2 },
      };
      const resource = requestType === RequestType.message ? 'messages' : 'transactions';
      return {
        txRequestId: txRequest.txRequestId,
        [resource]: [
          {
            signatureShares: [
              {
                from: signerShareType,
                to: SignatureShareType.BITGO,
                share: 'placeholder',
              },
              {
                from: SignatureShareType.BITGO,
                to: signerShareType,
                share: JSON.stringify(round2Output),
              },
            ],
          },
        ],
      };
    });
}

async function nockTxRequestResponseSignatureShareRoundThree(
  txRequest: TxRequest,
  requestType: RequestType = RequestType.tx,
  signerPartyId: ECDSAUtils.MPCv2PartiesEnum = MPCv2PartiesEnum.USER,
  rateLimitErrorCount = 0,
  malformedResponse = false
): Promise<nock.Scope> {
  const route = requestType === RequestType.message ? '/messages/0' : '/transactions/0';
  const signerShareType = signerPartyId === MPCv2PartiesEnum.USER ? SignatureShareType.USER : SignatureShareType.BACKUP;
  const scope = nock('https://bitgo.fakeurl');

  if (rateLimitErrorCount > 0) {
    scope
      .post(
        `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
        (body: SignatureShareApiBody) =>
          (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound3Input).type === 'round3Input'
      )
      .times(rateLimitErrorCount)
      .reply(429, {
        error: 'Too many requests, slow down!',
        name: 'TooManyRequests',
        requestId: 'cm5qx01lh0013b2ek2sxl4w00',
        context: {},
      });
  }

  return scope
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/sign`,
      (body: SignatureShareApiBody) =>
        (JSON.parse(body.signatureShares[0].share) as EddsaMPCv2SignatureShareRound3Input).type === 'round3Input'
    )
    .reply(
      200,
      malformedResponse
        ? { txRequestId: `${txRequest.txRequestId}-unexpected` }
        : {
            txRequestId: txRequest.txRequestId,
            signatureShares: [
              {
                from: signerShareType,
                to: SignatureShareType.BITGO,
                share: 'placeholder',
              },
            ],
          }
    );
}

async function nockSendTxRequest(txRequest: TxRequest, requestType: RequestType = RequestType.tx): Promise<nock.Scope> {
  const route = requestType === RequestType.message ? '/messages/0' : '/transactions/0';
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId}${route}/send`)
    .reply(200, {
      txRequestId: txRequest.txRequestId,
    });
}
