import * as assert from 'assert';

import { getTestVectorsBitcoinCashAddressTranslations } from './fixtures';
import { toOutputScriptFromCashAddress } from '../../../src/bitgo/bitcoincash/address';
import { getNetworkList, getNetworkName } from '../../../src';
import { isBitcoinCash } from '../../../src/networks';

getNetworkList()
  .filter(isBitcoinCash)
  .forEach((network) => {
    describe(`Cashaddr [${getNetworkName(network)}]`, function () {
      it('rejects mixed-case cashaddr', function () {
        getTestVectorsBitcoinCashAddressTranslations(network)
          .filter((v) => v.format === 'cashaddr')
          .forEach((v) => {
            const uppercase = [...v.input.toUpperCase()];
            const lowercase = [...v.input.toLowerCase()];
            const mixedCase = [...v.input].map((c, i) => (i % 2 === 0 ? uppercase[i] : lowercase[i]));
            assert.doesNotThrow(() => toOutputScriptFromCashAddress(lowercase.join(''), network));
            assert.doesNotThrow(() => toOutputScriptFromCashAddress(uppercase.join(''), network));
            assert.throws(() => toOutputScriptFromCashAddress(mixedCase.join(''), network));
          });
      });
    });
  });
