import * as assert from 'assert';
import * as fs from 'fs/promises';

import * as yargs from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { cmdPsbt } from '../src/commands';
import { formatTreeNoColor, getFixtureString } from './fixtures';
import { getKeyTriple } from './bip32.util';
import { TxParser } from '../src/TxParser';

async function runPsbtCommand(args: string[]) {
  return cmdPsbt.builder(yargs([])).strict().exitProcess(false).parse(args);
}

async function assertEqualFixture(path: string, fixture: string, network = utxolib.networks.bitcoin) {
  const actual = await fs.readFile(path, 'utf8');
  const expected = await getFixtureString(`test/fixtures/psbt/${fixture}`, actual);
  assert.strictEqual(actual, expected);
  const tx = path.endsWith('.psbt')
    ? utxolib.bitgo.createPsbtDecode(actual, network)
    : utxolib.bitgo.createTransactionFromBuffer(Buffer.from(actual, 'hex'), network, { amountType: 'bigint' });
  const parsed = new TxParser(TxParser.PARSE_ALL).parse(tx);
  const format = formatTreeNoColor(parsed, { showAll: true });
  assert.strictEqual(format, await getFixtureString(`test/fixtures/psbt/${fixture}.txt`, format));
}

function multi(n: number, xpubs: string[], path: string) {
  return 'multi(' + n + ',' + xpubs.map((xpub) => xpub + path).join(',') + ')';
}

function getAddressFromDescriptor(descriptor: Descriptor, network: utxolib.Network) {
  return utxolib.address.fromOutputScript(Buffer.from(descriptor.scriptPubkey()), network);
}

describe('cmdPsbt commands', function () {
  const keys = getKeyTriple('cmdPsbt');
  const xpubs = keys.map((k) => k.neutered().toBase58());
  const descriptorString = `wsh(${multi(2, xpubs, '/*')})`;
  const descriptor = Descriptor.fromString(descriptorString, 'derivable');

  it('creates empty psbt', async function () {
    await fs.rm('/tmp/test.psbt', { force: true });
    await runPsbtCommand(['create', '--path', '/tmp/test.psbt', '--edit']);
    await assertEqualFixture('/tmp/test.psbt', '1.empty.psbt');
  });

  it('adds descriptor input', async function () {
    const outputId = Buffer.alloc(32).fill(1).toString('hex') + ':0';
    await runPsbtCommand([
      'addDescriptorInput',
      '--path',
      '/tmp/test.psbt',
      '--edit',
      '--outputId',
      outputId,
      '--value',
      '1000000',
      '--descriptor',
      descriptorString,
      '--descriptorIndex',
      '0',
    ]);
    await assertEqualFixture('/tmp/test.psbt', '2.addDescriptorInput.psbt');
  });

  it('add output', async function () {
    await runPsbtCommand([
      'addOutput',
      '--path',
      '/tmp/test.psbt',
      '--edit',
      '--address',
      getAddressFromDescriptor(descriptor.atDerivationIndex(1), utxolib.networks.bitcoin),
      '--amount',
      '1111',
    ]);
    await assertEqualFixture('/tmp/test.psbt', '3.addOutput.psbt');
  });

  it('add max output', async function () {
    await runPsbtCommand([
      'addOutput',
      '--path',
      '/tmp/test.psbt',
      '--edit',
      '--address',
      getAddressFromDescriptor(descriptor.atDerivationIndex(2), utxolib.networks.bitcoin),
      '--amount',
      'max',
      '--feeRateSatB',
      '10',
    ]);

    await assertEqualFixture('/tmp/test.psbt', '4.addMaxOutput.psbt');
  });

  it('sign', async function () {
    await runPsbtCommand(['sign', '--path', '/tmp/test.psbt', '--edit', '--key', keys[0].toBase58()]);
    await runPsbtCommand(['sign', '--path', '/tmp/test.psbt', '--edit', '--key', keys[1].toBase58()]);
    await assertEqualFixture('/tmp/test.psbt', '5.sign.psbt');
  });

  it('finalize', async function () {
    await runPsbtCommand(['finalize', '--path', '/tmp/test.psbt', '--edit']);
    await assertEqualFixture('/tmp/test.psbt', '6.finalize.psbt');
  });

  it('extract', async function () {
    await runPsbtCommand(['extract', '--path', '/tmp/test.psbt', '--out', '/tmp/test.hex']);
    await assertEqualFixture('/tmp/test.hex', '7.extract.hex');
  });
});
