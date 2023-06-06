import * as assert from 'assert';

import { networks } from '../../../src';
import * as utxolib from '../../../src';
import { addWalletOutputToPsbt, getInternalChainCode, WalletUnspent, ZcashPsbt } from '../../../src/bitgo';
import { getDefaultWalletKeys } from '../../../src/testutil';

import { mockUnspents } from '../../../src/testutil/mock';

const network = networks.zcash;
const rootWalletKeys = getDefaultWalletKeys();

describe('Zcash PSBT', function () {
  let psbt: utxolib.bitgo.ZcashPsbt;
  before(async function () {
    const unspents = mockUnspents(rootWalletKeys, ['p2sh'], BigInt('10000000000000000'), network);
    psbt = await utxolib.bitgo.ZcashPsbt.createPsbt({ network });

    unspents.forEach((unspent) => {
      utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent as WalletUnspent<bigint>, rootWalletKeys, 'user', 'bitgo');
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

  describe('should be able to sign the transaction', function () {
    it('can sign the inputs', async function () {
      psbt.signAllInputsHD(rootWalletKeys.user);
      assert(!(psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      assert(!(psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT);
    });

    it('can validate the signatures on the unspents', async function () {
      psbt.validateSignaturesOfAllInputs();
      assert(!(psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT);
    });

    it('can finalize and extract the transaction', async function () {
      psbt.finalizeAllInputs();
      psbt.extractTransaction(true);
    });
  });
});
