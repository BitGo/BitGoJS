/**
 * Kaspa (KASPA) Test Fixtures
 *
 * Deterministic test data derived from a fixed private key.
 * Do NOT use these keys in production.
 */

import { KeyPair } from '../../src/lib/keyPair';
import { compressedToXOnly, buildP2PKScriptPublicKey } from '../../src/lib/sighash';
import { KaspaTransactionData, KaspaUtxoInput } from '../../src/lib/iface';

// Fixed 32-byte private key for deterministic tests only
export const TEST_PRV_KEY = 'b94f5374fce5edbc8e2a8697c15331677e6ebf0b000000000000000000000001';

const _kp = new KeyPair({ prv: TEST_PRV_KEY });
const _keys = _kp.getKeys();
const _xOnlyPub = compressedToXOnly(Buffer.from(_keys.pub, 'hex'));
const _scriptPublicKey = buildP2PKScriptPublicKey(_xOnlyPub).toString('hex');

export const KEYS = {
  prv: TEST_PRV_KEY,
  pub: _keys.pub,
};

export const ADDRESSES = {
  valid: _kp.getAddress('mainnet'),
  testnet: _kp.getAddress('testnet'),
  invalid: 'notanaddress',
  sender: _kp.getAddress('mainnet'),
  recipient: _kp.getAddress('mainnet'),
};

export const SCRIPT_PUBLIC_KEY = _scriptPublicKey;

// Getters return fresh objects to prevent mutation leakage between tests
export const UTXOS = {
  get simple(): KaspaUtxoInput {
    return {
      transactionId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionIndex: 0,
      amount: '100000000',
      scriptPublicKey: _scriptPublicKey,
      sequence: '0',
      sigOpCount: 1,
    };
  },
  get second(): KaspaUtxoInput {
    return {
      transactionId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      transactionIndex: 1,
      amount: '200000000',
      scriptPublicKey: _scriptPublicKey,
      sequence: '0',
      sigOpCount: 1,
    };
  },
};

// Use getter functions to return fresh deep copies, preventing test mutation leakage
export const TRANSACTIONS = {
  get simple(): KaspaTransactionData {
    return JSON.parse(
      JSON.stringify({
        version: 0,
        inputs: [UTXOS.simple],
        outputs: [
          {
            address: _kp.getAddress('mainnet'),
            amount: '99998000',
            scriptPublicKey: _scriptPublicKey,
          },
        ],
        fee: '2000',
        lockTime: '0',
        subnetworkId: '0000000000000000000000000000000000000000',
        payload: '',
      })
    ) as KaspaTransactionData;
  },
  get multiInput(): KaspaTransactionData {
    return JSON.parse(
      JSON.stringify({
        version: 0,
        inputs: [UTXOS.simple, UTXOS.second],
        outputs: [
          {
            address: _kp.getAddress('mainnet'),
            amount: '299998000',
            scriptPublicKey: _scriptPublicKey,
          },
        ],
        fee: '2000',
        lockTime: '0',
        subnetworkId: '0000000000000000000000000000000000000000',
        payload: '',
      })
    ) as KaspaTransactionData;
  },
};
