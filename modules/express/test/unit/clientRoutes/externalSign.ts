/**
 * @prettier
 */

import {
  common,
  Ed25519BIP32,
  Eddsa,
  Ecdsa,
  HDTree,
  SignatureShareType,
  ShareKeyPosition,
  TxRequest,
  SignatureShareRecord,
} from '@bitgo/sdk-core';
import { Hash } from 'crypto';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as should from 'should';
import * as sinon from 'sinon';
import {
  EcdsaPaillierProof,
  EcdsaTypes,
  hexToBigInt,
  DklsUtils,
  DklsTypes,
  DklsComms,
  DklsDsg,
} from '@bitgo/sdk-lib-mpc';
import {
  MPCv2PartyFromStringOrNumber,
  MPCv2SignatureShareRound1Input,
  MPCv2SignatureShareRound1Output,
  MPCv2SignatureShareRound2Input,
  MPCv2SignatureShareRound2Output,
  MPCv2SignatureShareRound3Input,
} from '@bitgo/public-types';
import * as assert from 'assert';
import * as nock from 'nock';
import * as fs from 'fs';
import * as express from 'express';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { handleV2GenerateShareTSS, handleV2Sign } from '../../../src/clientRoutes';
import { fetchKeys } from '../../../src/fetchEncryptedPrivKeys';
import { mockChallengeA, mockChallengeB } from './mocks/ecdsaNtilde';
import { Coin, BitGo, SignedTransaction } from 'bitgo';
import { keyShareOneEcdsa, keyShareTwoEcdsa, keyShareThreeEcdsa } from './mocks/keyShares';
import { bitgoGpgKey } from './mocks/gpgKeys';

const createKeccakHash = require('keccak');
nock.restore();

type Output = {
  [key: string]: string;
};

