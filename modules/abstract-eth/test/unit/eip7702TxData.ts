import should from 'should';
import EthereumCommon from '@ethereumjs/common';
import { bufferToHex } from 'ethereumjs-util';
import { EthTransactionData } from '../../src/lib/types';
import { EIP7702TxData, ETHTransactionType } from '../../src/lib/iface';
import { KeyPair } from '../../src/lib/keyPair';
import {
  SET_CODE_TX_TYPE,
  buildSetCodeTransaction,
  getSetCodeTransactionSigningHash,
} from '../../src/lib/eip7702';

/**
 * Reference vector generated with the official @ethereumjs/tx v5
 * `EOACodeEIP7702Transaction` (hardfork prague, eips [7702]) for:
 *   chainId=1, nonce=0, maxPriorityFeePerGas=1, maxFeePerGas=30, gasLimit=21000,
 *   destination=address, value=0, data=0x, single authorization
 *   (chainId=1, address=address, nonce=0) signed by the same key.
 */
const ADDRESS = '0xbe78addef3bf432e660f0944e372954d1d287fe2';

const AUTH_R_BYTES = [
  25, 229, 118, 20, 137, 169, 86, 96, 43, 249, 69, 39, 108, 155, 222, 155, 34, 67, 100, 144, 182, 168, 92, 18, 23,
  212, 148, 74, 48, 85, 15, 18,
];
const AUTH_S_BYTES = [
  113, 131, 176, 111, 21, 92, 14, 192, 100, 196, 201, 90, 152, 101, 90, 103, 97, 132, 66, 18, 156, 199, 146, 43, 229,
  16, 60, 235, 190, 188, 221, 235,
];

const ENVELOPE_R_BYTES = [
  47, 223, 167, 78, 21, 168, 232, 3, 184, 81, 179, 23, 135, 208, 15, 246, 230, 97, 31, 50, 233, 68, 50, 252, 85, 107,
  206, 81, 237, 215, 86, 247,
];
const ENVELOPE_S_BYTES = [
  122, 136, 155, 55, 93, 184, 202, 64, 135, 102, 78, 167, 138, 136, 145, 21, 253, 192, 94, 138, 158, 241, 135, 149,
  161, 49, 99, 16, 51, 244, 161, 252,
];

const EXPECTED_SERIALIZED_BYTES = [
  4, 248, 192, 1, 128, 1, 30, 130, 82, 8, 148, 190, 120, 173, 222, 243, 191, 67, 46, 102, 15, 9, 68, 227, 114, 149,
  77, 29, 40, 127, 226, 128, 128, 192, 248, 92, 248, 90, 1, 148, 190, 120, 173, 222, 243, 191, 67, 46, 102, 15, 9, 68,
  227, 114, 149, 77, 29, 40, 127, 226, 128, 128, 160, 25, 229, 118, 20, 137, 169, 86, 96, 43, 249, 69, 39, 108, 155,
  222, 155, 34, 67, 100, 144, 182, 168, 92, 18, 23, 212, 148, 74, 48, 85, 15, 18, 160, 113, 131, 176, 111, 21, 92,
  14, 192, 100, 196, 201, 90, 152, 101, 90, 103, 97, 132, 66, 18, 156, 199, 146, 43, 229, 16, 60, 235, 190, 188, 221,
  235, 1, 160, 47, 223, 167, 78, 21, 168, 232, 3, 184, 81, 179, 23, 135, 208, 15, 246, 230, 97, 31, 50, 233, 68, 50,
  252, 85, 107, 206, 81, 237, 215, 86, 247, 160, 122, 136, 155, 55, 93, 184, 202, 64, 135, 102, 78, 167, 138, 136, 145,
  21, 253, 192, 94, 138, 158, 241, 135, 149, 161, 49, 99, 16, 51, 244, 161, 252,
];

const toHex = (bytes: number[]): string => bufferToHex(Buffer.from(bytes));

const SERIALIZED = bufferToHex(Buffer.from(EXPECTED_SERIALIZED_BYTES));

const common = EthereumCommon.forCustomChain('mainnet', { name: 'mainnet', networkId: 1, chainId: 1 }, 'london');

/** An unsigned EIP-7702 tx matching the reference vector (minus envelope signature). */
function buildEip7702TxData(): EIP7702TxData {
  return {
    _type: ETHTransactionType.EIP7702,
    nonce: 0,
    gasLimit: '21000',
    value: '0',
    data: '0x',
    to: ADDRESS,
    chainId: '0x1',
    maxFeePerGas: '30',
    maxPriorityFeePerGas: '1',
    authorizationList: [
      {
        chainId: 1,
        address: ADDRESS,
        nonce: 0,
        yParity: 0,
        r: toHex(AUTH_R_BYTES),
        s: toHex(AUTH_S_BYTES),
      },
    ],
  };
}

