import * as assert from 'assert';
import { WasmAdapterRegistry } from '../../src';
import type { WasmCoinAdapter } from '../../src';

describe('WasmAdapterRegistry', function () {
  it('registers and retrieves adapters by coin', function () {
    const registry = new WasmAdapterRegistry();
    const adapter: WasmCoinAdapter = {
      coin: 'test',
      capabilities: new Set(['parseTransaction']),
      parseTransaction: () => ({ inputs: [], outputs: [], raw: null }),
    };
    registry.register(adapter);
    const retrieved = registry.get('test');
    assert.strictEqual(retrieved, adapter);
    assert.strictEqual(retrieved.coin, 'test');
  });

  it('throws for unknown coin', function () {
    const registry = new WasmAdapterRegistry();
    assert.throws(() => registry.get('unknown'), /No WASM adapter registered for coin: unknown/);
  });

  it('has() returns correct values', function () {
    const registry = new WasmAdapterRegistry();
    registry.register({ coin: 'x', capabilities: new Set() });
    assert.ok(registry.has('x'));
    assert.ok(!registry.has('y'));
  });

  it('lists registered coins', function () {
    const registry = new WasmAdapterRegistry();
    registry.register({ coin: 'a', capabilities: new Set() });
    registry.register({ coin: 'b', capabilities: new Set() });
    assert.deepStrictEqual(registry.registeredCoins().sort(), ['a', 'b']);
  });
});

describe('WasmCoinAdapter dispatch', function () {
  it('adapter parseTransaction is callable', async function () {
    const registry = new WasmAdapterRegistry();
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
    const adapter = registry.get('mock');
    const result = await Promise.resolve(adapter.parseTransaction!({ txHex: '0xdeadbeef' }));
    assert.strictEqual(result.id, 'test-id');
    assert.strictEqual(result.outputs?.[0].address, 'addr2');
  });

  it('adapter deriveAddress is callable', async function () {
    const registry = new WasmAdapterRegistry();
    registry.register({
      coin: 'mock',
      capabilities: new Set(['deriveAddress']),
      deriveAddress: (_params: unknown) => ({ address: 'EQTEST', raw: null }),
    });
    const adapter = registry.get('mock');
    const result = await Promise.resolve(adapter.deriveAddress!({ address: 'raw' }));
    assert.strictEqual(result.address, 'EQTEST');
  });

  it('capabilities set is correct', function () {
    const registry = new WasmAdapterRegistry();
    registry.register({ coin: 'x', capabilities: new Set(['deriveAddress', 'buildTransaction']) });
    const adapter = registry.get('x');
    assert.ok(adapter.capabilities.has('deriveAddress'));
    assert.ok(adapter.capabilities.has('buildTransaction'));
    assert.ok(!adapter.capabilities.has('parseTransaction'));
  });
});
