import 'should';
import { Utils, KeyPair } from '../../../src/lib/';
import * as testData from '../../resources/avaxp';
import { AvalancheNetwork, coins } from '@bitgo/statics';

describe('Avaxp Utils', () => {
  const network: AvalancheNetwork = coins.get('tavaxp').network as AvalancheNetwork;
  const compressed = true;
  it('should recover signature', () => {
    const keyPair = new KeyPair({ prv: testData.SEED_ACCOUNT.privateKeyAvax });
    const prv = keyPair.getPrivateKey();
    const pub = keyPair.getPublicKey({ compressed });
    const message = Buffer.from('Lorem ipsum dolor sit amet. Est maxime iure et odio iusto non aspernatur...', 'hex');
    const signature = Utils.createSignature(network, message, prv!);
    Utils.recoverySignature(network, message, signature).should.deepEqual(pub);
  });

  describe('Validation', function () {
    it('should validate a public key', () => {
      Utils.isValidPublicKey(testData.SEED_ACCOUNT.publicKeyCb58).should.be.true();
      Utils.isValidPublicKey(testData.SEED_ACCOUNT.publicKey).should.be.true();
      Utils.isValidPublicKey(testData.SEED_ACCOUNT.xPublicKey).should.be.true();
    });

    it('should fail to validate invalid address', function () {
      const address = 'fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa';
      Utils.isValidAddress(address).should.be.false();
    });

    it('should validate an address', function () {
      const validAddresses = [
        'P-fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa',
        'NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7',
        'NodeID-P1KjdPNrap8LHfx5AstcXxsHjk3jbbyF',
      ];
      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });
  });
});
