/**
 * @prettier
 */

import { common, Ed25519BIP32, Eddsa, Ecdsa, HDTree, SignatureShareType, ShareKeyPosition } from '@bitgo/sdk-core';
import { Hash } from 'crypto';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as should from 'should';
import * as sinon from 'sinon';
import { EcdsaPaillierProof, EcdsaTypes, hexToBigInt } from '@bitgo/sdk-lib-mpc';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';
import { handleV2GenerateShareTSS, handleV2Sign } from '../../../src/clientRoutes';
import { fetchKeys } from '../../../src/fetchEncryptedPrivKeys';
import * as fs from 'fs';
import { mockChallengeA, mockChallengeB } from './mocks/ecdsaNtilde';
import { Coin, BitGo, SignedTransaction } from 'bitgo';
import * as nock from 'nock';
import { keyShareOneEcdsa, keyShareTwoEcdsa, keyShareThreeEcdsa } from './mocks/keyShares';
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

    const bitgoPublicKey =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nxk8EZIol0hMFK4EEAAoCAwTBJZKgCNfBZuD5AgIDM2hQky3Iw3T6EITaMnW2\nG9uKxFadVpslF0Dyp+kieW7JYPffUzSI+mCR7L/4rSsnLLHszRZiaXRnbyA8\nYml0Z29AdGVzdC5jb20+wowEEBMIAB0FAmSKJdIECwkHCAMVCAoEFgACAQIZ\nAQIbAwIeAQAhCRAL9sROnSoDRhYhBEFZxeQAYNOvaj3GZAv2xE6dKgNGj7MB\nAOJBnZqaWPway3B4fNB/Mi0v1wb9d2uDD28SgzzpsV/YAP90cryseKMF+dKw\n+to1vXTl8xb49cIU9gvcJYLqYUd+Fs5TBGSKJdISBSuBBAAKAgMErB+qJoUf\nvTyMP/9GGNsHY7ykqbwi/QYjim4bR560TyRQ8LKaxGwHN/1cbq4iQt45lYK2\nWpNQovBJ6U3DwKUFnQMBCAfCeAQYEwgACQUCZIol0gIbDAAhCRAL9sROnSoD\nRhYhBEFZxeQAYNOvaj3GZAv2xE6dKgNGSA8A/25BLEgyRERJFlDvGnavxRKu\nhHHV6kyzK9speNeTs1vzAP0cFkbE5Kvg6Xz9lag+cr6rFwrHC8m7znTbrbHq\n6eOi3w==\n=XFoJ\n-----END PGP PUBLIC KEY BLOCK-----\n';
    const constants = {
      mpc: {
        bitgoPublicKey,
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
