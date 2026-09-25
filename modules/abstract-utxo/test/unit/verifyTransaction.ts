import assert from 'assert';

import * as sinon from 'sinon';
import { Keychain, Wallet } from '@bitgo/sdk-core';

import { ParsedTransaction } from '../../src/transaction/types';
import { verifyUserPublicKey } from '../../src/verifyKey';
import { UtxoWallet } from '../../src/wallet';

import { defaultBitGo, getUtxoCoin, keychainsBase58 } from './util';

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

  // the wallet's backup/bitgo keychains, as fetchKeychains would return them
  const walletBackupKeychain = coin.keychains().create();
  const walletBitgoKeychain = coin.keychains().create();
  const walletKeychains: Record<'user' | 'backup' | 'bitgo', Keychain> = {
    user: { ...userKeychain, id: 'user', type: 'independent' },
    backup: { ...walletBackupKeychain, id: 'backup', type: 'independent' },
    bitgo: { ...walletBitgoKeychain, id: 'bitgo', type: 'independent' },
  };
  const walletKeySignatures = { backupPub: '', bitgoPub: '' };
  const attackerKeySignatures = { backupPub: '', bitgoPub: '' };

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
            encryptedPrv: '' as string, // set in before()
          },
          backup: walletBackupKeychain,
          bitgo: walletBitgoKeychain,
        },
        // signatures consistent with the substituted user public key
        keySignatures: attackerKeySignatures,
        needsCustomChangeKeySignatureVerification: true,
      },
      noCustomChange: {
        keychains: walletKeychains,
        keySignatures: walletKeySignatures,
        needsCustomChangeKeySignatureVerification: true,
      },
      emptyCustomChange: {
        keychains: walletKeychains,
        keySignatures: walletKeySignatures,
        needsCustomChangeKeySignatureVerification: true,
        customChange: {},
      },
      // needs to be async function to create signatures
      badSigs: async () => ({
        keychains: walletKeychains,
        keySignatures: walletKeySignatures,
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
        keychains: walletKeychains,
        keySignatures: walletKeySignatures,
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

  before(async () => {
    stubData.parseTransactionData.badKey.keychains.user.encryptedPrv = await defaultBitGo.encrypt({
      input: userKeychain.prv,
      password: passphrase,
    });
    walletKeySignatures.backupPub = await signUser(walletBackupKeychain);
    walletKeySignatures.bitgoPub = await signUser(walletBitgoKeychain);
    // signatures consistent with a substituted user public key
    attackerKeySignatures.backupPub = await signOther(walletBackupKeychain);
    attackerKeySignatures.bitgoPub = await signOther(walletBitgoKeychain);
  });

  const unsignedSendingWallet = sinon.createStubInstance(Wallet, stubData.unsignedSendingWallet as any);
  // sinon stub instances don't structurally satisfy UtxoWallet (private class members)
  const stubWallet = unsignedSendingWallet as unknown as UtxoWallet;

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

  describe('keychain anchoring (WCN-2114)', function () {
    let sandbox: sinon.SinonSandbox;

    const baseParsedTransaction = {
      keychains: walletKeychains,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 0,
      needsCustomChangeKeySignatureVerification: false,
    };

    function stubParsedTransaction(overrides: Record<string, unknown>) {
      const parsed = { ...baseParsedTransaction, ...overrides } as unknown as ParsedTransaction<number>;
      return sandbox.stub(coin, 'parseTransaction').resolves(parsed);
    }

    beforeEach(function () {
      sandbox = sinon.createSandbox();
    });

    afterEach(function () {
      // a failed assertion must not leave parseTransaction wrapped for later tests
      sandbox.restore();
    });

    it('should fail when wallet keySignatures are missing for server-obtained keychains', async () => {
      stubParsedTransaction({});
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: {},
        }),
        /wallet keySignatures missing; cannot verify server-supplied keychains/
      );
    });

    it('should fail when wallet keySignatures are invalid', async () => {
      stubParsedTransaction({ keySignatures: attackerKeySignatures });
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: {},
        }),
        /secondary public key signatures invalid/
      );
    });

    it('should fail when the user public key cannot be verified for server-obtained keychains', async () => {
      // user pub substituted; signatures self-consistent with the substituted key
      stubParsedTransaction({
        keychains: {
          user: { pub: otherKeychain.pub },
          backup: walletBackupKeychain,
          bitgo: walletBitgoKeychain,
        },
        keySignatures: attackerKeySignatures,
      });
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: {},
        }),
        /failed to verify user public key against the wallet user key/
      );
    });

    it('should skip keychain anchoring when allowUnsignedKeys is set', async () => {
      stubParsedTransaction({});
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { allowUnsignedKeys: true },
        }),
        /txPrebuild\.txHex not set/
      );
    });

    it('should accept caller-supplied keychains without wallet keySignatures', async () => {
      stubParsedTransaction({});
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { keychains: walletKeychains },
        }),
        /txPrebuild\.txHex not set/
      );
    });

    it('should reject wallet keySignatures that do not match the caller-pinned keychains', async () => {
      stubParsedTransaction({ keySignatures: attackerKeySignatures });
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { keychains: walletKeychains },
        }),
        /secondary public key signatures invalid/
      );
    });

    it('should accept wallet keySignatures that match the caller-pinned keychains', async () => {
      stubParsedTransaction({ keySignatures: walletKeySignatures });
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { keychains: walletKeychains },
        }),
        /txPrebuild\.txHex not set/
      );
    });

    it('should reject non-boolean allowUnsignedKeys', async () => {
      stubParsedTransaction({});
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { allowUnsignedKeys: 'yes' as unknown as boolean }, // deliberately wrong type: exercises the runtime guard
        }),
        /verification.allowUnsignedKeys must be a boolean/
      );
    });

    it('should still require user public key verification for custom change with allowUnsignedKeys', async () => {
      stubParsedTransaction({
        keySignatures: walletKeySignatures,
        needsCustomChangeKeySignatureVerification: true,
      });
      await assert.rejects(
        coin.verifyTransaction({
          txParams: {},
          txPrebuild: {},
          wallet: stubWallet,
          verification: { allowUnsignedKeys: true },
        }),
        /transaction requires verification of user public key, but it was unable to be verified/
      );
    });

    it('should fail to verify the user public key when offline without a user private key', async () => {
      await assert.rejects(
        verifyUserPublicKey(defaultBitGo, {
          userKeychain: { pub: keychainsBase58[0].pub },
          disableNetworking: true,
          txParams: {},
        }),
        /user private key unavailable for verification/
      );
    });
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
        verification: { allowUnsignedKeys: true },
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

    const result = await coin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: { allowUnsignedKeys: true },
    });

    assert.strictEqual(result, true);

    coinMock.restore();
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
          allowUnsignedKeys: true,
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

    const result = await coin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: { allowUnsignedKeys: true },
    });

    assert.strictEqual(result, true);

    coinMock.restore();
  });

  it('should verify a bridging transaction whose implicit external output matches the bridge amount', async () => {
    // Bridging intents (e.g. BTC -> sBTC peg-in) carry no recipients; the single external output
    // is the bridge deposit address computed server-side. With explicitExternalSpendAmount 0 the
    // paygo limit is 0, so any implicit external output would normally be rejected as an
    // "unintended external recipient". For type: 'bridging' we instead verify that the implicit
    // external spend equals bridgingParams.sbtc.amount.
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [
        {
          address: 'sbtc_deposit_address',
          amount: '22000',
        },
      ],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 22000,
      needsCustomChangeKeySignatureVerification: false,
    });

    const result = await coin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
        type: 'bridging',
        bridgingParams: { sbtc: { amount: '22000', stacksRecipient: 'SM1X', maxFee: '1000', lockTime: 100 } },
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: { allowUnsignedKeys: true },
    });

    assert.strictEqual(result, true);

    coinMock.restore();
  });

  it('should reject a bridging transaction whose implicit external output does not match the bridge amount', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [
        {
          address: 'sbtc_deposit_address',
          amount: '50000',
        },
      ],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 50000,
      needsCustomChangeKeySignatureVerification: false,
    });

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
          type: 'bridging',
          bridgingParams: { sbtc: { amount: '22000', stacksRecipient: 'SM1X', maxFee: '1000', lockTime: 100 } },
        },
        txPrebuild: {
          txHex: '00',
        },
        wallet: unsignedSendingWallet as any,
        verification: { allowUnsignedKeys: true },
      }),
      /bridging output amount \(50000\) does not match intended bridge amount \(22000\)/
    );

    coinMock.restore();
  });

  it('should reject a bridging transaction that is missing bridgingParams.sbtc.amount', async () => {
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [
        {
          address: 'sbtc_deposit_address',
          amount: '22000',
        },
      ],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 22000,
      needsCustomChangeKeySignatureVerification: false,
    });

    await assert.rejects(
      coin.verifyTransaction({
        txParams: {
          walletPassphrase: passphrase,
          type: 'bridging',
        },
        txPrebuild: {
          txHex: '00',
        },
        wallet: unsignedSendingWallet as any,
        verification: { allowUnsignedKeys: true },
      }),
      /bridging transaction is missing bridgingParams.sbtc.amount/
    );

    coinMock.restore();
  });

  it('should still reject the same implicit external output when the intent is not bridging', async () => {
    // Same shape as the bridging test above, but without type: 'bridging' the implicit external
    // output is treated as an unintended external recipient and rejected.
    const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
      keychains: {} as any,
      keySignatures: {},
      outputs: [],
      missingOutputs: [],
      explicitExternalOutputs: [],
      implicitExternalOutputs: [
        {
          address: 'sbtc_deposit_address',
          amount: '22000',
        },
      ],
      changeOutputs: [],
      explicitExternalSpendAmount: 0,
      implicitExternalSpendAmount: 22000,
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
        verification: { allowUnsignedKeys: true },
      }),
      /prebuild attempts to spend to unintended external recipients/
    );

    coinMock.restore();
  });

  describe('quantum-resistant sweep (qr: true)', function () {
    it('should reject when explicit external outputs are present', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {} as any,
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [{ address: 'external_addr', amount: '5000' }],
        implicitExternalOutputs: [],
        changeOutputs: [{ address: 'change_addr', amount: '4000' }],
        explicitExternalSpendAmount: 5000,
        implicitExternalSpendAmount: 0,
        needsCustomChangeKeySignatureVerification: false,
      });

      await assert.rejects(
        coin.verifyTransaction({
          txParams: { walletPassphrase: passphrase, qr: true },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: { allowUnsignedKeys: true },
        }),
        /quantum-resistant sweep transactions must only contain wallet-internal outputs/
      );

      coinMock.restore();
    });

    it('should reject when implicit external outputs are present', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {} as any,
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [{ address: 'paygo_addr', amount: '100' }],
        changeOutputs: [{ address: 'change_addr', amount: '9900' }],
        explicitExternalSpendAmount: 0,
        implicitExternalSpendAmount: 100,
        needsCustomChangeKeySignatureVerification: false,
      });

      await assert.rejects(
        coin.verifyTransaction({
          txParams: { walletPassphrase: passphrase, qr: true },
          txPrebuild: {},
          wallet: unsignedSendingWallet as any,
          verification: { allowUnsignedKeys: true },
        }),
        /quantum-resistant sweep transactions must only contain wallet-internal outputs/
      );

      coinMock.restore();
    });

    it('should pass when all outputs are internal (change only)', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {} as any,
        keySignatures: {},
        outputs: [{ address: 'change_addr', amount: '10000' }],
        missingOutputs: [],
        explicitExternalOutputs: [],
        implicitExternalOutputs: [],
        changeOutputs: [{ address: 'change_addr', amount: '10000' }],
        explicitExternalSpendAmount: 0,
        implicitExternalSpendAmount: 0,
        needsCustomChangeKeySignatureVerification: false,
      });

      const result = await coin.verifyTransaction({
        txParams: { walletPassphrase: passphrase, qr: true },
        txPrebuild: {},
        wallet: unsignedSendingWallet as any,
        verification: { allowUnsignedKeys: true },
      });

      assert.strictEqual(result, true);

      coinMock.restore();
    });

    it('should not apply qr check when qr is not set', async () => {
      const coinMock = sinon.stub(coin, 'parseTransaction').resolves({
        keychains: {} as any,
        keySignatures: {},
        outputs: [],
        missingOutputs: [],
        explicitExternalOutputs: [{ address: 'external_addr', amount: '5000' }],
        implicitExternalOutputs: [],
        changeOutputs: [],
        explicitExternalSpendAmount: 5000,
        implicitExternalSpendAmount: 0,
        needsCustomChangeKeySignatureVerification: false,
      });

      const result = await coin.verifyTransaction({
        txParams: { walletPassphrase: passphrase },
        txPrebuild: { txHex: '00' },
        wallet: unsignedSendingWallet as any,
        verification: { allowUnsignedKeys: true },
      });

      assert.strictEqual(result, true);

      coinMock.restore();
    });
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

    const result = await bigintCoin.verifyTransaction({
      txParams: {
        walletPassphrase: passphrase,
      },
      txPrebuild: {
        txHex: '00',
      },
      wallet: unsignedSendingWallet as any,
      verification: { allowUnsignedKeys: true },
    });

    assert.strictEqual(result, true);

    coinMock.restore();
  });
});
