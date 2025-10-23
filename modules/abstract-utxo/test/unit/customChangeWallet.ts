import should = require('should');
import * as sinon from 'sinon';
import { Wallet } from '@bitgo/sdk-core';

import { generateAddress } from '../../src';

import { getUtxoCoin } from './util';

describe('Custom Change Wallets', () => {
  const coin = getUtxoCoin('tbtc');

  const keys = {
    send: {
      user: { id: '0', key: coin.keychains().create() },
      backup: { id: '1', key: coin.keychains().create() },
      bitgo: { id: '2', key: coin.keychains().create() },
    },
    change: {
      user: { id: '3', key: coin.keychains().create() },
      backup: { id: '4', key: coin.keychains().create() },
      bitgo: { id: '5', key: coin.keychains().create() },
    },
  };

  const customChangeKeySignatures = {
    user: '',
    backup: '',
    bitgo: '',
  };

  const addressData = {
    chain: 11,
    index: 1,
    addressType: 'p2shP2wsh' as const,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    keychains: [
      { pub: keys.change.user.key.pub! },
      { pub: keys.change.backup.key.pub! },
      { pub: keys.change.bitgo.key.pub! },
    ],
    threshold: 2,
  };

  const { address: changeAddress, coinSpecific } = generateAddress(coin.network, coin.getChain(), addressData);

  const changeWalletId = 'changeWalletId';
  const stubData = {
    signedSendingWallet: {
      keyIds: sinon.stub().returns([keys.send.user.id, keys.send.backup.id, keys.send.bitgo.id]),
      coinSpecific: sinon.stub().returns({ customChangeWalletId: changeWalletId }),
    },
    changeWallet: {
      keyIds: sinon.stub().returns([keys.change.user.id, keys.change.backup.id, keys.change.bitgo.id]),
      createAddress: sinon.stub().resolves(changeAddress),
    },
  };

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sign = async ({ key }) => (await coin.signMessage({ prv: keys.send.user.key.prv }, key.pub!)).toString('hex');
    customChangeKeySignatures.user = await sign(keys.change.user);
    customChangeKeySignatures.backup = await sign(keys.change.backup);
    customChangeKeySignatures.bitgo = await sign(keys.change.bitgo);
  });

  it('should consider addresses derived from the custom change keys as internal spends', async () => {
    const signedSendingWallet = sinon.createStubInstance(Wallet, stubData.signedSendingWallet as any);
    const changeWallet = sinon.createStubInstance(Wallet, stubData.changeWallet as any);

    sinon.stub(coin, 'keychains').returns({
      get: sinon.stub().callsFake(({ id }) => {
        switch (id) {
          case keys.send.user.id:
            return Promise.resolve({ id, ...keys.send.user.key });
          case keys.send.backup.id:
            return Promise.resolve({ id, ...keys.send.backup.key });
          case keys.send.bitgo.id:
            return Promise.resolve({ id, ...keys.send.bitgo.key });
          case keys.change.user.id:
            return Promise.resolve({ id, ...keys.change.user.key });
          case keys.change.backup.id:
            return Promise.resolve({ id, ...keys.change.backup.key });
          case keys.change.bitgo.id:
            return Promise.resolve({ id, ...keys.change.bitgo.key });
        }
      }),
    } as any);

    sinon.stub(coin, 'wallets').returns({
      get: sinon.stub().callsFake(() => Promise.resolve(changeWallet)),
    } as any);

    const outputAmount = 10000;
    const recipients = [];

    sinon.stub(coin, 'explainTransaction').resolves({
      outputs: [],
      changeOutputs: [
        {
          address: changeAddress,
          amount: outputAmount,
        },
      ],
    } as any);

    signedSendingWallet._wallet = signedSendingWallet._wallet || {
      customChangeKeySignatures,
    };

    const parsedTransaction = await coin.parseTransaction({
      txParams: { changeAddress, recipients },
      txPrebuild: { txHex: '' },
      wallet: signedSendingWallet as any,
      verification: {
        addresses: {
          [changeAddress]: {
            coinSpecific,
            chain: addressData.chain,
            index: addressData.index,
          },
        },
      },
    });

    should.exist(parsedTransaction.outputs[0]);
    parsedTransaction.outputs[0].should.deepEqual({
      address: changeAddress,
      amount: outputAmount,
      external: false,
      needsCustomChangeKeySignatureVerification: true,
    });

    (coin.explainTransaction as any).restore();
    (coin.wallets as any).restore();
    (coin.keychains as any).restore();
  });
});
