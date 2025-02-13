import assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';

import { parse } from '../../../src/descriptor';
import { DescriptorTemplate, getDefaultXPubs, getDescriptorMap } from '../../../src/testutil/descriptor/descriptors';
import { getFixture } from '../../../src/testutil/fixtures.utils';
import { ParsedDescriptorTransaction } from '../../../src/descriptor/psbt/parse';
import { toPlainObject } from '../../../src/testutil/toPlainObject.utils';
import { mockPsbtDefaultWithDescriptorTemplate } from '../../../src/testutil/descriptor/mock.utils';

function normalize(parsed: ParsedDescriptorTransaction) {
  return toPlainObject(
    parsed,
    {
      apply(v, path) {
        if (v instanceof Descriptor) {
          return v.toString();
        }
      },
    },
    []
  );
}

function describeWithTemplate(t: DescriptorTemplate) {
  describe(`parse ${t}`, function () {
    it('parses a PSBT with descriptors', async function () {
      const psbt = mockPsbtDefaultWithDescriptorTemplate(t);
      const parsed = normalize(parse(psbt, getDescriptorMap(t, getDefaultXPubs('a')), psbt.network));
      assert.deepStrictEqual(parsed, await getFixture(__dirname + `/fixtures/${t}.parse.json`, parsed));
    });
  });
}

describeWithTemplate('Wsh2Of3');
