import assert from 'assert';

import 'should';
import nock = require('nock');
import { Triple } from '@bitgo/sdk-core';
import { BIP32, ECPair, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, backupKeyRecoveryWithWalletUnspents } from '../../../src';
import type { WalletUnspent } from '../../../src/unspent';
import {
  createWasmWalletKeys,
  getDefaultWasmWalletKeys,
  getFixture,
  getNormalTestnetCoin,
  getWalletAddress,
  toUnspent,
  utxoCoins,
} from '../util';
type ScriptType2Of3 = 'p2sh' | 'p2shP2wsh' | 'p2wsh' | 'p2tr' | 'p2trMusig2';

nock.disableNetConnect();

const defaultDerivationPrefix = 'm/0/0';
const exoticUserKeyPath = '99/99';

// Create wallet keys using wasm-utxo primitives from default keychains
const { walletKeys: wasmWalletKeys, xprivs } = getDefaultWasmWalletKeys();
const { walletKeys: wasmExoticWalletKeys } = getDefaultWasmWalletKeys([
  exoticUserKeyPath,
  defaultDerivationPrefix,
  defaultDerivationPrefix,
]);

// Private keys for signing
const userPrivkey = xprivs[0];
const backupPrivkey = xprivs[1];

function run(
  coin: AbstractUtxoCoin,
  scriptTypes: ScriptType2Of3[],
  wasmWalletKeys: fixedScriptWallet.RootWalletKeys,
  params: {
    userPrivkey?: BIP32;
    backupPrivkey?: BIP32;
  },
  tags: string[] = []
) {
  const defaultFeeRateSatB = 100;

  describe(`Backup Key Recovery PSBT [${[coin.getChain(), ...tags].join(',')}]`, function () {
    const { walletKeys: externalWallet } = createWasmWalletKeys('external');
    const recoveryDestination = getWalletAddress(coin.name, externalWallet);
    const fixtureCoin = getNormalTestnetCoin(coin);
    // Get xpubs from wallet keys
    const userKey = wasmWalletKeys.userKey();
    const backupKey = wasmWalletKeys.backupKey();
    const bitgoKey = wasmWalletKeys.bitgoKey();
    const replayProtection = [ECPair.fromPublicKey(Buffer.from(userKey.publicKey))];

    // 1e8 * 9e7 < 9.007e15 but 2e8 * 9e7 > 9.007e15 to test both code paths in queryBlockchainUnspentsPath
    const valueMul = coin.amountType === 'bigint' ? BigInt(9e7) : BigInt(1);

    let psbt: fixedScriptWallet.BitGoPsbt;
    let recoverUnspents: WalletUnspent<bigint>[];
    let parsed: fixedScriptWallet.ParsedTransaction;
    let fixtureParsed: fixedScriptWallet.ParsedTransaction;

    before('create recovery data and load fixture', async function () {
      this.timeout(10_000);

      recoverUnspents = scriptTypes.flatMap((scriptType, index) => [
        toUnspent({ scriptType, value: BigInt(1e8) * valueMul }, index, coin.name, wasmWalletKeys),
        toUnspent({ scriptType, value: BigInt(2e8) * valueMul }, index, coin.name, wasmWalletKeys),
        toUnspent({ scriptType, value: BigInt(3e8) * valueMul }, index, coin.name, wasmWalletKeys),
      ]);

      // Build signing keys triple: privkey if provided, otherwise xpub from wallet keys
      const signingKeys: Triple<BIP32> = [
        params.userPrivkey || userKey,
        params.backupPrivkey || backupKey,
        bitgoKey, // bitgo is always xpub
      ];

      psbt = backupKeyRecoveryWithWalletUnspents(
        coin.name,
        {
          walletKeys: wasmWalletKeys,
          keys: signingKeys,
          recoveryDestination,
          feeRateSatVB: defaultFeeRateSatB,
        },
        recoverUnspents
      );

      // Parse generated PSBT
      parsed = psbt.parseTransactionWithWalletKeys(wasmWalletKeys, { publicKeys: replayProtection });

      // Load and parse fixture PSBT
      const psbtHex = Buffer.from(psbt.serialize()).toString('hex');
      const storedFixture = await getFixture(fixtureCoin, `recovery/backupKeyRecoveryPsbt-${tags.join('-')}`, {
        psbtHex,
      });
      const fixturePsbt = fixedScriptWallet.BitGoPsbt.fromBytes(
        Buffer.from(storedFixture.psbtHex, 'hex'),
        fixtureCoin.name
      );
      fixtureParsed = fixturePsbt.parseTransactionWithWalletKeys(wasmWalletKeys, { publicKeys: replayProtection });
    });

    it('has expected input count', function () {
      parsed.inputs.length.should.eql(recoverUnspents.length);
    });

    it('has recovery destination output', function () {
      parsed.outputs.length.should.be.greaterThanOrEqual(1);
      const outputAddresses = parsed.outputs.map((o) => o.address);
      outputAddresses.includes(recoveryDestination).should.eql(true);
    });

    it('has expected fee rate', function () {
      const inputSum = recoverUnspents.reduce((sum, u) => sum + u.value, BigInt(0));
      const outputSum = parsed.outputs.reduce((sum, o) => sum + o.value, BigInt(0));
      const fee = inputSum - outputSum;
      const vsize = fixedScriptWallet.Dimensions.fromPsbt(psbt).getVSize();
      const feeRateSatB = Number(fee) / vsize;
      const diff = Math.abs(feeRateSatB - defaultFeeRateSatB) / defaultFeeRateSatB;
      // within 1%
      assert.strictEqual(diff < 0.01, true, `expected fee rate ${defaultFeeRateSatB} but got ${feeRateSatB}`);
    });

    function checkInputsSignedBy(signerIndex: 0 | 1 | 2, expectSigned: boolean) {
      const signerKey = xprivs[signerIndex];
      for (let inputIndex = 0; inputIndex < recoverUnspents.length; inputIndex++) {
        const hasSig = psbt.verifySignature(inputIndex, signerKey);
        hasSig.should.eql(expectSigned, `input ${inputIndex} signer ${signerIndex}`);
      }
    }

    it((params.userPrivkey ? 'has' : 'has no') + ' user signature', function () {
      checkInputsSignedBy(0, !!params.userPrivkey);
    });

    it((params.backupPrivkey ? 'has' : 'has no') + ' backup signature', function () {
      checkInputsSignedBy(1, !!params.backupPrivkey);
    });

    it('matches PSBT fixture', function () {
      assert.deepStrictEqual(parsed, fixtureParsed);
    });
  });
}

