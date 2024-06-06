import { Hash } from 'crypto';
import {
  BaseCoin,
  BitgoGPGPublicKey,
  common,
  ECDSAUtils,
  RequestTracer,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
  Wallet,
} from '@bitgo/sdk-core';
import { DklsDsg, DklsTypes, DklsComms } from '@bitgo/sdk-lib-mpc';
import * as fs from 'fs';
import { getRoute } from '../common';
import {
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
  MPCv2PartyFromStringOrNumber,
} from '@bitgo/public-types';
import * as openpgp from 'openpgp';
import * as nock from 'nock';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../../src';
const createKeccakHash = require('keccak');

interface SignatureShareApiBody {
  signatureShares: SignatureShareRecord[];
  signerGpgPublicKey: string;
}

describe('signTxRequest:', function () {
  let tssUtils: ECDSAUtils.EcdsaMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitgoGpgKey: openpgp.SerializedKeyPair<string>;
  const coinName = 'hteth';

  const reqId = new RequestTracer();
  const txRequestId = 'randomTxReqId';
  const signableHex = 'e27aecaea559fbedc9ae8a22b0ab6654c2d686403c2aeb434b302545c94eed3b';
  const txRequest: TxRequest = {
    txRequestId,
    enterpriseId: '4517abfb-f567-4b7a-9f91-407509d29403',
    transactions: [
      {
        unsignedTx: {
          serializedTxHex: 'TOO MANY SECRETS',
          signableHex,
          derivationPath: 'm/0', // Needs this when key derivation is supported
        },
        state: 'pendingSignature',
        signatureShares: [],
      },
    ],
    unsignedTxs: [],
    date: new Date().toISOString(),
    intent: {
      intentType: 'payment',
    },
    latest: true,
    state: 'pendingUserSignature',
    walletType: 'hot',
    walletId: 'walletId',
    policiesChecked: true,
    version: 1,
    userId: 'userId',
    apiVersion: 'full',
  };

  const vector = {
    party1: 0,
    party2: 2,
  };
  // To generate the fixtures, run DKG as in the dklsDkg.ts tests and save the resulting party.getKeyShare in a file by doing fs.writeSync(party.getKeyShare()).
  const shareFiles = [
    `${__dirname}/fixtures/userShare`,
    `${__dirname}/fixtures/backupShare`,
    `${__dirname}/fixtures/bitgoShare`,
  ];

  let bitgoParty: DklsDsg.Dsg;

  before(async () => {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    bitgoGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
        },
      ],
      curve: 'secp256k1',
    });
    const constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKey.publicKey,
        bitgoMPCv2PublicKey: bitgoGpgKey.publicKey,
      },
    };
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, txRequest.enterpriseId!, bitgoGpgKey);
    nock(bgUrl).get('/api/v1/client/constants').times(20).reply(200, { ttl: 3600, constants });

    baseCoin = bitgo.coin(coinName);

    let hashFn: Hash;
    try {
      hashFn = baseCoin.getHashFunction();
    } catch (err) {
      hashFn = createKeccakHash('keccak256') as Hash;
    }
    const hashBuffer = hashFn.update(Buffer.from(signableHex, 'hex')).digest();

    // Nock out both the user and bitgo side responses to create valid signatures
    bitgoParty = new DklsDsg.Dsg(
      fs.readFileSync(shareFiles[vector.party2]),
      vector.party2,
      txRequest.transactions![0].unsignedTx.derivationPath,
      hashBuffer
    );
    // // Round 1 ////
    const walletData = {
      id: txRequest.walletId,
      enterprise: txRequest.enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
      multisigTypeVersion: 'MPCv2',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaMPCv2Utils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  it('successfully signs a txRequest for a dkls hot wallet with WP', async function () {
    const nockPromises = [
      await nockTxRequestResponseSignatureShareRoundOne(bitgoParty, txRequest, bitgoGpgKey),
      await nockTxRequestResponseSignatureShareRoundTwo(bitgoParty, txRequest, bitgoGpgKey),
      await nockTxRequestResponseSignatureShareRoundThree(txRequest),
      await nockSendTxRequest(txRequest),
    ];
    await Promise.all(nockPromises);

    const userShare = fs.readFileSync(shareFiles[vector.party1]);
    const userPrvBase64 = Buffer.from(userShare).toString('base64');
    await tssUtils.signTxRequest({
      txRequest,
      prv: userPrvBase64,
      reqId,
    });
    nockPromises[0].isDone().should.be.true();
    nockPromises[1].isDone().should.be.true();
    nockPromises[2].isDone().should.be.true();
  });
});

