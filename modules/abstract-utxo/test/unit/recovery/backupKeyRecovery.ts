import assert from 'assert';

import 'should';
import * as mocha from 'mocha';
import * as sinon from 'sinon';
import nock = require('nock');
import { BIP32Interface } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { Config, krsProviders, Triple } from '@bitgo/sdk-core';

import {
  AbstractUtxoCoin,
  backupKeyRecovery,
  BackupKeyRecoveryTransansaction,
  CoingeckoApi,
  FormattedOfflineVaultTxInfo,
} from '../../../src';
import {
  defaultBitGo,
  encryptKeychain,
  getDefaultWalletKeys,
  getFixture,
  getNormalTestnetCoin,
  getWalletAddress,
  getWalletKeys,
  keychains,
  shouldEqualJSON,
  toKeychainBase58,
  utxoCoins,
} from '../util';

import { MockRecoveryProvider } from './mock';

const { toOutput } = utxolib.bitgo;
type WalletUnspent = utxolib.bitgo.WalletUnspent<bigint>;
type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

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

const walletKeys = getDefaultWalletKeys();
const keysUnsignedSweep = getKeysForUnsignedSweep(walletKeys.triple, walletPassphrase);
const keysKeyRecoveryService = getKeysForKeyRecoveryService(walletKeys.triple, walletPassphrase);
const keysFullSignedRecovery = getKeysForFullSignedRecovery(walletKeys.triple, walletPassphrase);

const exoticUserKeyPath = '99/99';
const exoticWalletKeys = new utxolib.bitgo.RootWalletKeys(keychains, [
  exoticUserKeyPath,
  utxolib.bitgo.RootWalletKeys.defaultPrefix,
  utxolib.bitgo.RootWalletKeys.defaultPrefix,
]);
const keysFullSignedRecoveryExotic = getKeysForFullSignedRecovery(exoticWalletKeys.triple, walletPassphrase);

function run(
  coin: AbstractUtxoCoin,
  scriptTypes: ScriptType2Of3[],
  walletKeys: RootWalletKeys,
  params: {
    keys: NamedKeys;
    userKeyPath?: string;
    krsProvider?: string;
    hasUserSignature: boolean;
    hasBackupSignature: boolean;
    hasKrsOutput?: boolean;
    feeRate?: number;
  },
  tags: string[] = []
) {
  describe(`Backup Key Recovery [${[coin.getChain(), ...tags, params.krsProvider].join(',')}]`, function () {
    const externalWallet = getWalletKeys('external');
    const recoveryDestination = getWalletAddress(coin.network, externalWallet);

    let keyRecoveryServiceAddress: string;
    let recovery: (BackupKeyRecoveryTransansaction | FormattedOfflineVaultTxInfo) & { txid?: string };
    let recoveryTx: utxolib.bitgo.UtxoTransaction<number | bigint> | utxolib.bitgo.UtxoPsbt;

    // 1e8 * 9e7 < 9.007e15 but 2e8 * 9e7 > 9.007e15 to test both code paths in queryBlockchainUnspentsPath
    const valueMul = coin.amountType === 'bigint' ? BigInt(9e7) : BigInt(1);
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

    let recoverUnspents: utxolib.bitgo.Unspent<bigint>[];
    let mockedApiUnspents: utxolib.bitgo.Unspent<bigint>[];

    before('create recovery data', async function () {
      recoverUnspents = scriptTypes.flatMap((scriptType, index) => [
        utxolib.testutil.toUnspent({ scriptType, value: BigInt(1e8) * valueMul }, index, coin.network, walletKeys),
        utxolib.testutil.toUnspent({ scriptType, value: BigInt(2e8) * valueMul }, index, coin.network, walletKeys),
        utxolib.testutil.toUnspent({ scriptType, value: BigInt(3e8) * valueMul }, index, coin.network, walletKeys),
      ]);

      // If the coin is bch, convert the mocked unspent address to cashaddr format since that is the format that blockchair
      // returns on the /dashboards/addresses response
      mockedApiUnspents =
        coin.getChain() === 'bch' || coin.getChain() === 'bcha'
          ? recoverUnspents.map((u) => ({ ...u, address: coin.canonicalAddress(u.address, 'cashaddr').split(':')[1] }))
          : recoverUnspents;

      assert.strictEqual(mockedApiUnspents.length, recoverUnspents.length);
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

    it('has correct recovery provider mocks', async function () {
      const recoveryProvider = new MockRecoveryProvider(mockedApiUnspents);
      (await recoveryProvider.getUnspentsForAddresses(mockedApiUnspents.map((u) => u.address))).length.should.eql(
        mockedApiUnspents.length
      );
    });

    it('matches fixture', async function () {
      const fixtureCoin = getNormalTestnetCoin(coin);
      const fixtureRecovery = { ...recovery };
      if (fixtureRecovery.coin) {
        fixtureRecovery.coin = fixtureCoin.getChain();
      }

      shouldEqualJSON(
        fixtureRecovery,
        await getFixture(
          fixtureCoin,
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
                throw new Error(`unexpected scriptType ${parsed.scriptType}`);
            }
          });
        } else {
          this.skip();
        }
      });
    }

    it((params.hasKrsOutput ? 'has' : 'has no') + ' key recovery service output', function () {
      const outs = recoveryTx instanceof utxolib.bitgo.UtxoPsbt ? recoveryTx.getUnsignedTx().outs : recoveryTx.outs;
      outs.length.should.eql(1);
      const outputAddresses = outs.map((o) => utxolib.address.fromOutputScript(o.script, recoveryTx.network));
      outputAddresses
        .includes(keyRecoveryServiceAddress)
        .should.eql(!!params.hasKrsOutput && params.krsProvider === 'keyternal');
      outputAddresses.includes(recoveryDestination).should.eql(true);
    });
  });
}

