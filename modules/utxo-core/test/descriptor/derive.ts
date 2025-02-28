import assert from 'assert';

import { getDescriptor } from '../../src/testutil/descriptor';
import { getDescriptorAtIndex, getDescriptorAtIndexCheckScript } from '../../src/descriptor/derive';

describe('derive', function () {
  const derivable = getDescriptor('Wsh2Of3');
  const definite = derivable.atDerivationIndex(0);

  it('getDescriptorAtIndex', function () {
    assert(derivable.hasWildcard());
    assert(!definite.hasWildcard());
    assert.strictEqual(getDescriptorAtIndex(derivable, 0).toString(), definite.toString());
    assert.strictEqual(getDescriptorAtIndex(definite, undefined).toString(), definite.toString());
    assert.throws(() => getDescriptorAtIndex(derivable, undefined), /Derivable descriptor requires an index/);
    assert.throws(() => getDescriptorAtIndex(definite, 0), /Definite descriptor cannot be derived with index/);
  });

  it('getDescriptorAtIndexCheckScript', function () {
    const script0 = Buffer.from(derivable.atDerivationIndex(0).scriptPubkey());
    const script1 = Buffer.from(derivable.atDerivationIndex(1).scriptPubkey());
    assert.strictEqual(getDescriptorAtIndexCheckScript(derivable, 0, script0).toString(), definite.toString());
    assert.throws(() => getDescriptorAtIndexCheckScript(derivable, 0, script1), /Script mismatch/);
  });
});
