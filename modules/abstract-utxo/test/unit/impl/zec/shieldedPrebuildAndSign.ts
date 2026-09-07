import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import nock = require('nock');
import { common } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { getUtxoCoin, defaultBitGo, getUtxoWallet } from '../../util';
import { getDefaultWasmWalletKeys, keychainsBase58 } from '../../util/keychains';
import { Zec } from '../../../../src/impl/zec';
import type { TransactionParams, VerifyTransactionOptions } from '../../../../src/abstractUtxoCoin';
import type { UtxoWallet } from '../../../../src/wallet';

/**
 * Client-side flows for a shielded (v6 Ironwood) prebuild: prebuild post-processing,
 * explanation, recipient resolution, and client-side verification. The PSBTs are built the way
 * wallet-platform's utxo-core builds them (buildTransaction/createShieldedPsbt), and the verify
 * scenarios mirror utxo-core's buildTransaction.spec.ts UA/preference-inference blocks. Signing
 * is out of scope.
 */
describe('Zec shielded client flows (v6 Ironwood PSBT)', function () {
  const zec = getUtxoCoin('tzec');
  const zecTyped = zec as Zec;
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
  const { walletKeys } = getDefaultWasmWalletKeys();

  const keyDocumentObjects = keychainsBase58.map((keychain, keyIdx) => {
    return {
      id: getSeed(keychain.pub).toString('hex'),
      pub: keychain.pub,
      source: ['user', 'backup', 'bitgo'][keyIdx],
      coinSpecific: {},
    };
  });

  const zecWallet = getUtxoWallet(zec, {
    id: 'walletId',
    keys: keyDocumentObjects.map((k) => k.id),
    coinSpecific: { addressVersion: 'base58' },
  });

  const IRONWOOD_RECEIVER = Buffer.from(
    'd632c28aa0831d671be17709a42c9627e2eb687a1b2a55768ea470c9bae7499cd0bd3d0eb0484e307236b5',
    'hex'
  );
  // utxo-core's DUAL_RECEIVER_UA: a ZIP-316 UA with BOTH transparent and Orchard receivers.
  const DUAL_RECEIVER_UA = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../fixtures/tzec/unified_address.json'), 'utf8')
  ).unified as string;
  // utxo-core's plain t-address (the fixture UA's transparent receiver; not wallet-derived).
  const PLAIN_T_ADDRESS = 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk';
  let unifiedAddress: string; // orchard-only single-receiver UA

  before(function () {
    unifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(IRONWOOD_RECEIVER),
      'tzec'
    );
  });

  /** Build a v6 (Ironwood) prebuild with wallet change and shielded outputs, as utxo-core's
   * `createShieldedPsbt` does. */
  function buildShieldedV6PrebuildHex(recipients: { amount: bigint }[] = [{ amount: 5000n }]): string {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    psbt.addShieldedOutputs(
      recipients.map((r) => ({
        recipient: new Uint8Array(IRONWOOD_RECEIVER),
        amount: r.amount,
        unifiedAddress,
      })),
      new Uint8Array(32)
    );
    return Buffer.from(psbt.serialize()).toString('hex');
  }

  /** Build a legacy v4 (Sapling) prebuild with wallet change and transparent outputs, as
   * utxo-core's transparent builder does. `unifiedAddress` stores the original UA verbatim in
   * the PSBT's proprietary key-value map, exactly like the build path's recipient resolver. */
  function buildTransparentV4PrebuildHex(
    recipients: { address: string; amount: bigint; unifiedAddress?: string }[]
  ): string {
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 1 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
    for (const recipient of recipients) {
      psbt.addTransparentOutput(
        new Uint8Array(zecTyped.resolveOutputScript(recipient.address)),
        recipient.amount,
        recipient.unifiedAddress
      );
    }
    return Buffer.from(psbt.serialize()).toString('hex');
  }

  function nockVerifyFlow(): nock.Scope[] {
    const nocks: nock.Scope[] = [];
    keyDocumentObjects.forEach((keyDocument) => {
      nocks.push(nock(bgUrl).get(`/api/v2/tzec/key/${keyDocument.id}`).times(4).reply(200, keyDocument));
    });
    // addresses not derivable from the wallet keys are external; the 404 classifies them as such
    nocks.push(
      nock(bgUrl)
        .get(/\/api\/v2\/tzec\/wallet\/walletId\/address\//)
        .reply(404)
    );
    return nocks;
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('sendMany recipient validation accepts the unified address', function () {
    zec.checkRecipient({ address: unifiedAddress, amount: '5000' });
  });

  it('postProcessPrebuild decodes the v6 psbt and re-encodes it unchanged', async function () {
    const prebuildHex = buildShieldedV6PrebuildHex();
    nock(bgUrl).get('/api/v2/tzec/public/block/latest').reply(200, { height: 4200000 });
    const prebuild = await zec.postProcessPrebuild({ txHex: prebuildHex, txInfo: {} });
    assert.match(prebuild.txHex as string, /^70736274/); // PSBT magic preserved
    const decoded = zec.decodeTransaction(prebuild.txHex as string);
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
  });

  it('explainTransaction decodes the v6 psbt and resolves the shielded recipient', async function () {
    const explained = await zec.explainTransaction({
      txHex: buildShieldedV6PrebuildHex(),
      pubs: [keyDocumentObjects[0].pub, keyDocumentObjects[1].pub, keyDocumentObjects[2].pub],
    });
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].address, unifiedAddress);
    assert.strictEqual(explained.outputs[0].amount.toString(), '5000');
    assert.strictEqual(explained.changeOutputs.length, 1);
  });

  it('resolveRecipientsFromPsbt resolves the shielded recipient with its original UA', function () {
    const recipients = zecTyped.resolveRecipientsFromPsbt(buildShieldedV6PrebuildHex(), walletKeys);
    assert.strictEqual(recipients.length, 1);
    assert.strictEqual(recipients[0].destination.kind, 'zcashShielded');
    assert.strictEqual(recipients[0].unifiedAddress, unifiedAddress);
    assert.strictEqual(Buffer.from(recipients[0].script).toString('hex'), IRONWOOD_RECEIVER.toString('hex'));
  });

  describe('client-side verification', function () {
    /** Build verify params. `unifiedRecipientPreference` is omitted when not given, so the
     * coin-side inference runs — mirroring a client that did not pass the preference. */
    function shieldedVerifyParams(
      overrides: {
        recipients?: { address: string; amount: string }[];
        txHex?: string;
        unifiedRecipientPreference?: string;
      } = {}
    ): VerifyTransactionOptions {
      const txParams: TransactionParams = {
        recipients: overrides.recipients ?? [{ address: unifiedAddress, amount: '5000' }],
      };
      if (overrides.unifiedRecipientPreference !== undefined) {
        txParams.unifiedRecipientPreference = overrides.unifiedRecipientPreference;
      }
      return {
        txParams,
        txPrebuild: { txHex: overrides.txHex ?? buildShieldedV6PrebuildHex(), txInfo: {} },
        // getUtxoWallet returns the loosely-typed sdk-core Wallet; the coin's verify path
        // only reads the wallet's id and keys through it.
        wallet: zecWallet as unknown as UtxoWallet,
        verification: {},
      };
    }

    it('verifies recipients, amounts, and wallet change on a shielded prebuild', async function () {
      nockVerifyFlow();
      assert.strictEqual(
        await zec.verifyTransaction(shieldedVerifyParams({ unifiedRecipientPreference: 'shielded' })),
        true
      );
    });

    it('rejects when a recipient amount does not match the prebuild', async function () {
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(
          shieldedVerifyParams({
            unifiedRecipientPreference: 'shielded',
            recipients: [{ address: unifiedAddress, amount: '6000' }],
          })
        ),
        /expected outputs missing in transaction prebuild/
      );
    });

    it('rejects when a recipient address does not match the prebuild', async function () {
      // A different, valid orchard-only UA: shielded-capable, so it passes the capability
      // check but pays a different receiver than the prebuild does.
      const otherReceiver = Buffer.from(IRONWOOD_RECEIVER);
      otherReceiver[0] ^= 0xff;
      const otherUa = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
        new Uint8Array(otherReceiver),
        'tzec'
      );
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(
          shieldedVerifyParams({
            unifiedRecipientPreference: 'shielded',
            recipients: [{ address: otherUa, amount: '5000' }],
          })
        ),
        /expected outputs missing in transaction prebuild/
      );
    });

    it('rejects when change does not go back to the wallet', async function () {
      // Replace the wallet change output with an output to an unrelated external address; the
      // same recipient is still paid, so only the tampered change should fail verification.
      const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
      psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
        scriptId: { chain: 0, index: 0 },
      });
      psbt.addTransparentOutput(new Uint8Array(zecTyped.resolveOutputScript(PLAIN_T_ADDRESS)), 90000n);
      psbt.addShieldedOutputs(
        [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
        new Uint8Array(32)
      );
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(shieldedVerifyParams({ txHex: Buffer.from(psbt.serialize()).toString('hex') })),
        /prebuild attempts to spend to unintended external recipients/
      );
    });

    it('infers the shielded preference from an Orchard-only recipient when the caller omits it', async function () {
      nockVerifyFlow();
      assert.strictEqual(await zec.verifyTransaction(shieldedVerifyParams()), true);
    });

    it('rejects an ambiguous multi-receiver recipient with no explicit preference', async function () {
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(shieldedVerifyParams({ recipients: [{ address: DUAL_RECEIVER_UA, amount: '5000' }] })),
        /carries both transparent and Orchard receivers; specify unifiedRecipientPreference/
      );
    });

    it('rejects mixed shielded and transparent recipients with no explicit preference', async function () {
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(
          shieldedVerifyParams({
            recipients: [
              { address: unifiedAddress, amount: '5000' },
              { address: PLAIN_T_ADDRESS, amount: '1000' },
            ],
          })
        ),
        /Mixed shielded and transparent recipients are not supported/
      );
    });

    // -- scenarios mirroring utxo-core buildTransaction.spec.ts (shielded end-to-end and
    // preference-inference blocks): build the PSBT like the indexer, then verify --

    it('verifies an explicit transparent preference where the dual-receiver UA pays its transparent receiver', async function () {
      // utxo-core: 'builds transparently with an explicit transparent preference for a
      // dual-receiver UA alongside a transparent address'
      nockVerifyFlow();
      assert.strictEqual(
        await zec.verifyTransaction(
          shieldedVerifyParams({
            unifiedRecipientPreference: 'transparent',
            recipients: [
              { address: DUAL_RECEIVER_UA, amount: '5000' },
              { address: PLAIN_T_ADDRESS, amount: '2500' },
            ],
            txHex: buildTransparentV4PrebuildHex([
              { address: DUAL_RECEIVER_UA, amount: 5000n, unifiedAddress: DUAL_RECEIVER_UA },
              { address: PLAIN_T_ADDRESS, amount: 2500n },
            ]),
          })
        ),
        true
      );
    });

    it('handles several unified-address recipients alongside a plain t-address', async function () {
      nockVerifyFlow();
      assert.strictEqual(
        await zec.verifyTransaction(
          shieldedVerifyParams({
            unifiedRecipientPreference: 'transparent',
            recipients: [
              { address: DUAL_RECEIVER_UA, amount: '5000' },
              { address: DUAL_RECEIVER_UA, amount: '2500' },
              { address: PLAIN_T_ADDRESS, amount: '1250' },
            ],
            txHex: buildTransparentV4PrebuildHex([
              { address: DUAL_RECEIVER_UA, amount: 5000n, unifiedAddress: DUAL_RECEIVER_UA },
              { address: DUAL_RECEIVER_UA, amount: 2500n, unifiedAddress: DUAL_RECEIVER_UA },
              { address: PLAIN_T_ADDRESS, amount: 1250n },
            ]),
          })
        ),
        true
      );
    });

    it('rejects an explicit transparent preference on an orchard-only UA', async function () {
      // utxo-core: 'honors an explicit transparent preference, failing on an orchard-only UA'
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(shieldedVerifyParams({ unifiedRecipientPreference: 'transparent' })),
        /unified address has no transparent receiver/
      );
    });

    it('rejects an explicit shielded preference when a plain t-address is mixed in', async function () {
      // utxo-core: 'honors an explicit shielded preference for a dual-receiver UA alongside a
      // transparent address, rejecting the mix'
      nockVerifyFlow();
      await assert.rejects(
        zec.verifyTransaction(
          shieldedVerifyParams({
            unifiedRecipientPreference: 'shielded',
            recipients: [
              { address: DUAL_RECEIVER_UA, amount: '5000' },
              { address: PLAIN_T_ADDRESS, amount: '2500' },
            ],
          })
        ),
        /Mixed shielded and transparent recipients are not supported/
      );
    });

    it('infers shielded with no preference when every recipient is an orchard-only UA', async function () {
      // utxo-core: 'infers shielded when no preference is set and every recipient is an
      // orchard-only UA'
      nockVerifyFlow();
      assert.strictEqual(
        await zec.verifyTransaction(
          shieldedVerifyParams({
            recipients: [
              { address: unifiedAddress, amount: '2500' },
              { address: unifiedAddress, amount: '2500' },
            ],
            txHex: buildShieldedV6PrebuildHex([{ amount: 2500n }, { amount: 2500n }]),
          })
        ),
        true
      );
    });

    it('infers transparent with no preference when recipients are plain transparent addresses', async function () {
      // utxo-core: 'infers transparent when no preference is set and recipients are plain
      // transparent addresses'
      nockVerifyFlow();
      assert.strictEqual(
        await zec.verifyTransaction(
          shieldedVerifyParams({
            recipients: [{ address: PLAIN_T_ADDRESS, amount: '5000' }],
            txHex: buildTransparentV4PrebuildHex([{ address: PLAIN_T_ADDRESS, amount: 5000n }]),
          })
        ),
        true
      );
    });
  });
});
