import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import * as sinon from 'sinon';
import { Wallet } from '@bitgo/sdk-core';

import { defaultBitGo, getUtxoCoin } from './util';

describe('Verify Transaction', function () {
  const coin = getUtxoCoin('tbtc');

  const userKeychain = coin.keychains().create();
  const otherKeychain = coin.keychains().create();

  const changeKeys = {
    user: coin.keychains().create(),
    backup: coin.keychains().create(),
    bitgo: coin.keychains().create(),
  };

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sign = async (key, keychain) => (await coin.signMessage(keychain, key.pub!)).toString('hex');
  const signUser = (key) => sign(key, userKeychain);
  const signOther = (key) => sign(key, otherKeychain);
  const passphrase = 'test_passphrase';

  const stubData = {
    unsignedSendingWallet: {
      keyIds: sinon.stub().returns(['0', '1', '2']),
    },
    parseTransactionData: {
      badKey: {
        keychains: {
          // user public key swapped out
          user: {
            pub: otherKeychain.pub,
            encryptedPrv: defaultBitGo.encrypt({
              input: userKeychain.prv,
              password: passphrase,
            }),
          },
        },
        needsCustomChangeKeySignatureVerification: true,
      },
      noCustomChange: {
        keychains: { user: userKeychain },
        needsCustomChangeKeySignatureVerification: true,
      },
      emptyCustomChange: {
        keychains: { user: userKeychain },
        needsCustomChangeKeySignatureVerification: true,
        customChange: {},
      },
      // needs to be async function to create signatures
      badSigs: async () => ({
        keychains: { user: userKeychain },
        needsCustomChangeKeySignatureVerification: true,
        customChange: {
          keys: [changeKeys.user, changeKeys.backup, changeKeys.bitgo],
          signatures: [
            await signOther(changeKeys.user),
            await signOther(changeKeys.backup),
            await signOther(changeKeys.bitgo),
          ],
        },
      }),
      goodSigs: async () => ({
        keychains: { user: userKeychain },
        needsCustomChangeKeySignatureVerification: true,
        customChange: {
          keys: [changeKeys.user, changeKeys.backup, changeKeys.bitgo],
          signatures: [
            await signUser(changeKeys.user),
            await signUser(changeKeys.backup),
            await signUser(changeKeys.bitgo),
          ],
        },
        missingOutputs: 1,
      }),
    },
  };

  const unsignedSendingWallet = sinon.createStubInstance(Wallet, stubData.unsignedSendingWallet as any);

  it('should fail if the user private key cannot be verified to match the user public key', async () => {
    sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.badKey as any);
    const verifyWallet = sinon.createStubInstance(Wallet, {});

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: verifyWallet as any,
        verification: {},
      }),
      /transaction requires verification of user public key, but it was unable to be verified/
    );

    (coin.parseTransaction as any).restore();
  });

  it('should fail if the custom change verification data is required but missing', async () => {
    sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.noCustomChange as any);

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
        verification: {},
      }),
      /parsed transaction is missing required custom change verification data/
    );

    (coin.parseTransaction as any).restore();
  });

  it('should fail if the custom change keys or key signatures are missing', async () => {
    sinon.stub(coin, 'parseTransaction').resolves(stubData.parseTransactionData.emptyCustomChange as any);

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
        verification: {},
      }),
      /customChange property is missing keys or signatures/
    );

    (coin.parseTransaction as any).restore();
  });

  it('should fail if the custom change key signatures cannot be verified', async () => {
    sinon.stub(coin, 'parseTransaction').resolves((await stubData.parseTransactionData.badSigs()) as any);

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
        verification: {},
      }),
      /transaction requires verification of custom change key signatures, but they were unable to be verified/
    );

    (coin.parseTransaction as any).restore();
  });

  it('should successfully verify a custom change transaction when change keys and signatures are valid', async () => {
    sinon.stub(coin, 'parseTransaction').resolves((await stubData.parseTransactionData.goodSigs()) as any);

    // if verify transaction gets rejected with the outputs missing error message,
    // then we know that the verification of the custom change key signatures was successful
    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
        verification: {},
      }),
      /expected outputs missing in transaction prebuild/
    );

    (coin.parseTransaction as any).restore();
  });

  it('should not allow more than 150 basis points of implicit external outputs (for paygo outputs)', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [],
      changeOutputs: [],
      explicitExternalSpendAmount: 10000,
      implicitExternalSpendAmount: 151,
      needsCustomChangeKeySignatureVerification: false,
    });

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
      }),
      /prebuild attempts to spend to unintended external recipients/
    );

    coinMock.restore();
  });

  it('should allow 150 basis points of implicit external outputs (for paygo outputs)', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [],
      changeOutputs: [],
      explicitExternalSpendAmount: 1000,
      implicitExternalSpendAmount: 15,
      needsCustomChangeKeySignatureVerification: false,
    });

    const bitcoinMock = sinon
      .stub(coin, 'createTransactionFromHex')
      .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

    const result = await coin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
    });

    assert.strictEqual(result, true);

    coinMock.restore();
    bitcoinMock.restore();
  });

  it('should not allow any implicit external outputs if paygo outputs are disallowed', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 10,
      needsCustomChangeKeySignatureVerification: false,
    });

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
        },
        txPrebuild: {
          txHex: '00',
        },
        wallet: unsignedSendingWallet as any,
        verification: {
          allowPaygoOutput: false,
        },
      }),
      /prebuild attempts to spend to unintended external recipients/
    );

    coinMock.restore();
  });

  it('should allow paygo outputs if empty verification object is passed', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [],
      changeOutputs: [],
      explicitExternalSpendAmount: 1000,
      implicitExternalSpendAmount: 15,
      needsCustomChangeKeySignatureVerification: false,
    });

    const bitcoinMock = sinon
      .stub(coin, 'createTransactionFromHex')
      .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

    const result = await coin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: {},
    });

    assert.strictEqual(result, true);

    coinMock.restore();
    bitcoinMock.restore();
  });

  it('should work with bigint amounts', async () => {
    // need a coin that uses bigint
    const bigintCoin = getUtxoCoin('tdoge');

    const coinMock = sinon.stub(bigintCoin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [
        {
          address: 'external_address',
          amount: '10000',
        },
      ],
      implicitExternalOutputs: [
        {
          address: 'external_address_2',
          amount: '15',
        },
      ],
      changeOutputs: [],
      explicitExternalSpendAmount: BigInt(10000),
      implicitExternalSpendAmount: BigInt(15),
      needsCustomChangeKeySignatureVerification: false,
    });

    const bitcoinMock = sinon
      .stub(bigintCoin, 'createTransactionFromHex')
      .returns({ ins: [] } as unknown as utxolib.bitgo.UtxoTransaction);

    const result = await bigintCoin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: {},
    });

    assert.strictEqual(result, true);

    coinMock.restore();
    bitcoinMock.restore();
  });
});
