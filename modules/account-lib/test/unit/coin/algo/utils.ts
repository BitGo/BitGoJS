import should from 'should';
import algosdk from 'algosdk';
import utils from '../../../../src/coin/algo/utils';
import { Algo } from '../../../../src';
import * as AlgoResources from '../../../resources/algo';

describe('utils', () => {
  const {
    accounts: { account1, account2, account3 },
  } = AlgoResources;

  it('should properly encode an algorand address from an ed25519 public key', () => {
    should.equal(utils.publicKeyToAlgoAddress(account1.pubKey), account1.address);
    should.equal(utils.publicKeyToAlgoAddress(account2.pubKey), account2.address);
    should.equal(utils.publicKeyToAlgoAddress(account3.pubKey), account3.address);
  });

  it('should encode an object from a string message', () => {
    const note = Buffer.from('hola mundo', 'base64');
    const objEncoded = Algo.algoUtils.encodeObj(note);
    const objEncodedByAlgo = algosdk.encodeObj(note);
    should.deepEqual(objEncoded, objEncodedByAlgo);
  });

  it('should return a mnemonic from a secret key ', () => {
    const keyPair = new Algo.KeyPair();
    const keys = keyPair.getKeys();
    let mn;
    let mnAlgo;
    if (keys.prv) {
      mn = Algo.algoUtils.secretKeyToMnemonic(Buffer.from(keys.prv, 'hex'));
      mnAlgo = algosdk.secretKeyToMnemonic(Buffer.from(keys.prv, 'hex'));
    }
    should.equal(mn, mnAlgo);
  });

  it('it should return error if the secret key is invalid', () => {
    const secretKeyInValid = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f6$';
    should.throws(
      () => Algo.algoUtils.secretKeyToMnemonic(Buffer.from(secretKeyInValid, 'hex')),
      'The secret key: 9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f6$ is invalid',
    );
  });

  it('should return a seed from a mnemonic ', () => {
    const mnemonic =
      'green office boost casino shoe army peace damp mimic this brand economy second sudden credit give coast match brick add good exact brand about neck';
    const seed = Algo.algoUtils.seedFromMnemonic(mnemonic);
    const seedAlgo = algosdk.mnemonicToMasterDerivationKey(mnemonic);
    should.deepEqual(seed, seedAlgo);
  });

  it('it should return error if the mnemonic is invalid', () => {
    const mnemonicInValid =
      'crisp hello solution ten remove object watch enhance future rather biology era myth image swap crash coffee scatter buffalo depart day twist advance about unfair';
    should.throws(
      () => Algo.algoUtils.seedFromMnemonic(mnemonicInValid),
      'the mnemonic contains a word that is not in the wordlist',
    );
  });

  it('should reuturn a keyPair from seed', () => {
    const mnemonic =
      'green office boost casino shoe army peace damp mimic this brand economy second sudden credit give coast match brick add good exact brand about neck';
    const seed = Algo.algoUtils.seedFromMnemonic(mnemonic);
    const keyPair = Algo.algoUtils.keyPairFromSeed(seed);
    const { addr, sk } = algosdk.mnemonicToSecretKey(mnemonic);
    const skOnly = new Uint8Array(Buffer.from(sk.slice(0, 32)));
    const pk = algosdk.decodeAddress(addr).publicKey;
    should.deepEqual(keyPair.sk, skOnly);
    should.deepEqual(keyPair.pk, pk);
  });

  it('it should return error if the seed is invalid', () => {
    const seedInValid = new Uint8Array(
      Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f6$', 'hex'),
    );
    should.throws(() => Algo.algoUtils.keyPairFromSeed(seedInValid), 'seed length must be 32');
  });

  it('should generate the same keyPair with which it started', () => {
    const keyPair = new Algo.KeyPair();
    const keys = keyPair.getKeys();
    const mnemonic = keys.prv
      ? Algo.algoUtils.secretKeyToMnemonic(Buffer.from(keys.prv, 'hex'))
      : 'green office boost casino shoe army peace damp mimic this brand economy second sudden credit give coast match brick add good exact brand about neck';
    const seed = Algo.algoUtils.seedFromMnemonic(mnemonic);
    const keyPairAlgo = Algo.algoUtils.keyPairFromSeed(seed);
    const newKeyPair = new Algo.KeyPair({ prv: Buffer.from(keyPairAlgo.sk).toString('hex') });
    should.deepEqual(keyPair, newKeyPair);
  });
});
