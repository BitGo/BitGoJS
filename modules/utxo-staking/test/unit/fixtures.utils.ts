import assert from 'assert';

import { ast, Descriptor, Miniscript } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo-beta/utxo-lib';
import * as bitcoinjslib from 'bitcoinjs-lib';
import { getFixture } from '@bitgo-beta/utxo-core/testutil';
import { toPlainObjectFromTx, toPlainObjectFromPsbt } from '@bitgo-beta/utxo-core/testutil/descriptor';

export function normalize(v: unknown): unknown {
  if (typeof v === 'bigint') {
    return v.toString();
  }
  if (v instanceof Descriptor) {
    return v.toString();
  }
  if (v instanceof Uint8Array) {
    v = Buffer.from(v);
  }
  if (v instanceof Buffer) {
    return v.toString('hex');
  }
  if (v instanceof bitcoinjslib.Psbt) {
    v = utxolib.Psbt.fromBuffer(v.toBuffer());
  }
  if (v instanceof utxolib.Psbt) {
    return toPlainObjectFromPsbt(v);
  }
  if (v instanceof utxolib.Transaction) {
    return toPlainObjectFromTx(v);
  }
  if (Array.isArray(v)) {
    return v.map(normalize);
  }
  if (typeof v === 'object' && v !== null) {
    return Object.fromEntries(Object.entries(v).flatMap(([k, v]) => (v === undefined ? [] : [[k, normalize(v)]])));
  }
  return v;
}

type EqualsAssertion = typeof assert.deepStrictEqual;

export async function assertEqualsFixture(
  fixtureName: string,
  value: unknown,
  n = normalize,
  eq: EqualsAssertion = assert.deepStrictEqual
): Promise<void> {
  value = n(value);
  eq(await getFixture(fixtureName, value), value);
}

export async function assertTransactionEqualsFixture(fixtureName: string, tx: unknown): Promise<void> {
  await assertEqualsFixture(fixtureName, normalize(tx));
}

export function assertEqualsMiniscript(script: Buffer, miniscript: ast.MiniscriptNode): void {
  const ms = Miniscript.fromBitcoinScript(script, 'tap');
  assert.deepStrictEqual(ast.fromMiniscript(ms), miniscript);
  assert.deepStrictEqual(
    script.toString('hex'),
    Buffer.from(Miniscript.fromString(ast.formatNode(miniscript), 'tap').encode()).toString('hex')
  );
}