describe('External signer', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl;
  let MPC: Eddsa;
  let mpcEcdsa: Ecdsa;
  let hdTree: HDTree;

  const walletId = '61f039aad587c2000745c687373e0fa9';
  const walletPassword = 'wDX058%c4plL1@pP';
  const secret =
    'xprv9s21ZrQH143K3EuPWCBuqnWxydaQV6et9htQige4EswvcHKEzNmkVmwTwKoadyHzJYppuADB7Us7AbaNLToNvoFoSxuWqndQRYtnNy5DUY2';
  const validPrv =
    '{"61f039aad587c2000745c687373e0fa9":"{\\"iv\\":\\"+1u1Y9cvsYuRMeyH2slnXQ==\\",\\"v\\":1,\\"iter\\":10000,\\"ks\\":256,\\"ts\\":64,\\"mode\\":\\"ccm\\",\\"adata\\":\\"\\",\\"cipher\\":\\"aes\\",\\"salt\\":\\"54kOXTqJ9mc=\\",\\"ct\\":\\"JF5wQ82wa1dYyFxFlbHCvK4a+A6MTHdhOqc5uXsz2icWhkY2Lin/3Ab8ZwvwDaR1JYKmC/g1gXIGwVZEOl1M/bRHY420h7sDtmTS6Ebse5NWbF0ItfUJlk6HVATGa+C6mkbaVxJ4kQW/ehnT3riqzU069ATPz8E=\\"}"}';

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
    hdTree = await Ed25519BIP32.initialize();
    MPC = await Eddsa.initialize(hdTree);
    mpcEcdsa = new Ecdsa();

    const constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKey.public,
        bitgoMPCv2PublicKey: bitgoGpgKey.public,
      },
    };

    nock(bgUrl).get('/api/v1/client/constants').times(10).reply(200, { ttl: 3600, constants });
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to coin.signTransaction', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(validPrv);
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_61f039aad587c2000745c687373e0fa9_PASSPHRASE: walletPassword });
    const signTransactionStub = sinon
      .stub(Coin.Btc.prototype, 'signTransaction')
      .resolves({ txHex: 'signedTx', txRequestId: '' } as SignedTransaction);

    const req = {
      bitgo: bitgo,
      body: {
        txPrebuild: {
          walletId: walletId,
        },
      },
      params: {
        coin: 'tbtc',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;

    await handleV2Sign(req);

    readFileStub.calledOnceWith('signerFileSystemPath').should.be.true();
    signTransactionStub
      .calledOnceWith(
        sinon.match({
          prv: secret,
        })
      )
      .should.be.true();
    readFileStub.restore();
    signTransactionStub.restore();
    envStub.restore();
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to PaillierModulus, K, MuDelta, and S share generators', async () => {
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const user = keyShareOneEcdsa; // await mpcEcdsa.keyShare(1, 2, 3);
    const backup = keyShareTwoEcdsa; // await mpcEcdsa.keyShare(2, 2, 3);
    const bitgo = keyShareThreeEcdsa; // await mpcEcdsa.keyShare(3, 2, 3);
    const bitgoCombinedKey = await mpcEcdsa.keyCombine(bitgo.pShare, [backup.nShares[3], user.nShares[3]]);
    const userChallenge = mockChallengeA;
    const bitgoChallenge = mockChallengeB;
    const userSigningMaterial = {
      pShare: user.pShare,
      bitgoNShare: bitgo.nShares[1],
      backupNShare: backup.nShares[1],
    };
    const bg = new BitGo({ env: 'test' });
    const walletPassphrase = 'testPass';
    const validPrv = bg.encrypt({ input: JSON.stringify(userSigningMaterial), password: walletPassphrase });
    const output: Output = {};
    output[walletID] = validPrv;
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(output));
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_62fe536a6b4cf70007acb48c0e7bb0b0_PASSPHRASE: walletPassphrase });
    const tMessage = 'testMessage';
    const bgTest = new BitGo({ env: 'test' });
    const derivationPath = '';
    const reqPaillierModulus = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
      },
      params: {
        coin: 'tbsc',
        sharetype: 'PaillierModulus',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const paillierResult = await handleV2GenerateShareTSS(reqPaillierModulus);
    paillierResult.should.have.property('userPaillierModulus');
    const userPaillierModulus = paillierResult.userPaillierModulus;
    const [bitgoToUserPaillierChallenge, userToBitgoPaillierChallenge] = await Promise.all([
      EcdsaPaillierProof.generateP(hexToBigInt(userPaillierModulus)),
      EcdsaPaillierProof.generateP(hexToBigInt(bitgoCombinedKey.yShares[1].n)),
    ]);
    const reqK = {
      bitgo: bgTest,
      body: {
        tssParams: {
          txRequest: {
            apiVersion: 'full',
            walletId: walletID,
            transactions: [
              {
                unsignedTx: {
                  derivationPath,
                  signableHex: tMessage,
                },
              },
            ],
          },
        },
        challenges: {
          enterpriseChallenge: {
            ntilde: userChallenge.ntilde,
            h1: userChallenge.h1,
            h2: userChallenge.h2,
            p: EcdsaTypes.serializePaillierChallenge({ p: userToBitgoPaillierChallenge }).p,
          },
          bitgoChallenge: {
            ntilde: bitgoChallenge.ntilde,
            h1: bitgoChallenge.h1,
            h2: bitgoChallenge.h2,
            p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
            n: bitgo.pShare.n,
          },
        },
        requestType: 0,
      },
      params: {
        coin: 'tbsc',
        sharetype: 'K',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const kResult = await handleV2GenerateShareTSS(reqK);
    kResult.should.have.property('kShare');
    kResult.should.have.property('wShare');
    const aShareFromBitgo = await mpcEcdsa.signConvertStep1({
      xShare: mpcEcdsa.appendChallenge(
        bitgoCombinedKey.xShare,
        bitgoChallenge,
        EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge })
      ),
      yShare: bitgoCombinedKey.yShares[1],
      kShare: kResult.kShare,
    });
    const reqMuDelta = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        aShareFromBitgo: aShareFromBitgo.aShare,
        bitgoChallenge: {
          ntilde: bitgoChallenge.ntilde,
          h1: bitgoChallenge.h1,
          h2: bitgoChallenge.h2,
          p: EcdsaTypes.serializePaillierChallenge({ p: bitgoToUserPaillierChallenge }).p,
          n: bitgo.pShare.n,
        },
        encryptedWShare: kResult.wShare,
      },
      params: {
        coin: 'tbsc',
        sharetype: 'MuDelta',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const muDeltaResult = await handleV2GenerateShareTSS(reqMuDelta);
    muDeltaResult.should.have.property('muDShare');
    muDeltaResult.should.have.property('oShare');
    const bitgoGShare = await mpcEcdsa.signConvertStep3({
      bShare: aShareFromBitgo.bShare,
      muShare: muDeltaResult.muDShare.muShare,
    });
    const bitgoDShare = mpcEcdsa.signCombine({
      gShare: bitgoGShare.gShare,
      signIndex: {
        i: 1,
        j: 3,
      },
    });
    const reqS = {
      bitgo: bgTest,
      body: {
        tssParams: {
          txRequest: {
            apiVersion: 'full',
            walletId: walletID,
            transactions: [
              {
                unsignedTx: {
                  derivationPath,
                  signableHex: tMessage,
                },
              },
            ],
          },
        },
        dShareFromBitgo: bitgoDShare.dShare,
        requestType: 0,
        encryptedOShare: muDeltaResult.oShare,
      },
      params: {
        coin: 'tbsc',
        sharetype: 'S',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const sResult = await handleV2GenerateShareTSS(reqS);
    sResult.should.have.property('R');
    sResult.should.have.property('s');
    sResult.should.have.property('y');
    const bitGoSShare = mpcEcdsa.sign(
      Buffer.from(tMessage, 'hex'),
      bitgoDShare.oShare,
      muDeltaResult.muDShare.dShare,
      createKeccakHash('keccak256') as Hash
    );
    const signature = mpcEcdsa.constructSignature([bitGoSShare, sResult]);
    mpcEcdsa.verify(Buffer.from(tMessage, 'hex'), signature, createKeccakHash('keccak256') as Hash).should.be.true;
    readFileStub.restore();
    envStub.restore();
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to commitment, R and G share generators', async () => {
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const user = MPC.keyShare(1, 2, 3);
    const backup = MPC.keyShare(2, 2, 3);
    const bitgo = MPC.keyShare(3, 2, 3);
    const userSigningMaterial = {
      uShare: user.uShare,
      bitgoYShare: bitgo.yShares[1],
      backupYShare: backup.yShares[1],
    };
    const bg = new BitGo({ env: 'test' });
    const walletPassphrase = 'testPass';
    const validPrv = bg.encrypt({ input: JSON.stringify(userSigningMaterial), password: walletPassphrase });
    const output: Output = {};
    output[walletID] = validPrv;
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(output));
    const envStub = sinon
      .stub(process, 'env')
      .value({ WALLET_62fe536a6b4cf70007acb48c0e7bb0b0_PASSPHRASE: walletPassphrase });
    const tMessage = 'testMessage';
    const bgTest = new BitGo({ env: 'test' });
    const derivationPath = 'm/0';

    const reqCommitment = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
      },
      params: {
        coin: 'tsol',
        sharetype: 'commitment',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const cResult = await handleV2GenerateShareTSS(reqCommitment);
    cResult.should.have.property('userToBitgoCommitment');
    cResult.should.have.property('encryptedSignerShare');
    cResult.should.have.property('encryptedUserToBitgoRShare');
    const encryptedUserToBitgoRShare = cResult.encryptedUserToBitgoRShare;
    const reqR = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        encryptedUserToBitgoRShare,
      },
      params: {
        coin: 'tsol',
        sharetype: 'R',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const rResult = await handleV2GenerateShareTSS(reqR);
    rResult.should.have.property('rShare');

    const signingKey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      derivationPath
    );

    const bitgoCombine = MPC.keyCombine(bitgo.uShare, [signingKey.yShares[3], backup.yShares[3]]);
    const bitgoSignShare = await MPC.signShare(Buffer.from(tMessage, 'hex'), bitgoCombine.pShare, [
      bitgoCombine.jShares[1],
    ]);
    const signatureShareRec = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: bitgoSignShare.rShares[1].r + bitgoSignShare.rShares[1].R,
    };
    const bitgoToUserCommitmentShare = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: bitgoSignShare.rShares[1].commitment,
      type: 'commitment',
    };
    const reqG = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath,
                signableHex: tMessage,
              },
            },
          ],
        },
        userToBitgoRShare: rResult.rShare,
        bitgoToUserRShare: signatureShareRec,
        bitgoToUserCommitment: bitgoToUserCommitmentShare,
      },
      params: {
        coin: 'tsol',
        sharetype: 'G',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const userGShare = await handleV2GenerateShareTSS(reqG);
    userGShare.should.have.property('i');
    userGShare.should.have.property('y');
    userGShare.should.have.property('gamma');
    userGShare.should.have.property('R');
    const userToBitgoRShare = {
      i: ShareKeyPosition.BITGO,
      j: ShareKeyPosition.USER,
      u: signingKey.yShares[3].u,
      v: rResult.rShare.rShares[3].v,
      r: rResult.rShare.rShares[3].r,
      R: rResult.rShare.rShares[3].R,
      commitment: rResult.rShare.rShares[3].commitment,
    };
    const bitgoGShare = MPC.sign(
      Buffer.from(tMessage, 'hex'),
      bitgoSignShare.xShare,
      [userToBitgoRShare],
      [backup.yShares[3]]
    );
    const signature = MPC.signCombine([userGShare, bitgoGShare]);
    const veriResult = MPC.verify(Buffer.from(tMessage, 'hex'), signature);
    veriResult.should.be.true();
    readFileStub.restore();
    envStub.restore();
  });

  it('should read an encrypted prv from signerFileSystemPath and pass it to MPCv2Round1, MPCv2Round2 and MPCv2Round3 share generators', async () => {
    const walletID = '62fe536a6b4cf70007acb48c0e7bb0b0';
    const tMessage = 'testMessage';
    const derivationPath = 'm/0';
    const walletPassphrase = 'testPass';

    const [userShare, backupShare, bitgoShare] = await DklsUtils.generateDKGKeyShares();
    assert(backupShare, 'backupShare is not defined');

    const bgTest = new BitGo({ env: 'test' });
    const userKeyShare = userShare.getKeyShare().toString('base64');
    const validPrv = bgTest.encrypt({ input: userKeyShare, password: walletPassphrase });
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify({ [walletID]: validPrv }));
    const envStub = sinon.stub(process, 'env').value({ ['WALLET_' + walletID + '_PASSPHRASE']: walletPassphrase });

    // round 1
    const reqMPCv2Round1 = {
      bitgo: bgTest,
      body: {
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
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round1',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const round1Result = await handleV2GenerateShareTSS(reqMPCv2Round1);
    round1Result.should.have.property('signatureShareRound1');
    round1Result.should.have.property('userGpgPubKey');
    round1Result.should.have.property('encryptedRound1Session');
    round1Result.should.have.property('encryptedUserGpgPrvKey');

    const hashFn = createKeccakHash('keccak256') as Hash;
    const hashBuffer = hashFn.update(Buffer.from(tMessage, 'hex')).digest();
    const bitgoSession = new DklsDsg.Dsg(bitgoShare.getKeyShare(), 2, derivationPath, hashBuffer);

    const txRequestRound1 = await signBitgoMPCv2Round1(
      bitgoSession,
      reqMPCv2Round1.body.txRequest,
      round1Result.signatureShareRound1,
      round1Result.userGpgPubKey
    );
    assert(
      txRequestRound1.transactions &&
        txRequestRound1.transactions.length === 1 &&
        txRequestRound1.transactions[0].signatureShares.length === 2,
      'txRequestRound2.transactions is not an array of length 1 with 2 signatureShares'
    );

    // round 2
    const reqMPCv2Round2 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound1,
        encryptedRound1Session: round1Result.encryptedRound1Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round2',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const round2Result = await handleV2GenerateShareTSS(reqMPCv2Round2);
    round2Result.should.have.property('signatureShareRound2');
    round2Result.should.have.property('encryptedRound2Session');

    const { txRequest: txRequestRound2, bitgoMsg4 } = await signBitgoMPCv2Round2(
      bitgoSession,
      reqMPCv2Round2.body.txRequest,
      round2Result.signatureShareRound2,
      round1Result.userGpgPubKey
    );
    assert(
      txRequestRound2.transactions &&
        txRequestRound2.transactions.length === 1 &&
        txRequestRound2.transactions[0].signatureShares.length === 4,
      'txRequestRound2.transactions is not an array of length 1 with 4 signatureShares'
    );

    // round 3
    const reqMPCv2Round3 = {
      bitgo: bgTest,
      body: {
        txRequest: txRequestRound2,
        encryptedRound2Session: round2Result.encryptedRound2Session,
        encryptedUserGpgPrvKey: round1Result.encryptedUserGpgPrvKey,
        bitgoPublicGpgKey: bitgoGpgKey.public,
      },
      params: {
        coin: 'hteth',
        sharetype: 'MPCv2Round3',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const round3Result = await handleV2GenerateShareTSS(reqMPCv2Round3);
    round3Result.should.have.property('signatureShareRound3');

    const { userMsg4 } = await signBitgoMPCv2Round3(
      bitgoSession,
      round3Result.signatureShareRound3,
      round1Result.userGpgPubKey
    );

    // signature generation and validation
    assert(userMsg4.data.msg4.signatureR === bitgoMsg4.signatureR, 'User and BitGo signaturesR do not match');

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
      DklsTypes.getCommonKeychain(userShare.getKeyShare()),
      derivationPath,
      createKeccakHash('keccak256') as Hash
    );
    assert(convertedSignature, 'Signature is not valid');
    assert(convertedSignature.split(':').length === 4, 'Signature is not valid');
    readFileStub.restore();
    envStub.restore();
  });

  it('should accept a local secret and password for a wallet', async () => {
    const accessToken = '';
    const walletIds = {
      tbtc: [
        {
          walletId,
          walletPassword,
          secret,
        },
      ],
    };

    const walletResult = {
      walletId,
      keys: [walletId, walletId, walletId],
    };

    const keyResult = {
      walletId,
    };

    nock(bgUrl).get(`/api/v2/tbtc/wallet/${walletId}`).reply(200, walletResult);
    nock(bgUrl).get(`/api/v2/tbtc/key/${walletId}`).reply(200, keyResult);

    const data = await fetchKeys(walletIds, accessToken);

    should.exist(data[walletId]);
    data[walletId].should.startWith('{"iv":"');
  });
});

// #region MPCv2 utils
function getBitGoPartyGpgKeyPrv(bitgoPrvKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 2,
    gpgKey: bitgoPrvKey,
  };
}

function getUserPartyGpgKeyPublic(userPubKey: string): DklsTypes.PartyGpgKey {
  return {
    partyId: 0,
    gpgKey: userPubKey,
  };
}

async function signBitgoMPCv2Round1(
  bitgoSession: DklsDsg.Dsg,
  txRequest: TxRequest,
  userShare: SignatureShareRecord,
  userGPGPubKey: string
): Promise<TxRequest> {
  assert(
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
  assert(
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
  const serializedMessages = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [],
      broadcastMessages: [
        {
          from: parsedSignatureShare.data.msg4.from,
          payload: {
            message: parsedSignatureShare.data.msg4.message,
            signature: parsedSignatureShare.data.msg4.signature,
          },
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
// #endregion
