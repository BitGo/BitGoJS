/**
 * @prettier
 */
import 'should';
import * as sinon from 'sinon';
import * as nock from 'nock';
import * as bip32 from 'bip32';

import * as utxolib from '@bitgo/utxo-lib';
const { toOutput, outputScripts } = utxolib.bitgo;
type WalletUnspent = utxolib.bitgo.WalletUnspent;
type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

import { Config } from '../../../../../../src/config';
import {
  AbstractUtxoCoin,
  backupKeyRecovery,
  BackupKeyRecoveryTransansaction,
  CoingeckoApi,
  FormattedOfflineVaultTxInfo,
} from '@bitgo/abstract-utxo';

import {
  defaultBitGo,
  encryptKeychain,
  getDefaultWalletKeys,
  getFixture,
  getWalletAddress,
  getWalletKeys,
  keychains,
  mockUnspent,
  shouldEqualJSON,
  toKeychainBase58,
  utxoCoins,
} from '../util';

import { MockRecoveryProvider } from './mock';
import { krsProviders, Triple } from '@bitgo/sdk-core';

const config = { krsProviders };

nock.disableNetConnect();

function configOverride(f: (config: Config) => void) {
  const backup = { ...krsProviders };
  before(function () {
    f(config);
  });
  after(function () {
    Object.entries(backup).forEach(([k, v]) => {
      config[k] = v;
    });
  });
}

const walletPassphrase = 'lol';

type NamedKeys = {
  userKey: string;
  backupKey: string;
  bitgoKey: string;
};

function getNamedKeys([userKey, backupKey, bitgoKey]: Triple<bip32.BIP32Interface>, password: string): NamedKeys {
  function encode(k: bip32.BIP32Interface): string {
    return k.isNeutered() ? k.toBase58() : encryptKeychain(password, toKeychainBase58(k));
  }
  return {
    userKey: encode(userKey),
    backupKey: encode(backupKey),
    bitgoKey: encode(bitgoKey),
  };
}

function getKeysForUnsignedSweep(
  [userKey, backupKey, bitgoKey]: Triple<bip32.BIP32Interface>,
  password: string
): NamedKeys {
  return getNamedKeys([userKey.neutered(), backupKey.neutered(), bitgoKey.neutered()], password);
}

function getKeysForKeyRecoveryService(
  [userKey, backupKey, bitgoKey]: Triple<bip32.BIP32Interface>,
  password: string
): NamedKeys {
  return getNamedKeys([userKey, backupKey.neutered(), bitgoKey.neutered()], password);
}

function getKeysForFullSignedRecovery(
  [userKey, backupKey, bitgoKey]: Triple<bip32.BIP32Interface>,
  password: string
): NamedKeys {
  return getNamedKeys([userKey, backupKey, bitgoKey.neutered()], password);
}

