/**
 * @prettier
 */
import 'should';
import * as mocha from 'mocha';
import * as sinon from 'sinon';
import * as nock from 'nock';
import { BIP32Interface } from '@bitgo/utxo-lib';

import * as utxolib from '@bitgo/utxo-lib';
const { toOutput, outputScripts } = utxolib.bitgo;
type WalletUnspent = utxolib.bitgo.WalletUnspent<bigint>;
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

function getNamedKeys([userKey, backupKey, bitgoKey]: Triple<BIP32Interface>, password: string): NamedKeys {
  function encode(k: BIP32Interface): string {
    return k.isNeutered() ? k.toBase58() : encryptKeychain(password, toKeychainBase58(k));
  }
  return {
    userKey: encode(userKey),
    backupKey: encode(backupKey),
    bitgoKey: encode(bitgoKey),
  };
}

function getKeysForUnsignedSweep([userKey, backupKey, bitgoKey]: Triple<BIP32Interface>, password: string): NamedKeys {
  return getNamedKeys([userKey.neutered(), backupKey.neutered(), bitgoKey.neutered()], password);
}

function getKeysForKeyRecoveryService(
  [userKey, backupKey, bitgoKey]: Triple<BIP32Interface>,
  password: string
): NamedKeys {
  return getNamedKeys([userKey, backupKey.neutered(), bitgoKey.neutered()], password);
}

function getKeysForFullSignedRecovery(
  [userKey, backupKey, bitgoKey]: Triple<BIP32Interface>,
  password: string
): NamedKeys {
  return getNamedKeys([userKey, backupKey, bitgoKey.neutered()], password);
}

