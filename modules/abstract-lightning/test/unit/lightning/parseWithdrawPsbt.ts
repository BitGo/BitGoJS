import { validatePsbtForWithdraw } from '../../../src';
import * as utxolib from '@bitgo/utxo-lib';
import assert from 'assert';
import { createTestPsbt } from './createPsbt';

describe('parseWithdrawPsbt', () => {
  const network = utxolib.networks.testnet;

  describe('regression tests with hardcoded PSBT', () => {
    // Keeping one regression test with real PSBT data to ensure backward compatibility
    const unsignedPsbtHex =
      '70736274ff01007d02000000015e50b8d96cebdc3273d9a100eb68392d980d5b934b8170c80a23488b595268ca0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15affa80a000000000016001480a06f2e6b77e817fd5de6e41ea512c563c26cb800000000000100ea02000000000101a158d806735bb7c54e4c701d4f5821cd5342d48d5e1fcbed1169e6e45aa444be0100000000ffffffff02a086010000000000225120379bc88cc15d3605ed9de1b61ff8d65021b650db1151e751a30885ccfcc7d15a6a310c000000000016001478a5d98c7160484b9b00f1782803c58edfc49b9a024730440220407d9162f52371df246dcfa2943d40fbdcb0d4b6768f7682c65193378b2845a60220101c7bc460c93d2976961ac23400f0f10c145efb989a3addb7f03ebaaa2200950121037e17444c85c8b7da07f12fd53cb2ca142c2b4932d0f898649c4b5be0021da0980000000001030401000000220602e57146e5b4762a7ff374adf4072047b67ef115ad46a34189bdeb6a4f88db9b0818000000005400008000000080000000800100000006000000000022020379abbe44004ff7e527bdee3dd8d95e5cd250053f35ee92258b97aa83dfa93c621800000000540000800000008000000080010000005000000000';
    const recipients = [
      {
        amountSat: 100000n,
        address: 'tb1px7du3rxpt5mqtmvauxmpl7xk2qsmv5xmz9g7w5drpzzuelx869dqwape7k',
      },
    ];
    const accounts = [
      {
        xpub: 'tpubDCmiWMkTJrZ24t1Z6ECR3HyynCyZ9zGsWqhcLh6H4yFK2CDozSszD1pP2Li4Nx1YYtRcvmNbdb3nD1SzFejYtPFfTocTv2EaAgJCg4zpJpA',
        purpose: 49,
        coin_type: 0,
        account: 0,
      },
      {
        xpub: 'tpubDCFN7bsxR9UTKggdH2pmv5HeHGQNiDrJwa1EZFtP9sH5PF28i37FHpoYSYARQkKZ6Mi98pkp7oypDcxFmE4dQGq8jV8Gv3L6gmWBeRwPxkP',
        purpose: 84,
        coin_type: 0,
        account: 0,
      },
    ];

    it('should parse a valid withdraw PSBT', () => {
      validatePsbtForWithdraw(unsignedPsbtHex, network, recipients, accounts);
    });

    it('should throw for invalid PSBT hex', () => {
      assert.throws(() => {
        validatePsbtForWithdraw('asdasd', network, recipients, accounts);
      }, /ERR_BUFFER_OUT_OF_BOUNDS/);
    });
  });

  describe('test cases with creating psbt on the go', () => {
    it('should validate PSBT with P2WPKH (purpose 84) change address', () => {
      const { psbt, masterKey } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 84,
        changeDerivationPath: "m/84'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      const accounts = [
        {
          xpub: masterKey.neutered().toBase58(),
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });

    it('should validate PSBT with P2SH-P2WPKH (purpose 49) change address', () => {
      const { psbt, masterKey } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 49,
        changeDerivationPath: "m/49'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      const accounts = [
        {
          xpub: masterKey.neutered().toBase58(),
          purpose: 49,
          coin_type: 0,
          account: 0,
        },
      ];

      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });

    it('should validate PSBT with P2TR (purpose 86) change address', () => {
      const { psbt, masterKey } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 86,
        changeDerivationPath: "m/86'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      const accounts = [
        {
          xpub: masterKey.neutered().toBase58(),
          purpose: 86,
          coin_type: 0,
          account: 0,
        },
      ];

      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });

    it('should throw for missing bip32Derivation path on change output', () => {
      const { psbt, masterKey } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 84,
      });

      // Remove the bip32Derivation from the change output
      // This will cause the output to be treated as a regular recipient output, not a change output
      delete psbt.data.outputs[1].bip32Derivation;

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      const accounts = [
        {
          xpub: masterKey.neutered().toBase58(),
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      // The output without bip32Derivation is treated as a recipient output,
      // and since it's not in the recipients list, it should fail with "does not match any recipient"
      assert.throws(() => {
        validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
      }, /does not match any recipient/);
    });

    it('should throw for invalid change address (derived address mismatch)', () => {
      const { psbt } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 84,
        changeDerivationPath: "m/84'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      // Use a different xpub that won't match the change address
      const differentMasterKey = utxolib.bip32.fromSeed(Buffer.alloc(32, 2), network);
      const accounts = [
        {
          xpub: differentMasterKey.neutered().toBase58(),
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      assert.throws(() => {
        validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
      }, /Derived pubkey does not match for address/);
    });

    it('should validate PSBT with upub prefix (P2SH-P2WPKH testnet)', () => {
      const { psbt } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 49,
        changeDerivationPath: "m/49'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      // Use upub prefix (testnet P2SH-P2WPKH) instead of standard tpub
      // This tests that revertXpubPrefix correctly converts upub -> tpub
      const accounts = [
        {
          xpub: 'upub5Eep7H5q39PzQZLVEYLBytDyBNeV74E8mQsyeL6UozFq9Y3MsZ52G7YGuqrJPgoyAqF7TBeJdnkrHrVrB5pkWkPJ9cJGAePMU6F1Gyw6aFH',
          purpose: 49,
          coin_type: 0,
          account: 0,
        },
      ];

      // This should work because revertXpubPrefix will convert upub back to tpub
      // However, the master key we used is different, so it should fail with pubkey mismatch
      assert.throws(() => {
        validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
      }, /Derived pubkey does not match for address/);
    });

    it('should validate PSBT with vpub prefix (P2WPKH testnet)', () => {
      const { psbt } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 84,
        changeDerivationPath: "m/84'/0'/0'/1/6",
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      // Use vpub prefix (testnet P2WPKH) instead of standard tpub
      // This tests that revertXpubPrefix correctly converts vpub -> tpub
      const accounts = [
        {
          xpub: 'vpub5ZU1PHGpQoDSHckYico4nsvwsD3mTh6UjqL5zyGWXZXzBjTYMNKot7t9eRPQY71hJcnNN9r1ss25g3xA9rmoJ5nWPg8jEWavrttnsVa1qw1',
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      // This should work because revertXpubPrefix will convert vpub back to tpub
      // However, the master key we used is different, so it should fail with pubkey mismatch
      assert.throws(() => {
        validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
      }, /Derived pubkey does not match for address/);
    });

    it('should validate PSBT with matching upub prefix and correct key', () => {
      // Import the signer root key from the fixture which corresponds to the upub/vpub accounts
      const signerRootKey =
        'tprv8ZgxMBicQKsPe6jS4vDm2n7s42Q6MpvghUQqMmSKG7bTZvGKtjrcU3PGzMNG37yzxywrcdvgkwrr8eYXJmbwdvUNVT4Ucv7ris4jvA7BUmg';
      const masterHDNode = utxolib.bip32.fromBase58(signerRootKey, network);

      // Derive the account key for purpose 49
      const accountKey = masterHDNode.derivePath("m/49'/0'/0'");

      const { psbt } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 49,
        changeDerivationPath: "m/49'/0'/0'/1/6",
        masterKey: accountKey,
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      // Use the upub from the fixture - this should work because the keys match
      const accounts = [
        {
          xpub: 'upub5Eep7H5q39PzQZLVEYLBytDyBNeV74E8mQsyeL6UozFq9Y3MsZ52G7YGuqrJPgoyAqF7TBeJdnkrHrVrB5pkWkPJ9cJGAePMU6F1Gyw6aFH',
          purpose: 49,
          coin_type: 0,
          account: 0,
        },
      ];

      // This should pass - revertXpubPrefix converts upub -> tpub, and the key matches
      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });

    it('should validate PSBT with matching vpub prefix and correct key', () => {
      // Import the signer root key from the fixture which corresponds to the upub/vpub accounts
      const signerRootKey =
        'tprv8ZgxMBicQKsPe6jS4vDm2n7s42Q6MpvghUQqMmSKG7bTZvGKtjrcU3PGzMNG37yzxywrcdvgkwrr8eYXJmbwdvUNVT4Ucv7ris4jvA7BUmg';
      const masterHDNode = utxolib.bip32.fromBase58(signerRootKey, network);

      // Derive the account key for purpose 84
      const accountKey = masterHDNode.derivePath("m/84'/0'/0'");

      const { psbt } = createTestPsbt({
        network,
        inputValue: 500000,
        outputValue: 100000,
        changeValue: 390000,
        changePurpose: 84,
        changeDerivationPath: "m/84'/0'/0'/1/6",
        masterKey: accountKey,
      });

      const recipientAddress = utxolib.address.fromOutputScript(psbt.txOutputs[0].script, network);

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipientAddress,
        },
      ];

      // Use the vpub from the fixture - this should work because the keys match
      const accounts = [
        {
          xpub: 'vpub5ZU1PHGpQoDSHckYico4nsvwsD3mTh6UjqL5zyGWXZXzBjTYMNKot7t9eRPQY71hJcnNN9r1ss25g3xA9rmoJ5nWPg8jEWavrttnsVa1qw1',
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      // This should pass - revertXpubPrefix converts vpub -> tpub, and the key matches
      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });

    it('should validate PSBT with multiple recipients', () => {
      // Create a PSBT manually with 2 recipient outputs and 1 change output
      const masterKey = utxolib.bip32.fromSeed(Buffer.alloc(32, 1), network);

      const inputKeyPair = utxolib.ECPair.makeRandom({ network });
      const p2wpkhInput = utxolib.payments.p2wpkh({
        pubkey: Buffer.from(inputKeyPair.publicKey),
        network,
      });

      const psbt = new utxolib.Psbt({ network });

      // Add input
      psbt.addInput({
        hash: 'ca6852598b48230ac870814b935b0d982d3968eb00a1d97332dceb6cd9b8505e',
        index: 1,
        witnessUtxo: {
          script: p2wpkhInput.output!,
          value: BigInt(500000),
        },
        bip32Derivation: [
          {
            masterFingerprint: Buffer.alloc(4, 0),
            path: "m/84'/0'/0'/0/0",
            pubkey: Buffer.from(inputKeyPair.publicKey),
          },
        ],
      });

      // Create first recipient
      const recipient1KeyPair = utxolib.ECPair.makeRandom({ network });
      const recipient1Payment = utxolib.payments.p2wpkh({
        pubkey: Buffer.from(recipient1KeyPair.publicKey),
        network,
      });
      const recipient1Address = recipient1Payment.address!;

      // Create second recipient
      const recipient2KeyPair = utxolib.ECPair.makeRandom({ network });
      const recipient2Payment = utxolib.payments.p2wpkh({
        pubkey: Buffer.from(recipient2KeyPair.publicKey),
        network,
      });
      const recipient2Address = recipient2Payment.address!;

      // Derive change address from master key
      const changeNode = masterKey.derive(1).derive(6); // m/1/6
      const changePayment = utxolib.payments.p2wpkh({
        pubkey: changeNode.publicKey,
        network,
      });
      const changeAddress = changePayment.address!;

      // Add outputs: recipient1, recipient2, change
      psbt.addOutput({
        address: recipient1Address,
        value: BigInt(100000),
      });

      psbt.addOutput({
        address: recipient2Address,
        value: BigInt(50000),
      });

      psbt.addOutput({
        address: changeAddress,
        value: BigInt(340000), // 500000 - 100000 - 50000 - 10000 (fee)
      });

      // Add bip32Derivation to the change output (index 2)
      psbt.updateOutput(2, {
        bip32Derivation: [
          {
            masterFingerprint: Buffer.alloc(4, 0),
            path: "m/84'/0'/0'/1/6",
            pubkey: changeNode.publicKey,
          },
        ],
      });

      const recipients = [
        {
          amountSat: BigInt(100000),
          address: recipient1Address,
        },
        {
          amountSat: BigInt(50000),
          address: recipient2Address,
        },
      ];

      const accounts = [
        {
          xpub: masterKey.neutered().toBase58(),
          purpose: 84,
          coin_type: 0,
          account: 0,
        },
      ];

      validatePsbtForWithdraw(psbt.toHex(), network, recipients, accounts);
    });
  });
});