function runWithScriptTypes(scriptTypes: ScriptType2Of3[]) {
  utxoCoins
    .filter((coin) => scriptTypes.every((type) => coin.supportsAddressType(type)))
    .forEach((coin) => {
      // Unsigned sweep - no signatures
      run(coin, scriptTypes, wasmWalletKeys, {}, ['unsigned', ...scriptTypes]);

      // User signed only (KRS scenario)
      run(coin, scriptTypes, wasmWalletKeys, { userPrivkey }, ['userSigned', ...scriptTypes]);

      // Fully signed recovery
      run(coin, scriptTypes, wasmWalletKeys, { userPrivkey, backupPrivkey }, ['fullySigned', ...scriptTypes]);

      // Fully signed with custom user key path
      run(coin, scriptTypes, wasmExoticWalletKeys, { userPrivkey, backupPrivkey }, [
        'fullySigned',
        'customUserKeyPath',
        ...scriptTypes,
      ]);
    });
}

describe('Backup Key Recovery PSBT', function () {
  // compatible with all coins
  runWithScriptTypes(['p2sh']);

  // segwit compatible coins
  runWithScriptTypes(['p2shP2wsh', 'p2wsh']);

  // taproot compatible coins
  runWithScriptTypes(['p2tr', 'p2trMusig2']);
});
