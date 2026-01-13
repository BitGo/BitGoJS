import { coins, FlareNetwork } from '@bitgo/statics';
import * as assert from 'assert';
import { Utils } from '../../../src/lib/utils';
import {
  SEED_ACCOUNT,
  ACCOUNT_1,
  ACCOUNT_2,
  ACCOUNT_3,
  INVALID_SHORT_KEYPAIR_KEY,
  INVALID_LONG_KEYPAIR_PRV,
} from '../../resources/account';
import { ecc } from '@bitgo/secp256k1';
import { EXPORT_IN_C } from '../../resources/transactionData/exportInC';
import { IMPORT_IN_P } from '../../resources/transactionData/importInP';
import { EXPORT_IN_P } from '../../resources/transactionData/exportInP';
import { IMPORT_IN_C } from '../../resources/transactionData/importInC';
import { TransactionBuilderFactory, Transaction } from '../../../src/lib';
import { secp256k1, Address, Utxo } from '@flarenetwork/flarejs';

describe('Utils', function () {
  let utils: Utils;
  const network = coins.get('flrp').network as FlareNetwork;

  beforeEach(function () {
    utils = new Utils();
  });

  describe('decodedToUtxo', function () {
    const assetId = 'fxMAKpBQQpFedrUhWMsDYfCUJxdUw4mneTczKBzNg3rc2JUub';

    it('should convert DecodedUtxoObj to FlareJS Utxo', function () {
      const decodedUtxo = {
        outputID: 7,
        amount: '50000000',
        txid: '2XJ1MptpmBWVFSzCz44jauGLoooSFShZJM8aykSL1dfVHehFjn',
        threshold: 2,
        addresses: [
          'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut',
          'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu',
          'P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m',
        ],
        outputidx: '0',
        locktime: '0',
      };

      const convertedUtxo = utils.decodedToUtxo(decodedUtxo, assetId);

      assert.ok(convertedUtxo instanceof Utxo);
      assert.ok(convertedUtxo.utxoId, 'utxoId should exist');
      assert.ok(convertedUtxo.assetId, 'assetId should exist');
      assert.ok(convertedUtxo.output, 'output should exist');

      const expectedTxIdHex = 'c87b0455de7ba1a7a3ca508f2df8d9f54488b486a8600aa207229678ee13bb84';
      assert.strictEqual(Buffer.from(convertedUtxo.utxoId.txID.toBytes()).toString('hex'), expectedTxIdHex);

      assert.strictEqual(Number(convertedUtxo.utxoId.outputIdx.value()), 0);

      assert.strictEqual((convertedUtxo.output as any).amount().toString(), '50000000');
    });

    it('should convert array of DecodedUtxoObj to FlareJS Utxo array', function () {
      const decodedUtxos = [
        {
          outputID: 7,
          amount: '50000000',
          txid: '2XJ1MptpmBWVFSzCz44jauGLoooSFShZJM8aykSL1dfVHehFjn',
          threshold: 2,
          addresses: [
            'P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut',
            'P-costwo106gc5h5qswhye8e0pmthq4wzf0ekv5qppsrvpu',
            'P-costwo1cueygd7fd37g56s49k3rshqakhp6k8u3adzt6m',
          ],
          outputidx: '0',
          locktime: '0',
        },
      ];

      const convertedUtxos = utils.decodedToUtxos(decodedUtxos, assetId);

      assert.strictEqual(convertedUtxos.length, 1);
      assert.ok(convertedUtxos[0] instanceof Utxo);
      assert.strictEqual((convertedUtxos[0].output as any).amount().toString(), '50000000');
    });

    it('should handle locktime correctly', function () {
      const decodedUtxo = {
        outputID: 7,
        amount: '100000000',
        txid: '2XJ1MptpmBWVFSzCz44jauGLoooSFShZJM8aykSL1dfVHehFjn',
        threshold: 2,
        addresses: ['P-costwo1xv5mulgpe5lt4tnx2ntnylwe79azu9vpja6lut'],
        outputidx: '1',
        locktime: '1704067200',
      };

      const convertedUtxo = utils.decodedToUtxo(decodedUtxo, assetId);
      const outputOwners = convertedUtxo.getOutputOwners();

      assert.strictEqual(outputOwners.locktime.value().toString(), '1704067200');
    });
  });

  describe('includeIn', function () {
    it('should return true when all wallet addresses are in UTXO output addresses', function () {
      const walletAddresses = [EXPORT_IN_C.pAddresses[0], EXPORT_IN_C.pAddresses[1]];
      const utxoOutputAddresses = [...EXPORT_IN_C.pAddresses];
      assert.strictEqual(utils.includeIn(walletAddresses, utxoOutputAddresses), true);
    });

    it('should return false when some wallet addresses are not in UTXO output addresses', function () {
      const walletAddresses = [EXPORT_IN_C.pAddresses[0], ACCOUNT_3.address];
      const utxoOutputAddresses = [EXPORT_IN_C.pAddresses[0], EXPORT_IN_C.pAddresses[1]];
      assert.strictEqual(utils.includeIn(walletAddresses, utxoOutputAddresses), false);
    });

    it('should return true for empty wallet addresses', function () {
      const walletAddresses: string[] = [];
      const utxoOutputAddresses = [EXPORT_IN_C.pAddresses[0]];
      assert.strictEqual(utils.includeIn(walletAddresses, utxoOutputAddresses), true);
    });
  });

  describe('isValidAddress', function () {
    it('should return true for valid mainnet P-chain address', function () {
      assert.strictEqual(utils.isValidAddress(SEED_ACCOUNT.addressMainnet), true);
    });

    it('should return true for valid testnet P-chain address', function () {
      assert.strictEqual(utils.isValidAddress(SEED_ACCOUNT.addressTestnet), true);
    });

    it('should return true for valid NodeID address', function () {
      assert.strictEqual(utils.isValidAddress('NodeID-abc123xyz'), true);
    });

    it('should return true for array of valid addresses', function () {
      assert.strictEqual(utils.isValidAddress(EXPORT_IN_C.pAddresses), true);
    });

    it('should return true for tilde-separated addresses', function () {
      const combined = EXPORT_IN_C.pAddresses.join('~');
      assert.strictEqual(utils.isValidAddress(combined), true);
    });

    it('should return false for invalid address format', function () {
      assert.strictEqual(utils.isValidAddress('invalid'), false);
    });

    it('should return false for address without prefix', function () {
      assert.strictEqual(utils.isValidAddress('flare1abc123'), false);
    });
  });

  describe('isValidBlockId', function () {
    it('should return true for valid 32-byte hex block ID', function () {
      assert.strictEqual(utils.isValidBlockId(SEED_ACCOUNT.privateKey), true); // 64 hex chars = 32 bytes
    });

    it('should return false for invalid length block ID', function () {
      assert.strictEqual(utils.isValidBlockId(INVALID_SHORT_KEYPAIR_KEY), false);
    });

    it('should return false for empty block ID', function () {
      assert.strictEqual(utils.isValidBlockId(''), false);
    });
  });

  describe('isValidPublicKey', function () {
    it('should return true for valid compressed public key starting with 03', function () {
      assert.strictEqual(utils.isValidPublicKey(SEED_ACCOUNT.publicKey), true);
    });

    it('should return true for valid compressed public key starting with 02', function () {
      assert.strictEqual(utils.isValidPublicKey(ACCOUNT_1.publicKey), true);
    });

    it('should return true for another valid compressed public key', function () {
      assert.strictEqual(utils.isValidPublicKey(ACCOUNT_2.publicKey), true);
    });

    it('should return true for valid xpub', function () {
      assert.strictEqual(utils.isValidPublicKey(SEED_ACCOUNT.xPublicKey), true);
    });

    it('should return true for ACCOUNT_1 xpub', function () {
      assert.strictEqual(utils.isValidPublicKey(ACCOUNT_1.xPublicKey), true);
    });

    it('should return false for invalid short public key', function () {
      assert.strictEqual(utils.isValidPublicKey(INVALID_SHORT_KEYPAIR_KEY), false);
    });

    it('should return false for compressed key with wrong prefix', function () {
      const invalidKey = '05' + SEED_ACCOUNT.privateKey;
      assert.strictEqual(utils.isValidPublicKey(invalidKey), false);
    });

    it('should return false for non-hex public key', function () {
      const invalidKey = 'zz' + SEED_ACCOUNT.privateKey;
      assert.strictEqual(utils.isValidPublicKey(invalidKey), false);
    });
  });

  describe('isValidPrivateKey', function () {
    it('should return true for valid 64-char hex private key', function () {
      assert.strictEqual(utils.isValidPrivateKey(SEED_ACCOUNT.privateKey), true);
    });

    it('should return true for ACCOUNT_1 private key', function () {
      assert.strictEqual(utils.isValidPrivateKey(ACCOUNT_1.privateKey), true);
    });

    it('should return true for ACCOUNT_2 private key', function () {
      assert.strictEqual(utils.isValidPrivateKey(ACCOUNT_2.privateKey), true);
    });

    it('should return true for valid xprv', function () {
      assert.strictEqual(utils.isValidPrivateKey(SEED_ACCOUNT.xPrivateKey), true);
    });

    it('should return true for 66-char private key ending with 01', function () {
      const extendedKey = SEED_ACCOUNT.privateKey + '01';
      assert.strictEqual(utils.isValidPrivateKey(extendedKey), true);
    });

    it('should return false for 66-char private key not ending with 01', function () {
      assert.strictEqual(utils.isValidPrivateKey(INVALID_LONG_KEYPAIR_PRV), false);
    });

    it('should return false for invalid short private key', function () {
      assert.strictEqual(utils.isValidPrivateKey(INVALID_SHORT_KEYPAIR_KEY), false);
    });

    it('should return false for non-hex private key', function () {
      const invalidKey = 'zz' + SEED_ACCOUNT.privateKey.slice(2);
      assert.strictEqual(utils.isValidPrivateKey(invalidKey), false);
    });
  });

  describe('allHexChars', function () {
    it('should return true for valid private key hex', function () {
      assert.strictEqual(utils.allHexChars(SEED_ACCOUNT.privateKey), true);
    });

    it('should return true for valid public key hex', function () {
      assert.strictEqual(utils.allHexChars(SEED_ACCOUNT.publicKey), true);
    });

    it('should return true for hex string with 0x prefix', function () {
      assert.strictEqual(utils.allHexChars(EXPORT_IN_C.cHexAddress), true);
    });

    it('should return true for valid signature hex', function () {
      assert.strictEqual(utils.allHexChars(SEED_ACCOUNT.signature), true);
    });

    it('should return false for non-hex characters', function () {
      assert.strictEqual(utils.allHexChars('ghijkl'), false);
    });

    it('should return false for empty string', function () {
      assert.strictEqual(utils.allHexChars(''), false);
    });
  });

  describe('createSignature and verifySignature', function () {
    it('should create a valid 65-byte signature', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');

      const signature = utils.createSignature(network, message, privateKey);

      assert.ok(signature instanceof Buffer);
      assert.strictEqual(signature.length, 65);
    });

    it('should verify a valid signature', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');
      const publicKey = Buffer.from(SEED_ACCOUNT.publicKey, 'hex');

      const signature = utils.createSignature(network, message, privateKey);
      const sigOnly = signature.slice(0, 64);

      const messageHash = utils.sha256(message);
      const isValid = utils.verifySignature(messageHash, sigOnly, publicKey);
      assert.strictEqual(isValid, true);
    });

    it('should return false for invalid signature', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const publicKey = Buffer.from(SEED_ACCOUNT.publicKey, 'hex');
      const invalidSignature = Buffer.alloc(64);

      const messageHash = utils.sha256(message);
      const isValid = utils.verifySignature(messageHash, invalidSignature, publicKey);
      assert.strictEqual(isValid, false);
    });

    it('should create signature with ACCOUNT_1 keys', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(ACCOUNT_1.privateKey, 'hex');

      const signature = utils.createSignature(network, message, privateKey);

      assert.ok(signature instanceof Buffer);
      assert.strictEqual(signature.length, 65);
    });
  });

  describe('createNewSig', function () {
    it('should create a signature from valid signature hex string', function () {
      const sig = utils.createNewSig(SEED_ACCOUNT.signature);
      assert.ok(sig);
    });

    it('should create a signature from export signature hex', function () {
      const sigHex = utils.removeHexPrefix(EXPORT_IN_C.signature[0]);
      const sig = utils.createNewSig(sigHex);
      assert.ok(sig);
    });

    it('should pad short hex strings', function () {
      const sigHex = INVALID_SHORT_KEYPAIR_KEY;
      const sig = utils.createNewSig(sigHex);
      assert.ok(sig);
    });
  });

  describe('createEmptySigWithAddress and getAddressFromEmptySig', function () {
    it('should create empty signature with embedded C-chain address', function () {
      const addressHex = utils.removeHexPrefix(EXPORT_IN_C.cHexAddress);
      const sig = utils.createEmptySigWithAddress(addressHex);
      assert.ok(sig);
    });

    it('should extract embedded address from empty signature', function () {
      const addressHex = utils.removeHexPrefix(EXPORT_IN_C.cHexAddress).toLowerCase();
      const sig = utils.createEmptySigWithAddress(addressHex);

      // Get signature bytes and convert to hex
      const sigBytes = sig.toBytes();
      const sigHex = Buffer.from(sigBytes).toString('hex');

      const extractedAddress = utils.getAddressFromEmptySig(sigHex);
      assert.strictEqual(extractedAddress, addressHex);
    });

    it('should handle 0x prefixed address', function () {
      const sig = utils.createEmptySigWithAddress(EXPORT_IN_C.cHexAddress);
      assert.ok(sig);
    });

    it('should return empty string for short signature', function () {
      const shortSig = SEED_ACCOUNT.privateKey; // 64 chars, less than 130
      assert.strictEqual(utils.getAddressFromEmptySig(shortSig), '');
    });
  });

  describe('sha256', function () {
    it('should compute SHA256 hash of message', function () {
      const data = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const hash = utils.sha256(data);

      assert.ok(hash instanceof Buffer);
      assert.strictEqual(hash.length, 32);
    });

    it('should produce consistent hash for same input', function () {
      const data = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const hash1 = utils.sha256(data);
      const hash2 = utils.sha256(data);

      assert.deepStrictEqual(hash1, hash2);
    });

    it('should produce different hash for different input', function () {
      const data1 = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const data2 = Buffer.from(SEED_ACCOUNT.privateKey, 'utf8');
      const hash1 = utils.sha256(data1);
      const hash2 = utils.sha256(data2);

      assert.notDeepStrictEqual(hash1, hash2);
    });
  });

  describe('validateRawTransaction', function () {
    it('should not throw for valid unsigned hex transaction', function () {
      const rawTx = utils.removeHexPrefix(EXPORT_IN_C.unsignedHex);
      assert.doesNotThrow(() => utils.validateRawTransaction(rawTx));
    });

    it('should not throw for valid signed hex transaction', function () {
      const rawTx = utils.removeHexPrefix(EXPORT_IN_C.signedHex);
      assert.doesNotThrow(() => utils.validateRawTransaction(rawTx));
    });

    it('should not throw for import transaction hex', function () {
      const rawTx = utils.removeHexPrefix(IMPORT_IN_P.unsignedHex);
      assert.doesNotThrow(() => utils.validateRawTransaction(rawTx));
    });

    it('should throw for empty transaction', function () {
      assert.throws(() => utils.validateRawTransaction(''), /Raw transaction is empty/);
    });

    it('should throw for non-hex transaction', function () {
      assert.throws(() => utils.validateRawTransaction('xyz123'), /Raw transaction is not hex string/);
    });
  });

  describe('removeHexPrefix', function () {
    it('should remove 0x prefix from C-chain address', function () {
      assert.strictEqual(utils.removeHexPrefix(EXPORT_IN_C.cHexAddress), EXPORT_IN_C.cHexAddress.slice(2));
    });

    it('should remove 0x prefix from unsigned hex', function () {
      assert.strictEqual(utils.removeHexPrefix(EXPORT_IN_C.unsignedHex), EXPORT_IN_C.unsignedHex.slice(2));
    });

    it('should return string unchanged if no prefix', function () {
      assert.strictEqual(utils.removeHexPrefix(SEED_ACCOUNT.privateKey), SEED_ACCOUNT.privateKey);
    });

    it('should handle empty string', function () {
      assert.strictEqual(utils.removeHexPrefix(''), '');
    });
  });

  describe('outputidxNumberToBuffer and outputidxBufferToNumber', function () {
    it('should handle nonce value', function () {
      const nonceStr = EXPORT_IN_C.nonce.toString();
      const buffer = utils.outputidxNumberToBuffer(nonceStr);
      const result = utils.outputidxBufferToNumber(buffer);

      assert.strictEqual(result, nonceStr);
    });

    it('should produce 4-byte buffer', function () {
      const buffer = utils.outputidxNumberToBuffer('255');
      assert.strictEqual(buffer.length, 4);
    });
  });

  describe('addressToString', function () {
    it('should convert address buffer to mainnet bech32 string', function () {
      const address = SEED_ACCOUNT.addressMainnet;
      const addressBuffer = utils.parseAddress(address);
      const result = utils.addressToString('flare', 'P', addressBuffer);

      assert.ok(result.startsWith('P-'));
      assert.ok(result.includes('flare'));
    });

    it('should convert address buffer to testnet bech32 string', function () {
      const address = SEED_ACCOUNT.addressTestnet;
      const addressBuffer = utils.parseAddress(address);
      const result = utils.addressToString('costwo', 'P', addressBuffer);

      assert.ok(result.startsWith('P-'));
      assert.ok(result.includes('costwo'));
    });
  });

  describe('cb58Encode and cb58Decode', function () {
    it('should encode and decode target chain ID correctly', function () {
      const encoded = EXPORT_IN_C.targetChainId;
      const decoded = utils.cb58Decode(encoded);
      const reEncoded = utils.cb58Encode(decoded);

      assert.strictEqual(reEncoded, encoded);
    });

    it('should encode and decode source chain ID correctly', function () {
      const encoded = IMPORT_IN_P.sourceChainId;
      const decoded = utils.cb58Decode(encoded);
      const reEncoded = utils.cb58Encode(decoded);

      assert.strictEqual(reEncoded, encoded);
    });

    it('should throw for invalid checksum', function () {
      assert.throws(() => utils.cb58Decode('1111111111111'), /Invalid checksum/);
    });
  });

  describe('parseAddress and stringToAddress', function () {
    it('should parse hex address with 0x prefix', function () {
      const buffer = utils.parseAddress(EXPORT_IN_C.cHexAddress);

      assert.ok(buffer instanceof Buffer);
      assert.strictEqual(buffer.length, 20);
    });

    it('should parse mainnet bech32 address', function () {
      const buffer = utils.parseAddress(SEED_ACCOUNT.addressMainnet);

      assert.ok(buffer instanceof Buffer);
      assert.strictEqual(buffer.length, 20);
    });

    it('should parse testnet bech32 address', function () {
      const buffer = utils.parseAddress(SEED_ACCOUNT.addressTestnet);

      assert.ok(buffer instanceof Buffer);
      assert.strictEqual(buffer.length, 20);
    });

    it('should parse P-chain addresses from export data', function () {
      EXPORT_IN_C.pAddresses.forEach((address) => {
        const buffer = utils.parseAddress(address);
        assert.ok(buffer instanceof Buffer);
        assert.strictEqual(buffer.length, 20);
      });
    });

    it('should throw for address without dash separator', function () {
      assert.throws(() => utils.parseAddress('flare1abc'), /Valid address should include -/);
    });

    it('should throw for invalid HRP', function () {
      assert.throws(() => utils.parseAddress('P-invalid1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5evzmy'), /Invalid HRP/);
    });
  });

  describe('flareIdString', function () {
    it('should create Id from private key hex string', function () {
      const id = utils.flareIdString(SEED_ACCOUNT.privateKey);
      assert.ok(id);
    });

    it('should create Id from asset ID hex', function () {
      // Asset ID is typically 32 bytes (64 hex chars)
      const assetIdHex = SEED_ACCOUNT.privateKey; // Using as a 32-byte hex
      const id = utils.flareIdString(assetIdHex);
      assert.ok(id);
    });
  });

  describe('recoverySignature', function () {
    it('should recover public key from valid signature', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');

      // Create signature using the same private key (createSignature hashes the message internally)
      const signature = utils.createSignature(network, message, privateKey);

      // Recover public key - pass the hashed message since recoverySignature expects pre-hashed
      const messageHash = utils.sha256(message);
      const recoveredPubKey = utils.recoverySignature(messageHash, signature);

      assert.ok(recoveredPubKey instanceof Buffer);
      assert.strictEqual(recoveredPubKey.length, 33); // Should be compressed public key (33 bytes)
    });

    it('should recover same public key for same message and signature', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');
      const signature = utils.createSignature(network, message, privateKey);

      const messageHash = utils.sha256(message);
      const pubKey1 = utils.recoverySignature(messageHash, signature);
      const pubKey2 = utils.recoverySignature(messageHash, signature);

      assert.deepStrictEqual(pubKey1, pubKey2);
    });

    it('should recover public key that matches original key', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(SEED_ACCOUNT.privateKey, 'hex');

      // Get original public key
      const originalPubKey = Buffer.from(ecc.pointFromScalar(privateKey, true) as Uint8Array);

      // Create signature and recover public key
      const signature = utils.createSignature(network, message, privateKey);
      const messageHash = utils.sha256(message);
      const recoveredPubKey = utils.recoverySignature(messageHash, signature);

      // Convert both to hex strings for comparison
      assert.strictEqual(recoveredPubKey.toString('hex'), originalPubKey.toString('hex'));
    });

    it('should recover public key using ACCOUNT_1 keys', function () {
      const message = Buffer.from(SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(ACCOUNT_1.privateKey, 'hex');

      const originalPubKey = Buffer.from(ecc.pointFromScalar(privateKey, true) as Uint8Array);

      const signature = utils.createSignature(network, message, privateKey);
      const messageHash = utils.sha256(message);
      const recoveredPubKey = utils.recoverySignature(messageHash, signature);

      assert.strictEqual(recoveredPubKey.toString('hex'), originalPubKey.toString('hex'));
    });

    it('should throw error for invalid signature length', function () {
      const messageHash = utils.sha256(Buffer.from(SEED_ACCOUNT.message, 'utf8'));
      const invalidSignature = Buffer.from(INVALID_SHORT_KEYPAIR_KEY, 'hex');

      assert.throws(() => utils.recoverySignature(messageHash, invalidSignature), /Failed to recover signature/);
    });

    it('should throw error for signature with invalid recovery parameter', function () {
      const messageHash = utils.sha256(Buffer.from(SEED_ACCOUNT.message, 'utf8'));
      const signature = Buffer.alloc(65); // Valid length but all zeros - invalid signature

      assert.throws(() => utils.recoverySignature(messageHash, signature), /Failed to recover signature/);
    });

    it('should recover signature and verify sender address from signed C-chain Export tx', async function () {
      // Transaction from actual build response - C-chain Export tx
      const tx =
        '0x0000000000010000007278db5c30bed04c05ce209179812850bbb3fe6d46d7eef3744d814c0da55524790000000000000000000000000000000000000000000000000000000000000000000000012a96025ad506b9fbb9023fbdc1665c7f7d7c923f000000000605236658734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd00000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000006052340000000000000000000000002000000037fa8c7e0c8ad9f09f9179b42b77e94a487c3df758d4ba538f772333ca7bf3668a2fe36648438c79d9b6b77b56effb860eaa430e0e30c4e392f59cd08000000010000000900000001750076e67d9720283a71c6e7a9a88ff662608fefdd3f316f1211957ca1873eee3ee4a74b468bda66176a3e5d3ab54d43a8c0be12348f251a3093c16d9db00cd001c31e9c15';
      const expectedSenderAddress = '0x2a96025ad506b9fbb9023fbdc1665c7f7d7c923f';

      const factory = new TransactionBuilderFactory(coins.get('tflrp'));
      const txn = (await factory.from(tx).build()) as Transaction;
      const signablePayload = txn.signablePayload;
      const signatures = txn.signature;
      const sig = Buffer.from(utils.removeHexPrefix(signatures[0]), 'hex');

      // Recover public key from signature (signablePayload is already SHA256 hashed)
      const recoveredPubKey = utils.recoverySignature(signablePayload, sig);

      // Get the sender address from the transaction inputs
      const txInputs = txn.inputs;
      const senderAddressFromTx = txInputs[0].address.toLowerCase();

      // Verify sender address matches expected
      assert.strictEqual(
        senderAddressFromTx,
        expectedSenderAddress.toLowerCase(),
        'Transaction sender address does not match expected'
      );

      // Derive address from recovered public key
      const derivedEvmAddress =
        '0x' + Buffer.from(new Address(secp256k1.publicKeyToEthAddress(recoveredPubKey)).toBytes()).toString('hex');

      // Verify the recovered public key matches the sender
      assert.strictEqual(
        derivedEvmAddress.toLowerCase(),
        senderAddressFromTx,
        'Recovered public key does not match sender address'
      );

      // Also verify signature validity
      const sigOnly = sig.slice(0, 64);
      const isValid = utils.verifySignature(signablePayload, sigOnly, recoveredPubKey);
      assert.strictEqual(isValid, true, 'Signature verification failed');
    });
  });

  describe('isTransactionOf', function () {
    const factory = new TransactionBuilderFactory(coins.get('tflrp'));
    const utilsInstance = new Utils();
    const testnetNetwork = coins.get('tflrp').network as FlareNetwork;
    const pChainBlockchainIdHex = Buffer.from(utilsInstance.cb58Decode(testnetNetwork.blockchainID)).toString('hex');
    const cChainBlockchainIdHex = Buffer.from(utilsInstance.cb58Decode(testnetNetwork.cChainBlockchainID)).toString(
      'hex'
    );

    it('should return true for Import in P transaction with matching P-chain blockchain ID', async function () {
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(IMPORT_IN_P.threshold)
        .locktime(IMPORT_IN_P.locktime)
        .fromPubKey(IMPORT_IN_P.corethAddresses)
        .to(IMPORT_IN_P.pAddresses)
        .externalChainId(IMPORT_IN_P.sourceChainId)
        .feeState(IMPORT_IN_P.feeState)
        .context(IMPORT_IN_P.context)
        .decodedUtxos(IMPORT_IN_P.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, pChainBlockchainIdHex), true);
    });

    it('should return false for Import in P transaction with non-matching C-chain blockchain ID', async function () {
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(IMPORT_IN_P.threshold)
        .locktime(IMPORT_IN_P.locktime)
        .fromPubKey(IMPORT_IN_P.corethAddresses)
        .to(IMPORT_IN_P.pAddresses)
        .externalChainId(IMPORT_IN_P.sourceChainId)
        .feeState(IMPORT_IN_P.feeState)
        .context(IMPORT_IN_P.context)
        .decodedUtxos(IMPORT_IN_P.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, cChainBlockchainIdHex), false);
    });

    it('should return true for Export in P transaction with matching P-chain blockchain ID', async function () {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(EXPORT_IN_P.threshold)
        .locktime(EXPORT_IN_P.locktime)
        .fromPubKey(EXPORT_IN_P.pAddresses)
        .externalChainId(EXPORT_IN_P.sourceChainId)
        .feeState(EXPORT_IN_P.feeState)
        .context(EXPORT_IN_P.context)
        .amount(EXPORT_IN_P.amount)
        .decodedUtxos(EXPORT_IN_P.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, pChainBlockchainIdHex), true);
    });

    it('should return false for Export in P transaction with non-matching C-chain blockchain ID', async function () {
      const txBuilder = factory
        .getExportInPBuilder()
        .threshold(EXPORT_IN_P.threshold)
        .locktime(EXPORT_IN_P.locktime)
        .fromPubKey(EXPORT_IN_P.pAddresses)
        .externalChainId(EXPORT_IN_P.sourceChainId)
        .feeState(EXPORT_IN_P.feeState)
        .context(EXPORT_IN_P.context)
        .amount(EXPORT_IN_P.amount)
        .decodedUtxos(EXPORT_IN_P.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, cChainBlockchainIdHex), false);
    });

    it('should return true for Import in C transaction with matching C-chain blockchain ID', async function () {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(IMPORT_IN_C.threshold)
        .locktime(IMPORT_IN_C.locktime)
        .fromPubKey(IMPORT_IN_C.pAddresses)
        .externalChainId(IMPORT_IN_C.sourceChainId)
        .fee(IMPORT_IN_C.fee)
        .context(IMPORT_IN_C.context)
        .to(IMPORT_IN_C.to)
        .decodedUtxos(IMPORT_IN_C.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, cChainBlockchainIdHex), true);
    });

    it('should return false for Import in C transaction with non-matching P-chain blockchain ID', async function () {
      const txBuilder = factory
        .getImportInCBuilder()
        .threshold(IMPORT_IN_C.threshold)
        .locktime(IMPORT_IN_C.locktime)
        .fromPubKey(IMPORT_IN_C.pAddresses)
        .externalChainId(IMPORT_IN_C.sourceChainId)
        .fee(IMPORT_IN_C.fee)
        .context(IMPORT_IN_C.context)
        .to(IMPORT_IN_C.to)
        .decodedUtxos(IMPORT_IN_C.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, pChainBlockchainIdHex), false);
    });

    it('should return true for Export in C transaction with matching C-chain blockchain ID', async function () {
      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(EXPORT_IN_C.cHexAddress)
        .nonce(EXPORT_IN_C.nonce)
        .amount(EXPORT_IN_C.amount)
        .threshold(EXPORT_IN_C.threshold)
        .locktime(EXPORT_IN_C.locktime)
        .to(EXPORT_IN_C.pAddresses)
        .fee(EXPORT_IN_C.fee)
        .context(EXPORT_IN_C.context);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, cChainBlockchainIdHex), true);
    });

    it('should return false for Export in C transaction with non-matching P-chain blockchain ID', async function () {
      const txBuilder = factory
        .getExportInCBuilder()
        .fromPubKey(EXPORT_IN_C.cHexAddress)
        .nonce(EXPORT_IN_C.nonce)
        .amount(EXPORT_IN_C.amount)
        .threshold(EXPORT_IN_C.threshold)
        .locktime(EXPORT_IN_C.locktime)
        .to(EXPORT_IN_C.pAddresses)
        .fee(EXPORT_IN_C.fee)
        .context(EXPORT_IN_C.context);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, pChainBlockchainIdHex), false);
    });

    it('should return false for invalid blockchain ID', async function () {
      const txBuilder = factory
        .getImportInPBuilder()
        .threshold(IMPORT_IN_P.threshold)
        .locktime(IMPORT_IN_P.locktime)
        .fromPubKey(IMPORT_IN_P.corethAddresses)
        .to(IMPORT_IN_P.pAddresses)
        .externalChainId(IMPORT_IN_P.sourceChainId)
        .feeState(IMPORT_IN_P.feeState)
        .context(IMPORT_IN_P.context)
        .decodedUtxos(IMPORT_IN_P.utxos);

      const tx = (await txBuilder.build()) as Transaction;
      const flareTransaction = tx.getFlareTransaction();

      assert.strictEqual(utilsInstance.isTransactionOf(flareTransaction, 'invalidblockchainid'), false);
    });
  });
});
