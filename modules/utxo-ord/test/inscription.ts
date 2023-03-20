import * as utxolib from '@bitgo/utxo-lib';
import * as assert from 'assert';
import { inscriptions, WalletInputBuilder } from '../src';
import { address, networks, ECPair, testutil, bitgo } from '@bitgo/utxo-lib';

function createCommitTransactionPsbt(commitAddress: string, walletKeys: utxolib.bitgo.RootWalletKeys) {
  const commitTransactionOutputScript = utxolib.address.toOutputScript(commitAddress, networks.testnet);
  const commitTransactionPsbt = utxolib.bitgo.createPsbtForNetwork({ network: networks.testnet });

  commitTransactionPsbt.addOutput({
    script: commitTransactionOutputScript,
    value: BigInt(42),
  });

  const walletUnspent = testutil.mockWalletUnspent(networks.testnet, BigInt(20_000), { keys: walletKeys });
  const inputBuilder: WalletInputBuilder = {
    walletKeys,
    signer: 'user',
    cosigner: 'bitgo',
  };

  [walletUnspent].forEach((u) =>
    bitgo.addWalletUnspentToPsbt(
      commitTransactionPsbt,
      u,
      inputBuilder.walletKeys,
      inputBuilder.signer,
      inputBuilder.cosigner,
      commitTransactionPsbt.network
    )
  );
  return commitTransactionPsbt;
}

describe('inscriptions', () => {
  const contentType = 'text/plain';
  const pubKey = 'af455f4989d122e9185f8c351dbaecd13adca3eef8a9d38ef8ffed6867e342e3';
  const pubKeyBuffer = Buffer.from(pubKey, 'hex');

  describe('Inscription Output Script', () => {
    function testInscriptionScript(inscriptionData: Buffer, expectedScriptHex: string, expectedAddress: string) {
      const outputScript = inscriptions.createOutputScriptForInscription(pubKeyBuffer, contentType, inscriptionData);
      assert.strictEqual(outputScript.toString('hex'), expectedScriptHex);
      assert.strictEqual(address.fromOutputScript(outputScript, networks.testnet), expectedAddress);
    }

    it('should generate an inscription address', () => {
      const inscriptionData = Buffer.from('Never Gonna Give You Up', 'ascii');

      testInscriptionScript(
        inscriptionData,
        '5120e0db418d51573f593389816568e86f96b65cf474712d085b1b0461645639f2fb',
        'tb1purd5rr232ul4jvufs9jk36r0j6m9ear5wyksskcmq3skg43e7tasdjpqs4'
      );
    });

    it('should generate an inscription address when data length is > 520', () => {
      const inscriptionData = Buffer.from('Never Gonna Let You Down'.repeat(100), 'ascii');

      testInscriptionScript(
        inscriptionData,
        '51205cc628635e0d8fd0aab0547cc23c0a9e90f47c0c8b3348b0d394a62d2b8b63fb',
        'tb1ptnrzsc67pk8ap24s237vy0q2n6g0glqv3ve53vxnjjnz62utv0as70jae4'
      );
    });
  });

  xdescribe('Inscription Reveal Data', () => {
    it('should sign reveal transaction and validate reveal size', () => {
      const walletKeys = testutil.getDefaultWalletKeys();
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const { revealTransactionVSize, tapLeafScript, address } = inscriptions.createInscriptionRevealData(
        walletKeys.user.publicKey,
        contentType,
        inscriptionData,
        networks.testnet
      );

      const commitTransactionPsbt = createCommitTransactionPsbt(address, walletKeys);
      const fullySignedRevealTransaction = inscriptions.signRevealTransaction(
        walletKeys.user.privateKey as Buffer,
        tapLeafScript,
        address,
        '2N9R3mMCv6UfVbWEUW3eXJgxDeg4SCUVsu9',
        commitTransactionPsbt.getUnsignedTx().toBuffer(),
        networks.testnet
      );

      fullySignedRevealTransaction.finalizeTapInputWithSingleLeafScriptAndSignature(0);
      const actualVirtualSize = fullySignedRevealTransaction.extractTransaction(true).virtualSize();

      assert.strictEqual(revealTransactionVSize, actualVirtualSize);
    });
  });
});
