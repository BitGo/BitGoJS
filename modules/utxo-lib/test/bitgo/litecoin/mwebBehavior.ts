import * as assert from 'assert';

import * as path from 'path';
import * as fs from 'fs-extra';

import { networks } from '../../../src';
import {
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  createPsbtFromTransaction,
  createTransactionFromBuffer,
  LitecoinPsbt,
  LitecoinTransaction,
  NonWitnessWalletUnspent,
} from '../../../src/bitgo';
import { getDefaultWalletKeys, mockWalletUnspent } from '../../../src/testutil';

const network = networks.litecoin;

async function getFixture<T>(name: string): Promise<T> {
  const p = path.join(__dirname, 'fixtures', name);
  return JSON.parse(await fs.readFile(p, 'utf-8'));
}

async function getFixtureAsBuffer(name: string): Promise<Buffer> {
  return Buffer.from(await getFixture<string>(name), 'hex');
}

async function getTransaction(mweb: boolean): Promise<LitecoinTransaction<bigint>> {
  return createTransactionFromBuffer(await getFixtureAsBuffer(`ltc-${mweb ? 'mweb-' : ''}transaction.json`), network, {
    amountType: 'bigint',
  });
}

describe('Litecoin Transaction', function () {
  it('mweb transaction gets round-tripped to a non-mweb transaction', async function () {
    const mweb = await getTransaction(true);
    assert(mweb instanceof LitecoinTransaction);
    const nonMwebFixture = await getFixture(`ltc-transaction.json`);
    assert.deepStrictEqual(mweb.toHex(), nonMwebFixture);
  });

  it('non-mweb transaction gets round-tripped to a non-mweb transaction', async function () {
    const nonMweb = await getTransaction(false);

    assert(nonMweb instanceof LitecoinTransaction);

    const nonMwebFixture = await getFixture(`ltc-transaction.json`);
    assert.deepStrictEqual(nonMweb.toHex(), nonMwebFixture);
  });

  it(`mweb transaction read from hex and buffer serialize to the same fixture`, async function () {
    const mweb = await getTransaction(true);
    const hex: string = await getFixture(`ltc-mweb-transaction.json`);
    const mwebBuffer = createTransactionFromBuffer(Buffer.from(hex, 'hex'), network, { amountType: 'bigint' });
    assert.deepStrictEqual(mweb.toHex(), mwebBuffer.toHex());
  });
});

describe('Litecoin Psbt', function () {
  it('LitecoinPsbt can read hex of a mweb transaction', async function () {
    const mwebTransaction = await getTransaction(true);
    const psbt = createPsbtFromTransaction(mwebTransaction, [
      {
        script: Buffer.from('f955ddd1845eb0cb2c4542ff04ace2695f9f88c6b7a1ac2fba0b91662cffacc9', 'hex'),
        value: BigInt(10000),
      },
    ]);
    assert(psbt instanceof LitecoinPsbt);
    assert.deepStrictEqual(psbt.getUnsignedTx().toHex(), await getFixture(`ltc-transaction.json`));
  });

  it('can add an input to a psbt whose prev transaction has a mweb serialization', async function () {
    const rootWalletKeys = getDefaultWalletKeys();

    const buf = await getFixtureAsBuffer(`ltc-mweb-transaction.json`);
    const tx = await createTransactionFromBuffer(buf, network, { amountType: 'bigint' });

    const psbt = createPsbtForNetwork({ network });
    assert(psbt instanceof LitecoinPsbt);

    const u = mockWalletUnspent(network, BigInt(9500), {
      chain: 0,
      index: 0,
      keys: rootWalletKeys,
      vout: 0,
      id: `${tx.getId()}:0`,
    });

    addWalletUnspentToPsbt(
      psbt,
      {
        ...u,
        prevTx: buf,
      } as NonWitnessWalletUnspent<bigint>,
      rootWalletKeys,
      'user',
      'bitgo'
    );
    assert(psbt.data.inputs.length > 0);

    // Check that the previous transaction buffer added does not have a MWEB flag
    const prevTxBuffer = psbt.data.inputs[0].nonWitnessUtxo;
    assert(prevTxBuffer);
    assert.deepStrictEqual(prevTxBuffer.toString('hex'), await getFixture(`ltc-transaction.json`));
  });
});
