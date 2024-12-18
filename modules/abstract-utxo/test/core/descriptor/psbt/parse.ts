import assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';

import { parse } from '../../../../src/core/descriptor';
import { DescriptorTemplate, getDefaultXPubs, getDescriptorMap } from '../descriptor.utils';
import { getFixture } from '../../fixtures.utils';
import { ParsedDescriptorTransaction } from '../../../../src/core/descriptor/psbt/parse';
import { toPlainObject } from '../../toPlainObject.utils';

import { mockPsbtDefaultWithDescriptorTemplate } from './mock.utils';

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
