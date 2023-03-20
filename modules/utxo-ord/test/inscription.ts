import * as assert from 'assert';
import { inscriptions } from '../src';
import { address, networks, ECPair } from '@bitgo/utxo-lib';

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

  // TODO(BG-70861): update method with valid data. failing since we need a unsigned commit txn
  // with valid outs matching commit output
  xdescribe('Inscription Reveal Data', () => {
    it('should sign reveal transaction and validate reveal size', () => {
      const ecPair = ECPair.makeRandom();
      const inscriptionData = Buffer.from('And Desert You', 'ascii');
      const { revealTransactionVSize, tapLeafScript, address } = inscriptions.createInscriptionRevealData(
        ecPair.publicKey,
        contentType,
        inscriptionData,
        networks.testnet
      );

      const fullySignedRevealTransaction = inscriptions.signRevealTransaction(
        ecPair.privateKey as Buffer,
        tapLeafScript,
        address,
        '2N9R3mMCv6UfVbWEUW3eXJgxDeg4SCUVsu9',
        Buffer.from(
          '01000000014b3ea9504d1909063ef15f8b3dbe3dc4c5a129a6d0e31d7ab79a2e9e1bbe38ba0100000000ffffffff02a18601000000000022512087daa0f42694fd0536d3413cb0eff2fa63068c37a312695d92b76a0da2dd8ef55df2100000000000220020857ba44c62320fc9ed0e8a89c4dcdcb211934bcecb8f9778088a482978d77c0000000000',
          'hex'
        ),
        networks.testnet
      );
      const actualVirtualSize = fullySignedRevealTransaction.extractTransaction(true).virtualSize();

      assert.strictEqual(revealTransactionVSize, actualVirtualSize);
    });
  });
});