export function getBitGoPartyGpgKeyPrv(key: openpgp.SerializedKeyPair<string>): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: key.privateKey,
  };
}

export function getUserPartyGpgKeyPublic(userPubKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: userPubKey,
  };
}

async function nockTxRequestResponseSignatureShareRoundOne(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  bitgoGpgKey: openpgp.SerializedKeyPair<string>
): Promise<nock.Scope> {
  const transactions = getRoute('ecdsa');
  return nock('https://bitgo.fakeurl')
    .persist(true)
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId + transactions}/sign`,
      (body) => (JSON.parse(body.signatureShares[0].share) as MPCv2SignatureShareRound1Input).type === 'round1Input'
    )
    .times(1)
    .reply(200, async (uri, body: SignatureShareApiBody) => {
      // Do the actual signing on BitGo's side based on User's messages
      const signatureShare = JSON.parse(body.signatureShares[0].share) as MPCv2SignatureShareRound1Input;
      const deserializedMessages = DklsTypes.deserializeMessages({
        p2pMessages: [],
        broadcastMessages: [
          {
            from: signatureShare.data.msg1.from,
            payload: signatureShare.data.msg1.message,
          },
        ],
      });
      if (signatureShare.type === 'round1Input') {
        const bitgoToUserRound1BroadcastMsg = await bitgoSession.init();
        const bitgoToUserRound2Msg = bitgoSession.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: deserializedMessages.broadcastMessages,
        });
        const serializedBitGoToUserRound1And2Msgs = DklsTypes.serializeMessages({
          p2pMessages: bitgoToUserRound2Msg.p2pMessages,
          broadcastMessages: [bitgoToUserRound1BroadcastMsg],
        });

        const authEncMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          serializedBitGoToUserRound1And2Msgs,
          [getUserPartyGpgKeyPublic(body.signerGpgPublicKey)],
          [getBitGoPartyGpgKeyPrv(bitgoGpgKey)]
        );

        const bitgoToUserSignatureShare: MPCv2SignatureShareRound1Output = {
          type: 'round1Output',
          data: {
            msg1: {
              from: authEncMessages.broadcastMessages[0].from as MPCv2PartyFromStringOrNumber,
              signature: authEncMessages.broadcastMessages[0].payload.signature,
              message: authEncMessages.broadcastMessages[0].payload.message,
            },
            msg2: {
              from: authEncMessages.p2pMessages[0].from as MPCv2PartyFromStringOrNumber,
              to: authEncMessages.p2pMessages[0].to as MPCv2PartyFromStringOrNumber,
              encryptedMessage: authEncMessages.p2pMessages[0].payload.encryptedMessage,
              signature: authEncMessages.p2pMessages[0].payload.signature,
            },
          },
        };
        return {
          txRequestId: txRequest.txRequestId,
          transactions: [
            {
              signatureShares: [
                {
                  from: SignatureShareType.BITGO,
                  to: SignatureShareType.USER,
                  share: JSON.stringify(bitgoToUserSignatureShare),
                },
              ],
            },
          ],
        };
      }
    });
}

async function nockTxRequestResponseSignatureShareRoundTwo(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  bitgoGpgKey: openpgp.SerializedKeyPair<string>
): Promise<nock.Scope> {
  const transactions = getRoute('ecdsa');
  return nock('https://bitgo.fakeurl')
    .persist(true)
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId + transactions}/sign`,
      (body) => (JSON.parse(body.signatureShares[0].share) as MPCv2SignatureShareRound2Input).type === 'round2Input'
    )
    .times(1)
    .reply(200, async (uri, body: SignatureShareApiBody) => {
      // Do the actual signing on BitGo's side based on User's messages
      const parsedSignatureShare = JSON.parse(body.signatureShares[0].share) as MPCv2SignatureShareRound2Input;
      const serializedMessages = await DklsComms.decryptAndVerifyIncomingMessages(
        {
          p2pMessages: [
            {
              from: parsedSignatureShare.data.msg2.from,
              to: parsedSignatureShare.data.msg2.to,
              payload: {
                encryptedMessage: parsedSignatureShare.data.msg2.encryptedMessage,
                signature: parsedSignatureShare.data.msg2.signature,
              },
            },
            {
              from: parsedSignatureShare.data.msg3.from,
              to: parsedSignatureShare.data.msg3.to,
              payload: {
                encryptedMessage: parsedSignatureShare.data.msg3.encryptedMessage,
                signature: parsedSignatureShare.data.msg3.signature,
              },
            },
          ],
          broadcastMessages: [],
        },
        [getUserPartyGpgKeyPublic(body.signerGpgPublicKey)],
        [getBitGoPartyGpgKeyPrv(bitgoGpgKey)]
      );
      const deserializedMessages = DklsTypes.deserializeMessages({
        p2pMessages: [serializedMessages.p2pMessages[0]],
        broadcastMessages: [],
      });
      if (parsedSignatureShare.type === 'round2Input') {
        const bitgoToUserRound3Msg = bitgoSession.handleIncomingMessages(deserializedMessages);
        const serializedBitGoToUserRound3Msgs = DklsTypes.serializeMessages(bitgoToUserRound3Msg);

        const authEncMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          serializedBitGoToUserRound3Msgs,
          [getUserPartyGpgKeyPublic(body.signerGpgPublicKey)],
          [getBitGoPartyGpgKeyPrv(bitgoGpgKey)]
        );

        const bitgoToUserSignatureShare: MPCv2SignatureShareRound2Output = {
          type: 'round2Output',
          data: {
            msg3: {
              from: authEncMessages.p2pMessages[0].from as MPCv2PartyFromStringOrNumber,
              to: authEncMessages.p2pMessages[0].to as MPCv2PartyFromStringOrNumber,
              encryptedMessage: authEncMessages.p2pMessages[0].payload.encryptedMessage,
              signature: authEncMessages.p2pMessages[0].payload.signature,
            },
          },
        };
        return {
          txRequestId: txRequest.txRequestId,
          transactions: [
            {
              signatureShares: [
                {
                  from: SignatureShareType.USER,
                  to: SignatureShareType.BITGO,
                  share: 'some old share we dont care about',
                },
                {
                  from: SignatureShareType.BITGO,
                  to: SignatureShareType.USER,
                  share: JSON.stringify(bitgoToUserSignatureShare),
                },
              ],
            },
          ],
        };
      }
    });
}