function getScriptTypes2Of3() {
  return outputScripts.scriptTypes2Of3;
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

  describe(`Backup Key Recovery [${[coin.getChain(), ...tags, params.krsProvider].join(',')}]`, function () {
    const externalWallet = getWalletKeys('external');
    const recoveryDestination = getWalletAddress(coin.network, externalWallet);

    let keyRecoveryServiceAddress: string;
    let recovery: (BackupKeyRecoveryTransansaction | FormattedOfflineVaultTxInfo) & { txid?: string };
    let recoveryTx: utxolib.bitgo.UtxoTransaction<number | bigint> | utxolib.bitgo.UtxoPsbt;

    // 1e8 * 9e7 < 9.007e15 but 2e8 * 9e7 > 9.007e15 to test both code paths in queryBlockchainUnspentsPath
    const valueMul = coin.amountType === 'bigint' ? BigInt(9e7) : BigInt(1);
    const allUnspents = [
      utxolib.testutil.toUnspent({ scriptType, value: BigInt(1e8) * valueMul }, 0, coin.network, walletKeys),
      utxolib.testutil.toUnspent({ scriptType, value: BigInt(2e8) * valueMul }, 2, coin.network, walletKeys),
      utxolib.testutil.toUnspent({ scriptType, value: BigInt(3e8) * valueMul }, 3, coin.network, walletKeys),
      // this unspent will not be picked up due to the index gap
      utxolib.testutil.toUnspent({ scriptType, value: BigInt(23e8) }, 23, coin.network, walletKeys),
    ];

    const recoverUnspents = allUnspents.slice(0, -1);

    // If the coin is bch, convert the mocked unspent address to cashaddr format since that is the format that blockchair
    // returns on the /dashboards/addresses response
    const mockedApiUnspents =
      coin.getChain() === 'bch' || coin.getChain() === 'bcha'
        ? recoverUnspents.map((u) => ({ ...u, address: coin.canonicalAddress(u.address, 'cashaddr').split(':')[1] }))
        : recoverUnspents;

    before('mock', function () {
      sinon.stub(CoingeckoApi.prototype, 'getUSDPrice').resolves(69_420);
    });

    configOverride(function (config: Config) {
      const configKrsProviders = { ...config.krsProviders };
      configKrsProviders.dai.supportedCoins = [coin.getFamily()];
      configKrsProviders.keyternal.supportedCoins = [coin.getFamily()];
      keyRecoveryServiceAddress = getWalletAddress(coin.network, externalWallet, 0, 100);
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
        recoveryProvider: new MockRecoveryProvider(mockedApiUnspents),
      });
      const txHex =
        (recovery as BackupKeyRecoveryTransansaction).transactionHex ?? (recovery as FormattedOfflineVaultTxInfo).txHex;
      const isPsbt = utxolib.bitgo.isPsbt(txHex);
      recoveryTx = isPsbt
        ? utxolib.bitgo.createPsbtFromHex(txHex, coin.network)
        : utxolib.bitgo.createTransactionFromHex(txHex as string, coin.network, coin.amountType);
      recovery.txid =
        recoveryTx instanceof utxolib.bitgo.UtxoPsbt ? recoveryTx.getUnsignedTx().getId() : recoveryTx.getId();
    });

    it('matches fixture', async function () {
      shouldEqualJSON(
        recovery,
        await getFixture(
          coin,
          `recovery/backupKeyRecovery-${(params.krsProvider ? tags.concat([params.krsProvider]) : tags).join('-')}`,
          recovery
        )
      );
    });

    it('has expected input count', function () {
      (recoveryTx instanceof utxolib.bitgo.UtxoPsbt ? recoveryTx.data.inputs : recoveryTx.ins).length.should.eql(
        recoverUnspents.length
      );
    });

    function checkInputsSignedBy(
      tx: utxolib.bitgo.UtxoTransaction<number | bigint> | utxolib.bitgo.UtxoPsbt,
      rootKey: BIP32Interface,
      expectCount: number
    ) {
      if (tx instanceof utxolib.bitgo.UtxoPsbt) {
        function validate(tx: utxolib.bitgo.UtxoPsbt, inputIndex: number) {
          try {
            return tx.validateSignaturesOfInputHD(inputIndex, rootKey);
          } catch (e) {
            if (e.message === 'No signatures to validate') {
              return false;
            }
            throw e;
          }
        }
        tx.data.inputs.forEach((input, inputIndex) => {
          validate(tx, inputIndex).should.eql(!!expectCount);
        });
      } else {
        const prevOutputs = recoverUnspents
          .map((u) => toOutput(u, coin.network))
          .map((v) => ({ ...v, value: utxolib.bitgo.toTNumber(v.value, coin.amountType) }));
        tx.ins.forEach((input, inputIndex) => {
          const unspent = recoverUnspents[inputIndex] as WalletUnspent;
          const { publicKey } = rootKey.derivePath(walletKeys.getDerivationPath(rootKey, unspent.chain, unspent.index));
          const signatures = utxolib.bitgo
            .getSignatureVerifications(
              tx,
              inputIndex,
              utxolib.bitgo.toTNumber(unspent.value, coin.amountType),
              { publicKey },
              prevOutputs
            )
            .filter((s) => s.signedBy !== undefined);
          signatures.length.should.eql(expectCount);
        });
      }
    }

    it((params.hasUserSignature ? 'has' : 'has no') + ' user signature', function () {
      checkInputsSignedBy(recoveryTx, walletKeys.user, params.hasUserSignature ? 1 : 0);
    });

    it((params.hasBackupSignature ? 'has' : 'has no') + ' backup signature', function () {
      checkInputsSignedBy(recoveryTx, walletKeys.backup, params.hasBackupSignature ? 1 : 0);
    });

    if (params.hasUserSignature && params.hasBackupSignature) {
      it('has no placeholder signatures', function (this: mocha.Context) {
        if (recoveryTx instanceof utxolib.bitgo.UtxoTransaction) {
          recoveryTx.ins.forEach((input) => {
            const parsed = utxolib.bitgo.parseSignatureScript(input);
            switch (parsed.scriptType) {
              case 'p2sh':
              case 'p2shP2wsh':
              case 'p2wsh':
              case 'taprootScriptPathSpend':
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
        } else {
          this.skip();
        }
      });
    }

    it((params.hasKrsOutput ? 'has' : 'has no') + ' key recovery service output', function () {
      const outs = recoveryTx instanceof utxolib.bitgo.UtxoPsbt ? recoveryTx.getUnsignedTx().outs : recoveryTx.outs;
      outs.length.should.eql(params.hasKrsOutput && params.krsProvider === 'keyternal' ? 2 : 1);
      const outputAddresses = outs.map((o) => utxolib.address.fromOutputScript(o.script, recoveryTx.network));
      outputAddresses
        .includes(keyRecoveryServiceAddress)
        .should.eql(!!params.hasKrsOutput && params.krsProvider === 'keyternal');
      outputAddresses.includes(recoveryDestination).should.eql(true);
    });
  });
}

utxoCoins.forEach((coin) => {
  const walletKeys = getDefaultWalletKeys();

  getScriptTypes2Of3().forEach((scriptType) => {
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

    ['dai', 'keyternal'].forEach((krsProvider) => {
      if (krsProvider === 'keyternal' && !['p2sh', 'p2wsh', 'p2shP2wsh'].includes(scriptType)) {
        return;
      }
      run(
        coin,
        scriptType,
        walletKeys,
        {
          keys: getKeysForKeyRecoveryService(walletKeys.triple, walletPassphrase),
          krsProvider: krsProvider,
          hasUserSignature: true,
          hasBackupSignature: false,
          hasKrsOutput: true,
        },
        [scriptType, 'keyRecoveryService']
      );
    });

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
