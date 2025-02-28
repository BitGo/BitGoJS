import assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';

import { isExternalOutput, isInternalOutput } from '../../src/descriptor';

describe('decscriptor.Output', function () {
  const mockDescriptor = {} as Descriptor;

  it('isInternalOutput correctly identifies internal outputs', function () {
    const internalOutput = { value: 1n, descriptor: mockDescriptor };
    const externalOutput = { value: 1n };

    assert.strictEqual(isInternalOutput(internalOutput), true);
    assert.strictEqual(isInternalOutput(externalOutput), false);
  });

  it('isExternalOutput correctly identifies external outputs', function () {
    const internalOutput = { value: 1n, descriptor: mockDescriptor };
    const externalOutput = { value: 1n };

    assert.strictEqual(isExternalOutput(internalOutput), false);
    assert.strictEqual(isExternalOutput(externalOutput), true);
  });
});