describe('EthTransactionData EIP-7702', () => {
  describe('fromJson / toJson', () => {
    it('round-trips an EIP7702TxData', () => {
      const tx = EthTransactionData.fromJson(buildEip7702TxData(), common);
      const json = tx.toJson();

      should.equal(json._type, ETHTransactionType.EIP7702);
      should.equal(json.nonce, 0);
      should.equal(json.gasLimit, '21000');
      should.equal(json.value, '0');
      should.equal(json.chainId, '0x1');
      should.equal((json as EIP7702TxData).maxFeePerGas, '30');
      should.equal((json as EIP7702TxData).maxPriorityFeePerGas, '1');
      should.equal(json.to!.toLowerCase(), ADDRESS.toLowerCase());
      should((json as EIP7702TxData).authorizationList).have.length(1);
      should.equal((json as EIP7702TxData).authorizationList[0].address.toLowerCase(), ADDRESS.toLowerCase());
      should.equal((json as EIP7702TxData).authorizationList[0].chainId, 1);
      should.equal((json as EIP7702TxData).authorizationList[0].nonce, 0);
    });

    it('exposes the envelope signature after parsing a signed tx', () => {
      const tx = EthTransactionData.fromSerialized(SERIALIZED, common);
      const json = tx.toJson();

      should.equal(json._type, ETHTransactionType.EIP7702);
      should.equal(json.v, '0x01');
      should.equal(json.r!.toLowerCase(), toHex(ENVELOPE_R_BYTES).toLowerCase());
      should.equal(json.s!.toLowerCase(), toHex(ENVELOPE_S_BYTES).toLowerCase());
    });
  });

  describe('fromSerialized', () => {
    it('parses the known-good 0x04 hex', () => {
      const tx = EthTransactionData.fromSerialized(SERIALIZED, common);
      const json = tx.toJson();

      should.equal(json.nonce, 0);
      should.equal(json.gasLimit, '21000');
      should.equal(json.to!.toLowerCase(), ADDRESS.toLowerCase());
      should((json as EIP7702TxData).authorizationList).have.length(1);
      should.equal((json as EIP7702TxData).authorizationList[0].address.toLowerCase(), ADDRESS.toLowerCase());
    });
  });

  describe('getSignablePayload', () => {
    it('returns the 32-byte envelope digest', () => {
      const tx = EthTransactionData.fromSerialized(SERIALIZED, common);
      const payload = tx.getSignablePayload();
      should.equal(payload.length, 32);

      const expected = getSetCodeTransactionSigningHash({
        chainId: 1,
        nonce: 0,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 30,
        gasLimit: 21000,
        destination: ADDRESS,
        value: 0,
        data: '0x',
        authorizationList: [
          {
            chainId: 1,
            address: ADDRESS,
            nonce: 0,
            yParity: 0,
            r: toHex(AUTH_R_BYTES),
            s: toHex(AUTH_S_BYTES),
          },
        ],
      });
      should.deepEqual(Buffer.from(payload), Buffer.from(expected));
    });

    it('is available for an unsigned tx built from JSON', () => {
      const tx = EthTransactionData.fromJson(buildEip7702TxData(), common);
      should.equal(tx.getSignablePayload().length, 32);
    });
  });

  describe('toSerialized', () => {
    it('produces byte-exact output matching the @ethereumjs reference vector', () => {
      const tx = EthTransactionData.fromSerialized(SERIALIZED, common);
      should.equal(tx.toSerialized().toLowerCase(), SERIALIZED.toLowerCase());
    });

    it('serializes a fromJson tx byte-for-byte with the reference vector', () => {
      const txData: EIP7702TxData = {
        ...buildEip7702TxData(),
        v: '1',
        r: toHex(ENVELOPE_R_BYTES),
        s: toHex(ENVELOPE_S_BYTES),
      };
      const tx = EthTransactionData.fromJson(txData, common);
      should.equal(tx.toSerialized().toLowerCase(), SERIALIZED.toLowerCase());
    });

    it('emits the 0x04 type byte', () => {
      const tx = EthTransactionData.fromJson(buildEip7702TxData(), common);
      should(tx.toSerialized().toLowerCase()).startWith(`0x${SET_CODE_TX_TYPE.toString(16).padStart(2, '0')}`);
    });
  });

  describe('sign', () => {
    it('produces an envelope signature over the signing hash', () => {
      const keyPair = new KeyPair({
        prv: 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
      });
      const tx = EthTransactionData.fromJson(buildEip7702TxData(), common);
      const payload = tx.getSignablePayload();
      tx.sign(keyPair);

      const json = tx.toJson();
      should.notEqual(json.r, '0x');
      should.notEqual(json.s, '0x');
      should(tx.toSerialized().toLowerCase()).startWith('0x04');

      // re-deriving the same digest after signing must match the pre-sign payload
      should.deepEqual(tx.getSignablePayload(), payload);
    });
  });
});