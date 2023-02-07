/**
 * @prettier
 */

import { common, Ed25519BIP32, Eddsa, HDTree, SignatureShareType, ShareKeyPosition } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as should from 'should';
import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';
import { handleV2GenerateShareTSS, handleV2Sign } from '../../../src/clientRoutes';
import { fetchKeys } from '../../../src/fetchEncryptedPrivKeys';
import * as fs from 'fs';
import { Coin, BitGo, SignedTransaction } from 'bitgo';
import * as nock from 'nock';
nock.restore();

type Output = {
  [key: string]: string;
};

describe('External signer', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl;
  let MPC: Eddsa;
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

    readFileStub.should.be.calledOnceWith('signerFileSystemPath');
    signTransactionStub.should.be.calledOnceWith(
      sinon.match({
        prv: secret,
      })
    );
    readFileStub.restore();
    signTransactionStub.restore();
    envStub.restore();
  });
  it('should read an encrypted prv from signerFileSystemPath and pass it to R and G share generators', async () => {
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
    const reqR = {
      bitgo: bgTest,
      body: {
        txRequest: {
          apiVersion: 'full',
          walletId: walletID,
          transactions: [
            {
              unsignedTx: {
                derivationPath: 'm/0',
                signableHex: tMessage,
              },
            },
          ],
        },
      },
      params: {
        coin: 'tsol',
        sharetype: 'R',
      },
      config: {
        signerFileSystemPath: 'signerFileSystemPath',
      },
    } as unknown as express.Request;
    const result = await handleV2GenerateShareTSS(reqR);
    const bitgoCombine = MPC.keyCombine(bitgo.uShare, [result.signingKeyYShare, backup.yShares[3]]);
    const bitgoSignShare = await MPC.signShare(Buffer.from(tMessage, 'hex'), bitgoCombine.pShare, [
      bitgoCombine.jShares[1],
    ]);
    const signatureShareRec = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: bitgoSignShare.rShares[1].r + bitgoSignShare.rShares[1].R,
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
                derivationPath: 'm/0',
                signableHex: tMessage,
              },
            },
          ],
        },
        userToBitgoRShare: result.rShare,
        bitgoToUserRShare: signatureShareRec,
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
    const userToBitgoRShare = {
      i: ShareKeyPosition.BITGO,
      j: ShareKeyPosition.USER,
      u: result.signingKeyYShare.u,
      r: result.rShare.rShares[3].r,
      R: result.rShare.rShares[3].R,
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
