import * as assert from 'assert';
import * as sinon from 'sinon';
import { Hash, randomBytes } from 'crypto';
import createKeccakHash from 'keccak';
import {
  MPCv2PartyFromStringOrNumber,
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import { DklsComms, DklsDsg, DklsTypes, DklsUtils } from '@bitgo/sdk-lib-mpc';
import * as sjcl from '@bitgo/sjcl';
import {
  BitGoBase,
  EcdsaMPCv2Utils,
  IBaseCoin,
  SignatureShareRecord,
  SignatureShareType,
  TxRequest,
} from '../../../../../../src';
import { bitgoGpgKey } from './gpgKeys';

describe('ECDSA MPC v2', async () => {
  let userShare: Buffer;
  let bitgoShare: Buffer;

  before('generate key shares for testing', async () => {
    const [userDkgSession, backupDkgSession, bitgoDkgSession] = await DklsUtils.generateDKGKeyShares();
    assert.ok(userDkgSession);
    assert.ok(backupDkgSession);
    assert.ok(bitgoDkgSession);

    userShare = userDkgSession.getKeyShare();
    bitgoShare = bitgoDkgSession.getKeyShare();
  });

  let ecdsaMPCv2Utils: EcdsaMPCv2Utils;

  before('initialize EcdsaMPCv2Utils', async () => {
    const mockBg = {} as BitGoBase;
    mockBg.getEnv = sinon.stub().returns('test');
    mockBg.encrypt = sinon.stub().callsFake((params) => {
      const salt = randomBytes(8);
      const iv = randomBytes(16);
      return sjcl.encrypt(params.password, params.input, {
        salt: [bytesToWord(salt.subarray(0, 4)), bytesToWord(salt.subarray(4))],
        iv: [
          bytesToWord(iv.subarray(0, 4)),
          bytesToWord(iv.subarray(4, 8)),
          bytesToWord(iv.subarray(8, 12)),
          bytesToWord(iv.subarray(12, 16)),
        ],
        adata: params.adata,
      });
    });
    mockBg.decrypt = sinon.stub().callsFake((params) => {
      return sjcl.decrypt(params.password, params.input);
    });

    const mockCoin = {} as IBaseCoin;
    mockCoin.getHashFunction = sinon.stub().callsFake(() => createKeccakHash('keccak256') as Hash);

    ecdsaMPCv2Utils = new EcdsaMPCv2Utils(mockBg, mockCoin);
  });

  const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
  const walletPassphrase = 'testPass';

  it('should sign a message hash using ECDSA MPC v2 offline rounds', async () => {
    const tMessage = 'testMessage';
    const derivationPath = 'm/0';

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('userGpgPubKey');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    const hashBuffer = createKeccakHash('keccak256').update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound2.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const encryptedRound2Session = resMPCv2SigningRound2.encryptedRound2Session;

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );
    bitgoMsg4.should.have.property('signatureR');

    // round 3
    const reqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null, // not needed for round 3
      encryptedRound2Session,
    };

    const resMPCv2SigningRound3 = await ecdsaMPCv2Utils.createOfflineRound3Share(reqMPCv2SigningRound3 as any);
    resMPCv2SigningRound3.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      resMPCv2SigningRound3.signatureShareRound3,
      resMPCv2SigningRound1.userGpgPubKey
    );

    // signature generation and validation
    assert.ok(userMsg4.data.msg4.signatureR === bitgoMsg4.signatureR, 'User and BitGo signaturesR do not match');

    const deserializedBitgoMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [bitgoMsg4],
    });

    const deserializedUserMsg4 = DklsTypes.deserializeMessages({
      p2pMessages: [],
      broadcastMessages: [
        {
          from: userMsg4.data.msg4.from,
          payload: userMsg4.data.msg4.message,
        },
      ],
    });

    const combinedSigUsingUtil = DklsUtils.combinePartialSignatures(
      [deserializedUserMsg4.broadcastMessages[0].payload, deserializedBitgoMsg4.broadcastMessages[0].payload],
      Buffer.from(userMsg4.data.msg4.signatureR, 'base64').toString('hex')
    );

    const convertedSignature = DklsUtils.verifyAndConvertDklsSignature(
      Buffer.from(tMessage, 'hex'),
      combinedSigUsingUtil,
      DklsTypes.getCommonKeychain(userShare),
      derivationPath,
      createKeccakHash('keccak256') as Hash
    );
    assert.ok(convertedSignature, 'Signature is not valid');
    assert.ok(convertedSignature.split(':').length === 4, 'Signature is not valid');
  });

  it('should fail to sign using session after round 1 when session after round 2 is expected', async () => {
    const tMessage = 'testMessage';
    const derivationPath = 'm/1/2';

    // round 1
    const reqMPCv2SigningRound1 = {
      txRequest: {
        txRequestId: '123456',
        apiVersion: 'full',
        walletId: walletID,
        transactions: [
          {
            unsignedTx: {
              derivationPath,
              signableHex: tMessage,
            },
            signatureShares: [],
          },
        ],
      },
      prv: userShare.toString('base64'),
      walletPassphrase,
    };

    const resMPCv2SigningRound1 = await ecdsaMPCv2Utils.createOfflineRound1Share(reqMPCv2SigningRound1 as any);
    resMPCv2SigningRound1.should.have.property('signatureShareRound1');
    resMPCv2SigningRound1.should.have.property('userGpgPubKey');
    resMPCv2SigningRound1.should.have.property('encryptedRound1Session');
    resMPCv2SigningRound1.should.have.property('encryptedUserGpgPrvKey');

    const encryptedRound1Session = resMPCv2SigningRound1.encryptedRound1Session;
    const encryptedUserGpgPrvKey = resMPCv2SigningRound1.encryptedUserGpgPrvKey;

    const hashBuffer = createKeccakHash('keccak256').update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare, 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2SigningRound1.txRequest as any,
      resMPCv2SigningRound1.signatureShareRound1,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound2.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2SigningRound2 = {
      ...reqMPCv2SigningRound1,
      txRequest: txRequestRound1,
      encryptedRound1Session,
      encryptedUserGpgPrvKey,
      bitgoPublicGpgKey: bitgoGpgKey.public,
    };

    const resMPCv2SigningRound2 = await ecdsaMPCv2Utils.createOfflineRound2Share(reqMPCv2SigningRound2 as any);
    resMPCv2SigningRound2.should.have.property('signatureShareRound2');
    resMPCv2SigningRound2.should.have.property('encryptedRound2Session');

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2SigningRound2.txRequest,
      resMPCv2SigningRound2.signatureShareRound2,
      resMPCv2SigningRound1.userGpgPubKey
    );
    assert.ok(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );
    bitgoMsg4.should.have.property('signatureR');

    // A bogus round 3 signing request containing encrypted session from round 1 instead of round 2 should fail.
    const bogusReqMPCv2SigningRound3 = {
      ...reqMPCv2SigningRound2,
      txRequest: txRequestRound2,
      encryptedRound1Session: null, // not needed for round 3
      encryptedRound2Session: encryptedRound1Session, // instaed of resMPCv2SigningRound2.encryptedRound2Session
    };

    await ecdsaMPCv2Utils
      .createOfflineRound3Share(bogusReqMPCv2SigningRound3 as any)
      .should.be.rejectedWith('Adata does not match cyphertext adata');
  });
});

