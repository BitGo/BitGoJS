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

    it('should validate an address array', function () {
      const validAddresses = [
        'P-fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa',
        'NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7',
        'NodeID-P1KjdPNrap8LHfx5AstcXxsHjk3jbbyF',
      ];

      Utils.isValidAddress(validAddresses).should.be.true();
    });

    it('should validate an address multiSig string', function () {
      const stringMultiSigAddress =
        'P-fuji15jamwukfqkwhe8z26tjqxejtjd3jk9vj4kmxwa~NodeID-MdteS9U987PY7iwA5Pcz3sKVprJAbAvE7~NodeID-P1KjdPNrap8LHfx5AstcXxsHjk3jbbyF';

      Utils.isValidAddress(stringMultiSigAddress).should.be.true();
    });

    it('should fail to validate an invalid block id', function () {
      const block = 'abcdefghijklmnopqrstuvwxyz';
      Utils.isValidBlockId(block).should.be.false();
    });

    it('should validate a block id', function () {
      const block = 'zGC26Bagj79RBPobK8Hghk9xuqAmME53eEUtM9RJ2yadBxrch';
      Utils.isValidBlockId(block).should.be.true();
    });
  });
});
