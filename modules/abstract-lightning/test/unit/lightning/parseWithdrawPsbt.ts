import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { validatePsbtForWithdraw } from '../../../src';
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

  describe('regression tests with created PSBT from LND (no `m/` prefix)', () => {
    const unsignedPsbtHex =
      '70736274ff01007d0200000001814f07febb372cf9e303c40938d7f1372cf7f5bd3d43de763be10c1b2ac539200000000000ffffffff028813000000000000220020ac06117832f08e952b16c220dde35dd505b5c54fa45a4eb9f2b040efd27ecb12f86a040000000000160014f1f4753cf0f9171dd3724f17ea511baa49e3c22600000000000100fde70401000000000104e55600b7d0003c6b2be7dc105f6c3499b8d426e92fd56c3dca06728e060c80720000000000fdffffff366f5356038e883dd7dd621d0b340c526018329664ccbeb1a723b0a6f8f312a40000000023220020b4b69dea98d8d5fb32a22a0c9ad208fc28efb44943f8e576d5978d215d784d49fdffffff15978f903d63dac56026cec90fc568fbe6e8a5a8b53bf8b5a34eee3723e63eff0000000000fdffffff58a9e6be1da0f25e39af4c95ed102336a64baf9bc8eb7c1ffca97ff0d0d651ff0000000000fdffffff0145860400000000001600146b618e8d1d709711104f92a857032a8d66f1bf7d0400483045022100d85bc99bf6d610978630518f79eeee025c8ce40eb65f12360f0f47d5b30ca547022036d79384a55bbba00520d626c3ae05a5f341fd7d65f211fa64bfedad5e827c7301483045022100dacce37fbffeb2e9ee198ab3a78cfdf01e34655313482ff75376bb5e2152a05d02205a7d1b7072480368d274de0229bbb9e6f4e4cda202f6750b9a90f8517604413e0169522102dd6b15d5c483080aaeaf3be51c8ee6cd794dbfa65e5c8036fe2c67f0080929702103370c44e05dddfc29fdb418ae583652b4fb7ee62d07562fc1e5b1696caaf3908f2103c6d980811cb03048a7b48f639bbb0575444af1f670af8462bb1c93112af2080a53ae040048304502210094646e8c1c25368ed9cdf5ba10b54a88ce20bb9b452877d0d2f27823897ab9d40220183c80560c1860d22d7ae8aaeee712d930e427252345bddece1a333d345c6d9801483045022100d123c1f5a79d32905f9d725b590160afc8e14bb01cb1a5d258304c6b6673113c0220722003050f57366b3f3486c1fdd5559579f1c67c3d644d31ac6f20bb8022f7d201695221034a2c8e0891e30698aa7015f1210451f1e5336be96bf846cd43528c15b0645b032103e6305f797838299f4188595b1b01bd9fe60db0e4bb9331d957750248d055f299210383c028341d5d273afca5f5265e2c2ee9619c0f1b328956ef3000ab09eccaed3b53ae0400473044022044a43ae38b86c375aa57b3d96386fca52f74a5bc4fb37c77738efa4c0566662202200d1af93d2022c48f3f3cc134d3d75bbcfce30615e53d9246c200c5349a7d978c0147304402207ce3043211d9344dad8f4e2bf848bf1ca151310a188e707663b28475e12099d0022060d2b3533e7c362d39b041102edf17e0486b1aee55a01c7895485b8630daa39c0169522103c71a350e2b06ec9d0710a13f608bb76f35a35fed491fbb5b97280caed4c9590f2103692ea685162a1da7e86e0beeb1ed0331e8d0fbbf2e05f002071b15044c402b782102960087d0d5b8e1a449ed562553ef3149885a930f60c40324165221a7fc7627ea53ae0400483045022100a8382cfa2582abdc77417f9aa53e5ce0e2d31eb5e14b7836961da8c045de3a500220398555b93816ef7ec417bb7555bc51e0477b3c65f83d0951cff2a5040457314e0147304402204f66fd4507bd54cc25028b5660c00fdcfe15ce6121eabff7911e7307d24c7f1102200591e969897109a2372a6b22e41d158d4e0ae53ca0963166ffd8a23e06522ac9016952210282aaf28d528e6b6326880b1539a14a96dcee5d9a0920a31f3581e5ac21a9de462103f84e26e78f2c587821b581761b134f7721e33b1ad97bd1599125ee23369ea1202103da6eddca9c0eaaa08b179c035ed0adb516a592ba1321ffc5cb11dcae8c3a704f53ae0000000001011f45860400000000001600146b618e8d1d709711104f92a857032a8d66f1bf7d010304010000002206038361bfad9b6896c938690df1e67c669ecd7a021b117382bbfa81ff6de8ec153718000000005400008000000080000000800000000000000000000022020376cb4ac899d130e2d655fca6d362fe7c745cc15486849e401f7c21b3d3df37c81800000000540000800000008000000080010000000800000000';
    const recipients = [
      {
        amountSat: 5000n,
        address: 'tb1q4srpz7pj7z8f22ckcgsdmc6a65zmt32053dyaw0jkpqwl5n7evfqhc07u4',
      },
    ];
    const accounts = [
      {
        purpose: 49,
        coin_type: 0,
        account: 0,
        xpub: 'upub5EW2cim2FSeBDqote8jcKnBSohtZjPRbw9HsXNototipVVj31AzWjgXUSonbvi7RNALY73rkgXTQY4YUpovrG1WV4ATKXyQpMa1sMnJdCbm',
      },
      {
        purpose: 84,
        coin_type: 0,
        account: 0,
        xpub: 'vpub5Z8kVs9L6fSK4qc1G36VqKdTiSdfCGSzrcz4EYGkywkWX43EJiLcSBEd1XE4fxgXir7Wkwaia4eTwbakngVDHHnToc9qQMBcxerr2U5MHnN',
      },
      {
        purpose: 86,
        coin_type: 0,
        account: 0,
        xpub: 'tpubDCyXDnLqhmTxjcGV2KexrojfJPBept2gWs2mg9V46y6HAp9nLzg3idmESEJ1RDtfaLyVL6x2MoJsv66hQPWrCxoR2jYQbGbHd5FmEa6BfW3',
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
