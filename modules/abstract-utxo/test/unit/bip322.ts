import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { bip322 as wasmBip322, fixedScriptWallet, BIP32, type Triple } from '@bitgo/wasm-utxo';

import {
  BIP322MessageBroadcastable,
  BIP322MessageInfo,
  deserializeBIP322BroadcastableMessage,
  generateBIP322MessageListAndVerifyFromMessageBroadcastable,
  serializeBIP322BroadcastableMessage,
  verifyTransactionFromBroadcastableMessage,
} from '../../src/transaction/bip322';

function createTestWalletKeys(seed: string): {
  xpubs: Triple<string>;
  xprivs: Triple<string>;
} {
  const keys = utxolib.testutil.getKeyTriple(seed);
  return {
    xpubs: keys.map((k) => k.neutered().toBase58()) as Triple<string>,
    xprivs: keys.map((k) => k.toBase58()) as Triple<string>,
  };
}

function getDerivedPubkeys(seed: string, chain: number, index: number): Triple<string> {
  const keys = utxolib.testutil.getKeyTriple(seed);
  return keys.map((k) => k.derivePath(`m/0/0/${chain}/${index}`).publicKey.toString('hex')) as Triple<string>;
}

function getAddress(walletKeys: fixedScriptWallet.RootWalletKeys, chain: number, index: number): string {
  return fixedScriptWallet.address(walletKeys, chain, index, utxolib.networks.bitcoin);
}

