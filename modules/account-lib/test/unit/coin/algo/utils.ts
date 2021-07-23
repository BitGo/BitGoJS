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
    const keyPairAlgo = Algo.algoUtils.keyPairFromSeed(seed);
    const { sk } = algosdk.mnemonicToSecretKey(mnemonic);
    const skOnly = Buffer.from(sk.slice(0, 32)).toString('hex');
    const keyPair = new Algo.KeyPair({ prv: skOnly });
    should.deepEqual(keyPairAlgo, keyPair);
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
    should.deepEqual(keyPair, keyPairAlgo);
  });

  it('stellarAddressToAlgoAddress should convert a XLM address to ALGO address', () => {
    const xlmAddress1 = 'GDV4ZW7UBRSQAHLORJPQF4L6OZJBKU3ZIVS2O6C7WWGSNZOV42JDHPMF';
    const xlmAddress2 = 'GACWEU7LB4D5GGK23BDOAL3D3KWN77Y5FVTH2CTEMY5MC6TQMGGQMZNS';
    const algoAddress1 = '5PGNX5AMMUAB23UKL4BPC7TWKIKVG6KFMWTXQX5VRUTOLVPGSIZSHUA7HU';
    const algoAddress2 = 'AVRFH2YPA7JRSWWYI3QC6Y62VTP76HJNMZ6QUZDGHLAXU4DBRUDEGBSW2U';

    const result1 = Algo.algoUtils.stellarAddressToAlgoAddress(xlmAddress1);
    const result2 = Algo.algoUtils.stellarAddressToAlgoAddress(xlmAddress2);

    should.equal(result1, algoAddress1);
    should.equal(result2, algoAddress2);
  });

  it('stellarAddressToAlgoAddress should not change a valid ALGO address', () => {
    const algoAddress = 'X4GMYVKF6VVNKA4Q4AUSRUYXYCGQSY7DZS7QXVJC33VYQTRUKCU7DDFE2U';
    const result = Algo.algoUtils.stellarAddressToAlgoAddress(algoAddress);

    should.equal(result, algoAddress);
  });

  it('stellarAddressToAlgoAddress should return error if the xlm and algoaddress are invalid', () => {
    const xlmAddress = 'GDV4ZW7UBRSQAHLORJPQF4L6OZJBKU3ZIVS2O6C7WWGSNZOV42JDHPM/';
    const algoAddress = '5PGNX5AMMUAB23UKL4BPC7TWKIKVG6KFMWTXQX5VRUTOLVPGSIZSHUA7H/';
    should.throws(
      () => Algo.algoUtils.stellarAddressToAlgoAddress(xlmAddress),
      'Neither an Algorand address nor a stellar pubkey',
    );
    should.throws(
      () => Algo.algoUtils.stellarAddressToAlgoAddress(algoAddress),
      'Neither an Algorand address nor a stellar pubkey',
    );
  });
});
