import * as utxolib from '@bitgo/utxo-lib';
import * as assert from 'assert';
import { inscriptions, WalletInputBuilder } from '../src';
import { address, networks, testutil, bitgo } from '@bitgo/utxo-lib';

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
        '512044d2e55d99b3412c569e3769f4522f9a92cbef8e10ab54f9db1f01421a541574',
        'tb1pgnfw2hvekdqjc457xa5lg530n2fvhmuwzz44f7wmruq5yxj5z46qenh5sy'
      );
    });

    it('should generate an inscription address when data length is > 520', () => {
      const inscriptionData = Buffer.from('Never Gonna Let You Down'.repeat(100), 'ascii');

      testInscriptionScript(
        inscriptionData,
        '5120d5092e5a0107db36b1e16044057fd47dd8d3309ff4f878989d8b55bd9823a187',
        'tb1p65yjukspqldndv0pvpzq2l750hvdxvyl7nu83xya3d2mmxpr5xrsj02kpf'
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

      // TODO(BG-70861): figure out why size is slightly different and re-enable test
      assert.strictEqual(revealTransactionVSize, actualVirtualSize);
    });
  });

  describe('Inscription Reveal Signature Validation', () => {
    it('should not throw when validating reveal signatures and finalizing all reveal inputs', () => {
      const walletKeys = testutil.getDefaultWalletKeys();
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const { tapLeafScript, address } = inscriptions.createInscriptionRevealData(
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
      assert.doesNotThrow(() => {
        fullySignedRevealTransaction.validateSignaturesOfAllInputs();
        fullySignedRevealTransaction.finalizeAllInputs();
      });
    });
  });
});