async function nockTxRequestResponseSignatureShareRoundThree(txRequest: TxRequest): Promise<nock.Scope> {
  const transactions = getRoute('ecdsa');
  return nock('https://bitgo.fakeurl')
    .post(
      `/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId + transactions}/sign`,
      (body: SignatureShareApiBody) =>
        (JSON.parse(body.signatureShares[0].share) as MPCv2SignatureShareRound3Input).type === 'round3Input'
    )
    .times(1)
    .reply(200, async (uri, body) => {
      // Do the actual signing on BitGo's side based on User's messages

      return {
        txRequestId: txRequest.txRequestId,
      };
    });
}

async function nockSendTxRequest(txRequest: TxRequest): Promise<nock.Scope> {
  const transactions = getRoute('ecdsa');
  return nock('https://bitgo.fakeurl')
    .post(`/api/v2/wallet/${txRequest.walletId}/txrequests/${txRequest.txRequestId + transactions}/send`)
    .times(1)
    .reply(200, {
      txRequestId: txRequest.txRequestId,
    });
}

async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
  coin: string,
  enterpriseId: string,
  bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>
): Promise<BitgoGPGPublicKey> {
  const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
    name: 'irrelevant',
    publicKey: bitgoGpgKeyPair.publicKey,
    mpcv2PublicKey: bitgoGpgKeyPair.publicKey,
    enterpriseId,
  };
  nock('https://bitgo.fakeurl')
    .get(`/api/v2/${coin}/tss/pubkey`)
    .times(4)
    .query({ enterpriseId })
    .reply(200, bitgoGPGPublicKeyResponse);
  return bitgoGPGPublicKeyResponse;
}
