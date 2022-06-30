import 'should';
import { Utils, KeyPair } from '../../../src/lib/';
import * as testData from '../../resources/avaxp';
import { AvalancheNetwork, coins } from '@bitgo/statics';

describe('Avax P Util', () => {
  const network: AvalancheNetwork = coins.get('tavaxp').network as AvalancheNetwork;
  const compressed = true;
  describe('should recovery public key', () => {
    const keyPair = new KeyPair({ prv: testData.SEED_ACCOUNT.privateKeyAvax });
    const prv = keyPair.getPrivateKey();
    const pub = keyPair.getPublicKey({ compressed });
    const message = Buffer.from('Lorem ipsum dolor sit amet. Est maxime iure et odio iusto non aspernatur...', 'hex');
    it('from an empty value', () => {
      const signautre = Utils.createSignature(network, message, prv!);
      Utils.recoverySignature(network, message, signautre).should.deepEqual(pub);
    });
  });

  it('should a public key be valided', () => {
    Utils.isValidPublicKey(testData.SEED_ACCOUNT.publicKeyCb58).should.be.true();
    Utils.isValidPublicKey(testData.SEED_ACCOUNT.publicKey).should.be.true();
    Utils.isValidPublicKey(testData.SEED_ACCOUNT.xPublicKey).should.be.true();
  });
});
