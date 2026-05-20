import * as assert from 'assert';
import { inscriptions } from '../src';
import { address, networks } from '@bitgo/utxo-lib';
import { address as wasmAddress, Psbt, ECPair, type CoinName } from '@bitgo/wasm-utxo';

const coinName: CoinName = 'tbtc';

/**
 * Create a mock commit transaction with a P2TR output.
 */
function createMockCommitTx(commitOutputScript: Uint8Array): Uint8Array {
  const psbt = new Psbt();

  // Add a dummy input
  psbt.addInput(
    '0'.repeat(64), // dummy txid (32 zero bytes as hex)
    0,
    BigInt(100_000),
    commitOutputScript
  );

  // Add the commit output
  psbt.addOutput(commitOutputScript, BigInt(10_000));

  return psbt.getUnsignedTx();
}

describe('inscriptions', () => {
  const contentType = 'text/plain';
  const xOnlyPubkeyHex = 'af455f4989d122e9185f8c351dbaecd13adca3eef8a9d38ef8ffed6867e342e3';
  const pubKeyBuffer = Buffer.from(xOnlyPubkeyHex, 'hex');

  // Test keypair for signing - derive public key from private key
  const testPrivateKey = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
  const testKeypair = ECPair.fromPrivateKey(testPrivateKey);
  const testPublicKey = testKeypair.publicKey;

  describe('Inscription Output Script', () => {
    function testInscriptionScript(inscriptionData: Buffer, expectedScriptHex: string, expectedAddress: string) {
      const outputScript = inscriptions.createOutputScriptForInscription(pubKeyBuffer, contentType, inscriptionData);
      assert.strictEqual(Buffer.from(outputScript).toString('hex'), expectedScriptHex);
      assert.strictEqual(address.fromOutputScript(Buffer.from(outputScript), networks.testnet), expectedAddress);
    }

    it('should generate an inscription address', () => {
      const inscriptionData = Buffer.from('Never Gonna Give You Up', 'ascii');

      testInscriptionScript(
        inscriptionData,
        '5120dc8b12eec336e7215fd1213acf66fb0d5dd962813c0616988a12c08493831109',
        'tb1pmj939mkrxmnjzh73yyav7ehmp4wajc5p8srpdxy2ztqgfyurzyys4sg9zx'
      );
    });

    it('should generate an inscription address when data length is > 520', () => {
      const inscriptionData = Buffer.from('Never Gonna Let You Down'.repeat(100), 'ascii');

      testInscriptionScript(
        inscriptionData,
        '5120ec90ba87f3e7c5462eb2173afdc50e00cea6fc69166677171d70f45dfb3a31b8',
        'tb1pajgt4plnulz5vt4jzua0m3gwqr82dlrfzen8w9cawr69m7e6xxuq7dzypl'
      );
    });
  });

  describe('Inscription Reveal Data', () => {
    it('should return valid tap leaf script data', () => {
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const revealData = inscriptions.createInscriptionRevealData(
        testPublicKey,
        contentType,
        inscriptionData,
        coinName
      );

      // Validate tap leaf script structure
      assert.ok(revealData.tapLeafScript);
      assert.strictEqual(revealData.tapLeafScript.leafVersion, 0xc0); // TapScript
      assert.ok(revealData.tapLeafScript.script instanceof Uint8Array);
      assert.ok(revealData.tapLeafScript.script.length > 0);
      assert.ok(revealData.tapLeafScript.controlBlock instanceof Uint8Array);
      assert.ok(revealData.tapLeafScript.controlBlock.length > 0);
    });

    it('should return a reasonable vsize estimate', () => {
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const revealData = inscriptions.createInscriptionRevealData(
        testPublicKey,
        contentType,
        inscriptionData,
        coinName
      );

      // vsize should be reasonable (at least 100 vbytes for a simple inscription)
      assert.ok(revealData.revealTransactionVSize > 100);
      // But not too large for small data
      assert.ok(revealData.revealTransactionVSize < 500);
    });

    it('should return address starting with tb1p for testnet', () => {
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const revealData = inscriptions.createInscriptionRevealData(
        testPublicKey,
        contentType,
        inscriptionData,
        coinName
      );

      // Taproot address for testnet
      assert.ok(revealData.address.startsWith('tb1p'));
    });
  });

  describe('signRevealTransaction', () => {
    it('should sign a reveal transaction', () => {
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const revealData = inscriptions.createInscriptionRevealData(
        testPublicKey,
        contentType,
        inscriptionData,
        coinName
      );

      // Create commit output script
      const commitOutputScript = wasmAddress.toOutputScriptWithCoin(revealData.address, coinName);

      // Create mock commit transaction
      const commitTxBytes = createMockCommitTx(commitOutputScript);

      // Create recipient output script (P2WPKH)
      const recipientOutputScript = Buffer.alloc(22);
      recipientOutputScript[0] = 0x00; // OP_0
      recipientOutputScript[1] = 0x14; // PUSH20
      const recipientAddress = wasmAddress.fromOutputScriptWithCoin(recipientOutputScript, coinName);

      // Sign the reveal transaction
      const txBytes = inscriptions.signRevealTransaction(
        testPrivateKey,
        revealData.tapLeafScript,
        revealData.address,
        recipientAddress,
        commitTxBytes,
        coinName
      );

      // Signed transaction should be non-empty
      assert.ok(txBytes instanceof Uint8Array);
      assert.ok(txBytes.length > 0);

      // Segwit transaction marker/flag: version(4) + marker(0x00) + flag(0x01)
      // Version should be 2 (little-endian)
      assert.strictEqual(txBytes[0], 0x02);
      assert.strictEqual(txBytes[1], 0x00);
      assert.strictEqual(txBytes[2], 0x00);
      assert.strictEqual(txBytes[3], 0x00);
      // Segwit marker and flag
      assert.strictEqual(txBytes[4], 0x00); // marker
      assert.strictEqual(txBytes[5], 0x01); // flag
    });

    it('should fail when commit output not found', () => {
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const revealData = inscriptions.createInscriptionRevealData(
        testPublicKey,
        contentType,
        inscriptionData,
        coinName
      );

      // Create commit tx with WRONG output script
      const wrongOutputScript = Buffer.alloc(34);
      wrongOutputScript[0] = 0x51; // OP_1
      wrongOutputScript[1] = 0x20; // PUSH32
      // Rest is zeros (different from revealData address)

      const commitTxBytes = createMockCommitTx(wrongOutputScript);

      const recipientOutputScript = Buffer.alloc(22);
      recipientOutputScript[0] = 0x00;
      recipientOutputScript[1] = 0x14;
      const recipientAddress = wasmAddress.fromOutputScriptWithCoin(recipientOutputScript, coinName);

      // Should throw because commit output script doesn't match
      assert.throws(() => {
        inscriptions.signRevealTransaction(
          testPrivateKey,
          revealData.tapLeafScript,
          revealData.address, // Looking for this address
          recipientAddress,
          commitTxBytes,
          coinName
        );
      }, /Commit output not found/);
    });
  });
});
