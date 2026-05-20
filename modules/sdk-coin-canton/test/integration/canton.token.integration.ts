import { BitGoAPI } from '@bitgo/sdk-api';
import { ITransactionRecipient, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { CantonTokenTransferRawTxn, TokenTxParams } from '../resources';
import { CantonToken } from '../../src';

describe('Canton Token integration tests', function () {
  const tokenName = 'tcanton:testtoken';
  let bitgo: TestBitGoAPI;
  let basecoin: CantonToken;
  let newTxPrebuild: () => { txHex: string; txInfo: Record<string, unknown> };
  let newTxParams: () => { recipients: ITransactionRecipient[] };
  let wallet: Wallet;
  const txPrebuild = {
    txHex: CantonTokenTransferRawTxn,
    txInfo: {},
  };
  const txParams = {
    recipients: [
      {
        address: TokenTxParams.RECIPIENT_ADDRESS,
        amount: TokenTxParams.AMOUNT,
        tokenName: TokenTxParams.TOKEN,
      },
    ],
  };
  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    CantonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    basecoin = bitgo.coin(tokenName) as CantonToken;
    newTxPrebuild = () => {
      return structuredClone(txPrebuild);
    };
    newTxParams = () => {
      return structuredClone(txParams);
    };
    wallet = new Wallet(bitgo, basecoin, {});
  });

  describe('Verify Transaction', function () {
    it('should verify token transfer transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const isTxnVerifies = await basecoin.verifyTransaction({ txPrebuild: txPrebuild, txParams: txParams, wallet });
      isTxnVerifies.should.equal(true);
    });
  });
});
