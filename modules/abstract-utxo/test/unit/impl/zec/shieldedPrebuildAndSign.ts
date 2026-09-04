import * as assert from 'assert';

import nock = require('nock');
import { common } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { getUtxoCoin, defaultBitGo } from '../../util';
import { getDefaultWasmWalletKeys, keychainsBase58 } from '../../util/keychains';
import { Zec } from '../../../../src/impl/zec';
/**
 * Exercises every client-side flow that runs BEFORE verifyTransaction/signTransaction on a
 * shielded (v6 Ironwood) prebuild: prebuild post-processing, explanation, and recipient
 * resolution. Each of them must decode the v6 PSBT and resolve the shielded recipient without
 * error.
 */
describe('Zec shielded pre-verify flows (v6 Ironwood PSBT)', function () {
  const zec = getUtxoCoin('tzec');
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
  const IRONWOOD_RECEIVER = Buffer.from(
    'd632c28aa0831d671be17709a42c9627e2eb687a1b2a55768ea470c9bae7499cd0bd3d0eb0484e307236b5',
    'hex'
  );
  let unifiedAddress: string;

  before(function () {
    unifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(IRONWOOD_RECEIVER),
      'tzec'
    );
  });

  function buildShieldedV6PrebuildHex(): string {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
      new Uint8Array(32)
    );
    return Buffer.from(psbt.serialize()).toString('hex');
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
    const recipients = (zec as Zec).resolveRecipientsFromPsbt(buildShieldedV6PrebuildHex(), walletKeys);
    assert.strictEqual(recipients.length, 1);
    assert.strictEqual(recipients[0].destination.kind, 'zcashShielded');
    assert.strictEqual(recipients[0].unifiedAddress, unifiedAddress);
    assert.strictEqual(Buffer.from(recipients[0].script).toString('hex'), IRONWOOD_RECEIVER.toString('hex'));
  });
});
