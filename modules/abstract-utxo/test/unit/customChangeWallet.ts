import assert from 'assert';

import should = require('should');
import * as sinon from 'sinon';
import { Wallet } from '@bitgo/sdk-core';
import { BIP32, message } from '@bitgo/wasm-utxo';

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

  let customChangeKeySignatures: Record<string, string>;

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

  const changeAddress = generateAddress(coin.name, addressData);

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

  before(() => {
    const signerKey = BIP32.fromBase58(keys.send.user.key.prv!);
    const sign = ({ key }) => Buffer.from(message.signMessage(key.pub!, signerKey.privateKey!)).toString('hex');
    customChangeKeySignatures = {
      user: sign(keys.change.user),
      backup: sign(keys.change.backup),
      bitgo: sign(keys.change.bitgo),
    };
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

  it('should reject invalid custom change key signatures before calling explainTransaction', async () => {
    const wrongKey = BIP32.fromBase58(coin.keychains().create().prv!);
    const sign = ({ key }) => Buffer.from(message.signMessage(key.pub!, wrongKey.privateKey!)).toString('hex');
    const invalidSignatures = {
      user: sign(keys.change.user),
      backup: sign(keys.change.backup),
      bitgo: sign(keys.change.bitgo),
    };

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

    const explainStub = sinon.stub(coin, 'explainTransaction');

    signedSendingWallet._wallet = signedSendingWallet._wallet || {
      customChangeKeySignatures: invalidSignatures,
    };

    try {
      await coin.parseTransaction({
        txParams: { recipients: [] },
        txPrebuild: { txHex: '' },
        wallet: signedSendingWallet as any,
        verification: {},
      });
      assert.fail('parseTransaction should have thrown for invalid custom change key signatures');
    } catch (e) {
      assert.ok(e instanceof Error);
      assert.match(e.message, /failed to verify custom change .* key signature/);
    }

    assert.strictEqual(explainStub.called, false, 'explainTransaction should not have been called');

    explainStub.restore();
    (coin.wallets as any).restore();
    (coin.keychains as any).restore();
  });
});