function run(
  coin: AbstractUtxoCoin,
  scriptType: ScriptType2Of3,
  walletKeys: RootWalletKeys,
  params: {
    keys: NamedKeys;
    userKeyPath?: string;
    krsProvider?: string;
    hasUserSignature: boolean;
    hasBackupSignature: boolean;
    hasKrsOutput?: boolean;
  },
  tags: string[] = []
) {
  if (!coin.supportsAddressType(scriptType)) {
    return;
  }

  describe(`Backup Key Recovery [${[coin.getChain(), ...tags].join(',')}]`, function () {
    const externalWallet = getWalletKeys('external');
    const recoveryDestination = getWalletAddress(coin.network, externalWallet);

    let keyRecoveryServiceAddress: string;
    let recovery: (BackupKeyRecoveryTransansaction | FormattedOfflineVaultTxInfo) & { txid?: string };
    let recoveryTx: utxolib.bitgo.UtxoTransaction;

    const allUnspents = [
      mockUnspent(coin.network, walletKeys, scriptType, 0, 1e8),
      mockUnspent(coin.network, walletKeys, scriptType, 2, 2e8),
      mockUnspent(coin.network, walletKeys, scriptType, 3, 3e8),
      // this unspent will not be picked up due to the index gap
      mockUnspent(coin.network, walletKeys, scriptType, 23, 23e8),
    ];

    const recoverUnspents = allUnspents.slice(0, -1);

    if (coin.amountType === 'bigint') {
      recoverUnspents.forEach((u) => {
        // 1e8 * 9e7 < 9.007e15 but 2e8 * 9e7 > 9.007e15 to test both code paths in queryBlockchainUnspentsPath
        u.value *= 9e7;
      });
    }

    before('mock', function () {
      sinon.stub(CoingeckoApi.prototype, 'getUSDPrice').resolves(69_420);
    });

    configOverride(function (config: Config) {
      const configKrsProviders = { ...config.krsProviders };
      keyRecoveryServiceAddress = getWalletAddress(coin.network, externalWallet, 0, 100);
      configKrsProviders.keyternal.supportedCoins = [coin.getFamily()];
      configKrsProviders.keyternal.feeAddresses = { [coin.getChain()]: keyRecoveryServiceAddress };
      config.krsProviders = configKrsProviders;
    });

    after(function () {
      sinon.restore();
    });

    before('create recovery data', async function () {
      recovery = await backupKeyRecovery(coin, defaultBitGo, {
        walletPassphrase,
        recoveryDestination,
        scan: 5,
        ignoreAddressTypes: [],
        userKeyPath: params.userKeyPath,
        krsProvider: params.krsProvider,
        ...params.keys,
        recoveryProvider: new MockRecoveryProvider(recoverUnspents),
      });
      const txHex =
        (recovery as BackupKeyRecoveryTransansaction).transactionHex ?? (recovery as FormattedOfflineVaultTxInfo).txHex;
      recoveryTx = utxolib.bitgo.createTransactionFromHex(txHex as string, coin.network, coin.amountType);
      recovery.txid = recoveryTx.getId();
    });

    it('matches fixture', async function () {
      shouldEqualJSON(recovery, await getFixture(coin, `recovery/backupKeyRecovery-${tags.join('-')}`, recovery));
    });

    it('has expected input count', function () {
      recoveryTx.ins.length.should.eql(recoverUnspents.length);
    });

    function checkInputsSignedBy(
      tx: utxolib.bitgo.UtxoTransaction,
      rootKey: bip32.BIP32Interface,
      expectCount: number
    ) {
      const prevOutputs = recoverUnspents.map((u) => toOutput(u, coin.network));
      tx.ins.forEach((input, inputIndex) => {
        const unspent = recoverUnspents[inputIndex] as WalletUnspent;
        const { publicKey } = rootKey.derivePath(walletKeys.getDerivationPath(rootKey, unspent.chain, unspent.index));
        const signatures = utxolib.bitgo
          .getSignatureVerifications(tx, inputIndex, unspent.value, { publicKey }, prevOutputs)
          .filter((s) => s.signedBy !== undefined);
        signatures.length.should.eql(expectCount);
      });
    }

    it((params.hasUserSignature ? 'has' : 'has no') + ' user signature', function () {
      checkInputsSignedBy(recoveryTx, walletKeys.user, params.hasUserSignature ? 1 : 0);
    });

    it((params.hasBackupSignature ? 'has' : 'has no') + ' backup signature', function () {
      checkInputsSignedBy(recoveryTx, walletKeys.backup, params.hasBackupSignature ? 1 : 0);
    });

    if (params.hasUserSignature && params.hasBackupSignature) {
      it('has no placeholder signatures', function () {
        recoveryTx.ins.forEach((input) => {
          const parsed = utxolib.bitgo.parseSignatureScript(input);
          switch (parsed.scriptType) {
            case 'p2sh':
            case 'p2shP2wsh':
            case 'p2wsh':
            case 'p2tr':
              parsed.signatures.forEach((signature, i) => {
                if (utxolib.bitgo.isPlaceholderSignature(signature)) {
                  throw new Error(`placeholder signature at index ${i}`);
                }
              });
              break;
            default:
              throw new Error(`unexpected scriptType ${scriptType}`);
          }
        });
      });
    }

    it((params.hasKrsOutput ? 'has' : 'has no') + ' key recovery service output', function () {
      recoveryTx.outs.length.should.eql(params.hasKrsOutput ? 2 : 1);
      const outputAddresses = recoveryTx.outs.map((o) =>
        utxolib.address.fromOutputScript(o.script, recoveryTx.network)
      );
      outputAddresses.includes(keyRecoveryServiceAddress).should.eql(!!params.hasKrsOutput);
      outputAddresses.includes(recoveryDestination).should.eql(true);
    });
  });
}

utxoCoins.forEach((coin) => {
  const walletKeys = getDefaultWalletKeys();

  outputScripts.scriptTypes2Of3.forEach((scriptType) => {
    run(
      coin,
      scriptType,
      walletKeys,
      {
        keys: getKeysForUnsignedSweep(walletKeys.triple, walletPassphrase),
        hasUserSignature: false,
        hasBackupSignature: false,
      },
      [scriptType, 'unsignedRecovery']
    );

    run(
      coin,
      scriptType,
      walletKeys,
      {
        keys: getKeysForKeyRecoveryService(walletKeys.triple, walletPassphrase),
        krsProvider: 'keyternal',
        hasUserSignature: true,
        hasBackupSignature: false,
        hasKrsOutput: true,
      },
      [scriptType, 'keyRecoveryService']
    );

    run(
      coin,
      scriptType,
      walletKeys,
      {
        keys: getKeysForFullSignedRecovery(walletKeys.triple, walletPassphrase),
        hasUserSignature: true,
        hasBackupSignature: true,
      },
      [scriptType, 'fullSignedRecovery']
    );

    {
      const userKeyPath = '99/99';
      const exoticWalletKeys = new utxolib.bitgo.RootWalletKeys(keychains, [
        userKeyPath,
        utxolib.bitgo.RootWalletKeys.defaultPrefix,
        utxolib.bitgo.RootWalletKeys.defaultPrefix,
      ]);

      run(
        coin,
        scriptType,
        exoticWalletKeys,
        {
          keys: getKeysForFullSignedRecovery(exoticWalletKeys.triple, walletPassphrase),
          userKeyPath,
          hasUserSignature: true,
          hasBackupSignature: true,
        },
        [scriptType, 'fullSignedRecovery', 'customUserKeyPath']
      );
    }
  });
});
