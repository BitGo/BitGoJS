import * as assert from 'assert';

import { networks } from '../../../src';
import * as utxolib from '../../../src';
import { mockUnspents } from '../wallet/util';
import { getDefaultWalletKeys } from '../../testutil';
import { addWalletOutputToPsbt, getInternalChainCode, ZcashPsbt } from '../../../src/bitgo';

const network = networks.zcash;
const rootWalletKeys = getDefaultWalletKeys();

describe('Zcash PSBT', function () {
  let psbt: utxolib.bitgo.ZcashPsbt;
  before(async function () {
    const unspents = mockUnspents(rootWalletKeys, ['p2sh'], BigInt('10000000000000000'), network);
    psbt = await utxolib.bitgo.ZcashPsbt.createPsbt({ network });

    unspents.forEach((unspent) => {
      utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, rootWalletKeys, 'user', 'bitgo', network);
    });
    addWalletOutputToPsbt(psbt, rootWalletKeys, getInternalChainCode('p2sh'), 0, BigInt('1000000000000000'));
  });

  describe('txHex should serialize psbt', function () {
    function testToHexForVersion(version: number) {
      it(`version ${version} should serialize properly`, async function () {
        psbt.setDefaultsForVersion(network, version);
        assert.deepStrictEqual(psbt.toHex(), psbt.toBuffer().toString('hex'));
      });
    }
    [400, 450, 500].forEach((version) => testToHexForVersion(version));

    function testFromHexForVersion(version: number) {
      it(`version ${version} should deserialize from toHex`, async function () {
        psbt.setDefaultsForVersion(network, version);
        const psbtHex = psbt.toHex();
        const psbt2Hex = ZcashPsbt.fromHex(psbtHex, { network }).toHex();
        assert.deepStrictEqual(psbt2Hex, psbtHex);
      });
    }
    [400, 450, 500].forEach((version) => testFromHexForVersion(version));
  });
});
