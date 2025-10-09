import { BitGoAPI } from '@bitgo/sdk-api';
import { ITransactionRecipient, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Nep141Token } from '../../src';
import * as testData from '../resources/near';

describe('Nep141Token', () => {
  const nep141TokenName = 'tnear:tnep24dp';
  let bitgo: TestBitGoAPI;
  let baseCoin: Nep141Token;
  let newTxPrebuild: () => { txHex: string; txInfo: Record<string, unknown> };
  let newTxParams: () => { recipients: ITransactionRecipient[] };
  let wallet: Wallet;

  const txPreBuild = {
    txHex: testData.rawTx.fungibleTokenTransfer.unsigned,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: testData.accounts.account2.address,
        amount: '100',
      },
    ],
  };

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    Nep141Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    newTxPrebuild = () => {
      return structuredClone(txPreBuild);
    };
    newTxParams = () => {
      return structuredClone(txParams);
    };
    baseCoin = bitgo.coin(nep141TokenName) as Nep141Token;
    wallet = new Wallet(bitgo, baseCoin, {});
  });

  describe('Verify Transaction', () => {
    it('should succeed to verify an unsigned transaction without storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify an unsigned transaction with storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithStorageDeposit.unsigned;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify an unsigned transaction with self storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithSelfStorageDeposit.unsigned;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction without storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransfer.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction with storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithStorageDeposit.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify a signed transaction with self storage deposit', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.rawTx.fungibleTokenTransferWithSelfStorageDeposit.signed;
      const txParams = newTxParams();
      const isTransactionVerified = await baseCoin.verifyTransaction({ txParams, txPrebuild, wallet });
      isTransactionVerified.should.equal(true);
    });

    it('should fail when tx hex is missing', async () => {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = '';
      const txParams = newTxParams();
      await baseCoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should fail when recipients and outputs are not matching', async () => {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = testData.accounts.account3.address;
      await baseCoin
        .verifyTransaction({ txParams, txPrebuild, wallet })
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });
  });
});
