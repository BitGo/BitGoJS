import * as assert from 'assert';
import { WasmCoinRegistry, AbstractWasmCoin } from '../../src';
import type { WasmCoinAdapter } from '../../src';

describe('WasmCoinRegistry', function () {
  it('registers and retrieves adapters by coin', function () {
    const registry = new WasmCoinRegistry();
    const adapter: WasmCoinAdapter = {
      coin: 'test',
      capabilities: new Set(['parseTransaction']),
      parseTransaction: () => ({ inputs: [], outputs: [], raw: null }),
    };
    registry.register(adapter);
    const wasm = registry.get('test');
    assert.ok(wasm instanceof AbstractWasmCoin);
    assert.strictEqual(wasm.coin, 'test');
  });

  it('throws for unknown coin', function () {
    const registry = new WasmCoinRegistry();
    assert.throws(() => registry.get('unknown'), /No WASM adapter registered for coin: unknown/);
  });

  it('lists registered coins', function () {
    const registry = new WasmCoinRegistry();
    registry.register({ coin: 'a', capabilities: new Set(), });
    registry.register({ coin: 'b', capabilities: new Set(), });
    assert.deepStrictEqual(registry.registeredCoins().sort(), ['a', 'b']);
  });
});

describe('AbstractWasmCoin', function () {
  it('throws on unsupported deriveAddress', async function () {
    const registry = new WasmCoinRegistry();
    registry.register({ coin: 'x', capabilities: new Set(['parseTransaction']), parseTransaction: () => ({ raw: null }) });
    const wasm = registry.get('x');
    await assert.rejects(() => wasm.deriveAddress({}), /deriveAddress is not supported/);
  });

  it('throws on unsupported parseTransaction', async function () {
    const registry = new WasmCoinRegistry();
    registry.register({ coin: 'x', capabilities: new Set() });
    const wasm = registry.get('x');
    await assert.rejects(() => wasm.parseTransaction({}), /parseTransaction is not supported/);
  });

  it('throws on unsupported buildTransaction', async function () {
    const registry = new WasmCoinRegistry();
    registry.register({ coin: 'x', capabilities: new Set() });
    const wasm = registry.get('x');
    await assert.rejects(() => wasm.buildTransaction({}), /buildTransaction is not supported/);
  });

  it('reports capabilities correctly', function () {
    const registry = new WasmCoinRegistry();
    registry.register({ coin: 'x', capabilities: new Set(['deriveAddress', 'buildTransaction']) });
    const wasm = registry.get('x');
    assert.ok(wasm.hasCapability('deriveAddress'));
    assert.ok(wasm.hasCapability('buildTransaction'));
    assert.ok(!wasm.hasCapability('parseTransaction'));
  });

  it('calls through to the adapter', async function () {
    const registry = new WasmCoinRegistry();
    registry.register({
      coin: 'mock',
      capabilities: new Set(['parseTransaction']),
      parseTransaction: (_params: unknown) => ({
        id: 'test-id',
        inputs: [{ address: 'addr1', amount: '100' }],
        outputs: [{ address: 'addr2', amount: '100' }],
        raw: { mocked: true },
      }),
    });
    const wasm = registry.get('mock');
    const result = await wasm.parseTransaction({ txHex: '0xdeadbeef' });
    assert.strictEqual(result.id, 'test-id');
    assert.strictEqual(result.outputs?.[0].address, 'addr2');
  });
});