describe('BIP322', function () {
  describe('BIP322MessageBroadcastable', () => {
    it('should serialize and deserialize correctly', () => {
      const message: BIP322MessageBroadcastable = {
        txHex: '010203',
        messageInfo: [
          {
            address: 'someAddress',
            message: 'someMessage',
            pubkeys: ['pubkey1', 'pubkey2', 'pubkey3'],
            scriptType: 'p2sh',
          },
        ],
      };

      const serialized = serializeBIP322BroadcastableMessage(message);
      const deserialized = deserializeBIP322BroadcastableMessage(serialized);
      assert.deepStrictEqual(deserialized, message);
    });

    it('should fail if there is an unsupported script type', function () {
      const message = {
        txHex: '010203',
        messageInfo: [
          {
            address: 'someAddress',
            message: 'someMessage',
            pubkeys: ['pubkey1', 'pubkey2', 'pubkey3'],
            scriptType: 'unsupported',
          },
        ],
      } as unknown as BIP322MessageBroadcastable;

      const serialized = serializeBIP322BroadcastableMessage(message);
      assert.throws(() => {
        deserializeBIP322BroadcastableMessage(serialized);
      });
    });
  });

  describe('verifyTransactionFromBroadcastableMessage', function () {
    const seed = 'bip322_verify_test';
    const { xpubs, xprivs } = createTestWalletKeys(seed);
    const walletKeys = fixedScriptWallet.RootWalletKeys.from(xpubs);

    it('should verify a valid p2shP2wsh PSBT proof', function () {
      const chain = 10;
      const index = 0;
      const messageText = 'Hello, BitGo!';

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });

      // Sign with user and bitgo keys
      psbt.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastable: BIP322MessageBroadcastable = {
        txHex: Buffer.from(psbt.serialize()).toString('hex'),
        messageInfo: [
          {
            address,
            message: messageText,
            pubkeys,
            scriptType: 'p2shP2wsh',
          },
        ],
      };

      assert.strictEqual(verifyTransactionFromBroadcastableMessage(broadcastable, 'btc'), true);
    });

    it('should verify a valid p2wsh PSBT proof', function () {
      const chain = 20;
      const index = 5;
      const messageText = 'P2WSH proof test';

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });

      psbt.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastable: BIP322MessageBroadcastable = {
        txHex: Buffer.from(psbt.serialize()).toString('hex'),
        messageInfo: [
          {
            address,
            message: messageText,
            pubkeys,
            scriptType: 'p2wsh',
          },
        ],
      };

      assert.strictEqual(verifyTransactionFromBroadcastableMessage(broadcastable, 'btc'), true);
    });

    it('should verify multiple inputs in a single PSBT', function () {
      const messages = ['Message 1', 'Message 2'];
      const scriptIds = [
        { chain: 10, index: 0 },
        { chain: 20, index: 1 },
      ];
      const scriptTypes: BIP322MessageInfo['scriptType'][] = ['p2shP2wsh', 'p2wsh'];

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });

      for (let i = 0; i < messages.length; i++) {
        wasmBip322.addBip322Input(psbt, {
          message: messages[i],
          scriptId: scriptIds[i],
          rootWalletKeys: walletKeys,
        });
      }

      // Sign all inputs
      for (let i = 0; i < messages.length; i++) {
        psbt.sign(i, BIP32.fromBase58(xprivs[0]));
        psbt.sign(i, BIP32.fromBase58(xprivs[2]));
      }

      const messageInfo: BIP322MessageInfo[] = messages.map((msg, i) => {
        const pubkeys = getDerivedPubkeys(seed, scriptIds[i].chain, scriptIds[i].index);
        return {
          address: getAddress(walletKeys, scriptIds[i].chain, scriptIds[i].index),
          message: msg,
          pubkeys,
          scriptType: scriptTypes[i],
        };
      });

      const broadcastable: BIP322MessageBroadcastable = {
        txHex: Buffer.from(psbt.serialize()).toString('hex'),
        messageInfo,
      };

      assert.strictEqual(verifyTransactionFromBroadcastableMessage(broadcastable, 'btc'), true);
    });

    it('should return false for wrong message', function () {
      const chain = 10;
      const index = 0;
      const messageText = 'Original message';

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });

      psbt.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastable: BIP322MessageBroadcastable = {
        txHex: Buffer.from(psbt.serialize()).toString('hex'),
        messageInfo: [
          {
            address,
            message: 'Different message', // Wrong message
            pubkeys,
            scriptType: 'p2shP2wsh',
          },
        ],
      };

      assert.strictEqual(verifyTransactionFromBroadcastableMessage(broadcastable, 'btc'), false);
    });

    it('should throw for unsupported coin', function () {
      const broadcastable: BIP322MessageBroadcastable = {
        txHex: '00',
        messageInfo: [],
      };

      assert.throws(
        () => verifyTransactionFromBroadcastableMessage(broadcastable, 'ltc'),
        /Only tbtc4 or btc coinNames are supported/
      );
    });
  });

  describe('generateBIP322MessageListAndVerifyFromMessageBroadcastable', function () {
    const seed = 'bip322_generate_test';
    const { xpubs, xprivs } = createTestWalletKeys(seed);
    const walletKeys = fixedScriptWallet.RootWalletKeys.from(xpubs);

    it('should generate message list from valid proofs', function () {
      const chain = 10;
      const index = 0;
      const messageText = 'Proof message';

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });

      psbt.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastables: BIP322MessageBroadcastable[] = [
        {
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          messageInfo: [
            {
              address,
              message: messageText,
              pubkeys,
              scriptType: 'p2shP2wsh',
            },
          ],
        },
      ];

      const result = generateBIP322MessageListAndVerifyFromMessageBroadcastable(broadcastables, 'btc');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].address, address);
      assert.strictEqual(result[0].message, messageText);
    });

    it('should deduplicate addresses with same message', function () {
      const chain = 10;
      const index = 0;
      const messageText = 'Same message';

      // Create two separate PSBTs for the same address/message
      const psbt1 = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt1, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });
      psbt1.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt1.sign(0, BIP32.fromBase58(xprivs[2]));

      const psbt2 = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt2, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });
      psbt2.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt2.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastables: BIP322MessageBroadcastable[] = [
        {
          txHex: Buffer.from(psbt1.serialize()).toString('hex'),
          messageInfo: [{ address, message: messageText, pubkeys, scriptType: 'p2shP2wsh' }],
        },
        {
          txHex: Buffer.from(psbt2.serialize()).toString('hex'),
          messageInfo: [{ address, message: messageText, pubkeys, scriptType: 'p2shP2wsh' }],
        },
      ];

      const result = generateBIP322MessageListAndVerifyFromMessageBroadcastable(broadcastables, 'btc');

      // Should deduplicate to a single entry
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].address, address);
      assert.strictEqual(result[0].message, messageText);
    });

    it('should throw for duplicate address with different message', function () {
      const chain = 10;
      const index = 0;

      const psbt1 = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt1, {
        message: 'Message 1',
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });
      psbt1.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt1.sign(0, BIP32.fromBase58(xprivs[2]));

      const psbt2 = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt2, {
        message: 'Message 2',
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });
      psbt2.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt2.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastables: BIP322MessageBroadcastable[] = [
        {
          txHex: Buffer.from(psbt1.serialize()).toString('hex'),
          messageInfo: [{ address, message: 'Message 1', pubkeys, scriptType: 'p2shP2wsh' }],
        },
        {
          txHex: Buffer.from(psbt2.serialize()).toString('hex'),
          messageInfo: [{ address, message: 'Message 2', pubkeys, scriptType: 'p2shP2wsh' }],
        },
      ];

      assert.throws(
        () => generateBIP322MessageListAndVerifyFromMessageBroadcastable(broadcastables, 'btc'),
        /Duplicate address.*has different messages/
      );
    });

    it('should throw for invalid proof', function () {
      const chain = 10;
      const index = 0;
      const messageText = 'Valid message';

      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, { version: 0 });
      wasmBip322.addBip322Input(psbt, {
        message: messageText,
        scriptId: { chain, index },
        rootWalletKeys: walletKeys,
      });
      psbt.sign(0, BIP32.fromBase58(xprivs[0]));
      psbt.sign(0, BIP32.fromBase58(xprivs[2]));

      const pubkeys = getDerivedPubkeys(seed, chain, index);
      const address = getAddress(walletKeys, chain, index);

      const broadcastables: BIP322MessageBroadcastable[] = [
        {
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          messageInfo: [
            {
              address,
              message: 'Wrong message', // Doesn't match what was signed
              pubkeys,
              scriptType: 'p2shP2wsh',
            },
          ],
        },
      ];

      assert.throws(
        () => generateBIP322MessageListAndVerifyFromMessageBroadcastable(broadcastables, 'btc'),
        /did not have a successful validation/
      );
    });
  });
});