function runWithScriptTypes(
  scriptTypes: ScriptType2Of3[],
  { runKeyProviderTests = true }: { runKeyProviderTests?: boolean } = {}
) {
  utxoCoins
    .filter((coin) => scriptTypes.every((type) => coin.supportsAddressType(type)))
    .forEach((coin) => {
      run(
        coin,
        scriptTypes,
        walletKeys,
        {
          keys: keysUnsignedSweep,
          hasUserSignature: false,
          hasBackupSignature: false,
        },
        ['unsignedRecovery', ...scriptTypes]
      );

      if (runKeyProviderTests) {
        ['dai', 'keyternal'].forEach((krsProvider) => {
          run(
            coin,
            scriptTypes,
            walletKeys,
            {
              keys: keysKeyRecoveryService,
              krsProvider: krsProvider,
              hasUserSignature: true,
              hasBackupSignature: false,
              hasKrsOutput: false,
            },
            ['keyRecoveryService', ...scriptTypes]
          );
        });
      }

      run(
        coin,
        scriptTypes,
        walletKeys,
        {
          keys: keysFullSignedRecovery,
          hasUserSignature: true,
          hasBackupSignature: true,
        },
        ['fullSignedRecovery', ...scriptTypes]
      );

      run(
        coin,
        scriptTypes,
        walletKeys,
        {
          keys: keysFullSignedRecovery,
          hasUserSignature: true,
          hasBackupSignature: true,
          feeRate: 2,
        },
        ['fullSignedRecovery', 'fixedFeeRate', ...scriptTypes]
      );

      run(
        coin,
        scriptTypes,
        exoticWalletKeys,
        {
          keys: keysFullSignedRecoveryExotic,
          userKeyPath: exoticUserKeyPath,
          hasUserSignature: true,
          hasBackupSignature: true,
        },
        ['fullSignedRecovery', 'customUserKeyPath', ...scriptTypes]
      );
    });
}

describe('Backup Key Recovery', function () {
  // compatible with all coins
  runWithScriptTypes(['p2sh']);

  // segwit compatible coins
  runWithScriptTypes(['p2shP2wsh', 'p2wsh']);

  // taproot compatible coins
  runWithScriptTypes(['p2tr', 'p2trMusig2'], { runKeyProviderTests: false });
});