function bytesToWord(bytes?: Uint8Array | number[]): number {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 4) {
    throw new Error('bytes must be a Uint8Array with length 4');
  }

  return bytes.reduce((num, byte) => num * 0x100 + byte, 0);
}

function getUserPartyGpgKeyPublic(userPubKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: userPubKey,
  };
}

function getBitGoPartyGpgKeyPrv(bitgoPrvKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: bitgoPrvKey,
  };
}

async function signBitgoMPCv2Round1(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<TxRequest> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions is not an array of length 1'
  );
  txRequest.transactions[0].signatureShares.push(userShare);
  // Do the actual signing on BitGo's side based on User's messages
  const signatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound1Input;
  const deserializedMessages = DklsTypes.deserializeMessages({
    p2pMessages: [],
    broadcastMessages: [
      {
        from: signatureShare.data.msg1.from,
        payload: signatureShare.data.msg1.message,
      },
    ],
  });
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
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
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
  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoToUserSignatureShare),
  });
  return txRequest;
}

async function signBitgoMPCv2Round2(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<{ txRequest: TxRequest; bitgoMsg4: DklsTypes.SerializedBroadcastMessage }> {
  assert.ok(
    txRequest.transactions && txRequest.transactions.length === 1,
    'txRequest.transactions is not an array of length 1'
  );
  txRequest.transactions[0].signatureShares.push(userShare);

  // Do the actual signing on BitGo's side based on User's messages
  const parsedSignatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound2Input;
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
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );
  const deserializedMessages2 = DklsTypes.deserializeMessages({
    p2pMessages: [serializedMessages.p2pMessages[0]],
    broadcastMessages: [],
  });

  const bitgoToUserRound3Msg = bitgoSession.handleIncomingMessages(deserializedMessages2);
  const serializedBitGoToUserRound3Msgs = DklsTypes.serializeMessages(bitgoToUserRound3Msg);

  const authEncMessages = await DklsComms.encryptAndAuthOutgoingMessages(
    serializedBitGoToUserRound3Msgs,
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
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

  // handling user msg3 but not returning bitgo msg4 since its stored on bitgo side only
  const deserializedMessages3 = DklsTypes.deserializeMessages({
    p2pMessages: [serializedMessages.p2pMessages[1]],
    broadcastMessages: [],
  });
  const deserializedBitgoMsg4 = bitgoSession.handleIncomingMessages(deserializedMessages3);
  const serializedBitGoToUserRound4Msgs = DklsTypes.serializeMessages(deserializedBitgoMsg4);

  txRequest.transactions[0].signatureShares.push({
    from: SignatureShareType.BITGO,
    to: SignatureShareType.USER,
    share: JSON.stringify(bitgoToUserSignatureShare),
  });
  return { txRequest, bitgoMsg4: serializedBitGoToUserRound4Msgs.broadcastMessages[0] };
}

async function signBitgoMPCv2Round3(
  bitgoSession: DklsDsg.Dsg,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<{ userMsg4: MPCv2SignatureShareRound3Input }> {
  const parsedSignatureShare = JSON.parse(userShare.share) as MPCv2SignatureShareRound3Input;
  const msg4 = parsedSignatureShare.data.msg4;
  const signatureRAuthMessage =
    msg4.signatureR && msg4.signatureRSignature
      ? { message: msg4.signatureR, signature: msg4.signatureRSignature }
      : undefined;
  const serializedMessages = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [],
      broadcastMessages: [
        {
          from: msg4.from,
          payload: {
            message: msg4.message,
            signature: msg4.signature,
          },
          signatureR: signatureRAuthMessage,
        },
      ],
    },
    [getUserPartyGpgKeyPublic(userGPGPubKey)],
    [getBitGoPartyGpgKeyPrv(bitgoGpgKey.private)]
  );
  const deserializedMessages = DklsTypes.deserializeMessages({
    p2pMessages: [],
    broadcastMessages: [serializedMessages.broadcastMessages[0]],
  });
  bitgoSession.handleIncomingMessages(deserializedMessages);

  return {
    userMsg4: parsedSignatureShare,
  };
}
