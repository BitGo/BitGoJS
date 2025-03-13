import * as nock from 'nock';

import { Environments, Wallet } from '@bitgo/sdk-core';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';

import { BitGo } from '../../../src';

describe('Sweep', function () {
  const bitgo: TestableBG & BitGo = TestBitGo.decorate(BitGo, { env: 'test' });
  const bgUrl: string = Environments[bitgo.getEnv()].uri;

  before(async function () {
    bitgo.initializeTestVars();
  });

  describe('UTXO Wallet Sweep', function () {
    const coin = 'tbtc';
    const walletId = '65f060a22df7cd8a42958441d4e90a45';
    const wallet = new Wallet(bitgo, bitgo.coin(coin), { id: walletId, coin, multisigType: 'on-chain' });

    it('should validate that unsigned tx is sending funds to the appropriate destination', async function () {
      nock(bgUrl)
        .post(`/api/v2/${coin}/wallet/${walletId}/sweepWallet`)
        .reply(200, {
          txHex:
            // sweeping to 2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h
            '70736274ff01005301000000012e84a0661618f87d6a29b0239ed5b69782cb3ebb44a934029016d5b31a6be7de0100000000fdffffff01776c09000000000017a914896040625abcb130b3b01d7c0a3efee8dafed29a87000000004f010488b21e0000000000000000005d22e62de8d09d953462d4c03d60ee430bc8aee480f5417f4e66e4868c79209e0399d39cd40e0a03ba08a780686bc6af4dddf60afc29748f2a07f4fbec3b19e56d0468bed4264f010488b21e00000000000000000068aa84a41f6beaa95b67474c860714342b63fbcc2788fdbd77193944f8e0fd1d032c7af9680a3720d9e58e6473cc3b40bf305b210e676f60350ba7fd4fb7a3c9f6049e7b42d74f010488b21e000000000000000000f1745bc60d7085d053a69dc383dbe7b0bd165719051cd8172dd0101b0c01fb5302da5576d73fd458b0cc6111cb5471b402f83c9cef7db9ec0a9b7be2526b2588b104d9f69dee0001012b7992090000000000225120c98fbddc8c1e8975020f999bbac12eeb9916f1d727249b20dad051d7eb1f4dc8010304000000002116434a6534ea1565760d2a0c8ae658f30677b08ca3bc31c81c4495e6b327bf1c9d150068bed4260000000000000000290000000600000021165972ebee31ac0428f620b59c45156c916e44d5751f25102bec19132113b98cd815009e7b42d700000000000000002900000006000000011720918aea677d8aa2808bec883a50ca068304d93d6b650fe34e39a14b8071a9dec9011820695c95ba51589e650e8cdfa64b45ca51dd4c80556ec63e26f1fe10c2a09eb77e48fc05424954474f01c98fbddc8c1e8975020f999bbac12eeb9916f1d727249b20dad051d7eb1f4dc8918aea677d8aa2808bec883a50ca068304d93d6b650fe34e39a14b8071a9dec942035972ebee31ac0428f620b59c45156c916e44d5751f25102bec19132113b98cd803434a6534ea1565760d2a0c8ae658f30677b08ca3bc31c81c4495e6b327bf1c9d0000',
          txInfo: {
            nP2shInputs: 0,
            nP2shP2wshInputs: 0,
            nP2wshInputs: 0,
            nP2trKeypathInputs: 1,
            nP2trScriptPathLevel1Inputs: 0,
            nP2trScriptPathLevel2Inputs: 0,
            nP2shP2pkInputs: 0,
            outputs: {
              count: 1,
              size: 32,
            },
            txHexes: {},
          },
          feeInfo: {
            size: 101,
            fee: 9730,
            feeRate: 96337,
            feeString: '9730',
            payGoFee: 0,
            payGoFeeString: '0',
          },
          debug: {
            dimensions: {
              nP2shInputs: 0,
              nP2shP2wshInputs: 0,
              nP2wshInputs: 0,
              nP2trKeypathInputs: 1,
              nP2trScriptPathLevel1Inputs: 0,
              nP2trScriptPathLevel2Inputs: 0,
              nP2shP2pkInputs: 0,
              outputs: {
                count: 1,
                size: 32,
              },
            },
          },
        });

      await wallet
        .sweep({ address: '2MwjK5Feadno84NqHhMY628eHeABHLE8d6U' })
        .should.be.rejectedWith(
          `invalid sweep destination 2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h, specified 2MwjK5Feadno84NqHhMY628eHeABHLE8d6U`
        );
    });
  });
});
