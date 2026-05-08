import * as assert from 'assert';

import { networks } from '../../../src';
import * as utxolib from '../../../src';
import {
  addWalletOutputToPsbt,
  getInternalChainCode,
  ProprietaryKeySubtype,
  PSBT_PROPRIETARY_IDENTIFIER,
  WalletUnspent,
  ZcashPsbt,
  ZcashTransaction,
} from '../../../src/bitgo';
import { getDefaultWalletKeys } from '../../../src/testutil';

import { mockUnspents } from '../../../src/testutil/mock';

const network = networks.zcash;
const rootWalletKeys = getDefaultWalletKeys();

describe('Zcash PSBT', function () {
  let psbt: utxolib.bitgo.ZcashPsbt;
  before(async function () {
    const unspents = mockUnspents(rootWalletKeys, ['p2sh'], BigInt('1000000000000000'), network);
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
    [400, 450, 455, 456, 500, 550, 551].forEach((version) => testToHexForVersion(version));

    function testFromHexForVersion(version: number) {
      it(`version ${version} should deserialize from toHex`, async function () {
        psbt.setDefaultsForVersion(network, version);
        const psbtHex = psbt.toHex();
        const psbt2Hex = ZcashPsbt.fromHex(psbtHex, { network }).toHex();
        assert.deepStrictEqual(psbt2Hex, psbtHex);
      });
    }
    [400, 450, 455, 456, 500, 550, 551].forEach((version) => testFromHexForVersion(version));
  });

  describe('should be able to sign the transaction', function () {
    it('can sign the inputs', async function () {
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
    });

    it('can validate the signatures on the unspents', async function () {
      psbt.validateSignaturesOfAllInputs();
    });

    it('can finalize and extract the transaction', async function () {
      psbt.finalizeAllInputs();
      psbt.extractTransaction(true);
    });
  });

  it('if the consensus branch id is already in the global map, it should not be added again', function () {
    psbt.setDefaultsForVersion(network, 456);
    const psbtClone = ZcashPsbt.fromHex(psbt.toHex(), { network });
    const value = Buffer.alloc(4);
    value.writeUint32LE(ZcashTransaction.VERSION4_BRANCH_NU6_1);
    psbtClone.addUnknownKeyValToGlobal({
      key: Buffer.concat([
        Buffer.of(0xfc),
        Buffer.of(0x05),
        Buffer.from(PSBT_PROPRIETARY_IDENTIFIER),
        Buffer.of(ProprietaryKeySubtype.ZEC_CONSENSUS_BRANCH_ID),
      ]),
      value,
    });

    (psbtClone as ZcashPsbt).setDefaultsForVersion(network, ZcashTransaction.VERSION4_BRANCH_NU6_1);

    const psbtBuffer = psbtClone.toBuffer();
    const psbt2 = utxolib.bitgo.createPsbtFromBuffer(psbtBuffer, network);
    assert.deepStrictEqual(psbt2.toBuffer(), psbtBuffer);
  });
});
