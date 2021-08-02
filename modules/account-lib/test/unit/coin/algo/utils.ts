import should from 'should';
import algosdk from 'algosdk';
import utils from '../../../../src/coin/algo/utils';
import { Algo } from '../../../../src';
import * as AlgoResources from '../../../resources/algo';

describe('utils', () => {
  const {
    accounts: { account1, account2, account3 },
    transactions: { payTxn, nonParticipationTxn, keyregTxn },
  } = AlgoResources;

  // TODO: Fix this test
  // it('should properly encode an algorand address from an ed25519 public key', () => {
  //   should.equal(utils.publicKeyToAlgoAddress(account1.pubKey), account1.address);
  //   should.equal(utils.publicKeyToAlgoAddress(account2.pubKey), account2.address);
  //   should.equal(utils.publicKeyToAlgoAddress(account3.pubKey), account3.address);
  // });

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

  it('should build fee data over Pay Txn ,Non Participation Txn and KeyReg Txn', () => {
    const feeRate = 1;
    const feeDataKeyRegTxn = utils.getFeeData(payTxn, feeRate);
    should.equal(feeDataKeyRegTxn.feeInfo.feeRate, 4);
    should.equal(feeDataKeyRegTxn.feeRate, 4);
    should.equal(feeDataKeyRegTxn.feeInfo.fee, 1000);
    should.equal(feeDataKeyRegTxn.feeInfo.size, 240);

    const feeDataNonParticipationTxn = utils.getFeeData(nonParticipationTxn, feeRate);
    should.equal(feeDataNonParticipationTxn.feeInfo.feeRate, 5);
    should.equal(feeDataNonParticipationTxn.feeRate, 5);
    should.equal(feeDataNonParticipationTxn.feeInfo.fee, 1000);
    should.equal(feeDataNonParticipationTxn.feeInfo.size, 207);

    const feeDataKeyregTxn = utils.getFeeData(keyregTxn, feeRate);
    should.equal(feeDataKeyregTxn.feeInfo.feeRate, 3);
    should.equal(feeDataKeyregTxn.feeRate, 3);
    should.equal(feeDataKeyregTxn.feeInfo.fee, 1000);
    should.equal(feeDataKeyregTxn.feeInfo.size, 320);
  });

  it('should build feeData for Keyreg transaction with a high feeRate ', function () {
    const feeRate = 150;
    const feeDataKeyregTxn = utils.getFeeData(keyregTxn, feeRate);
    should.equal(feeDataKeyregTxn.feeInfo.feeRate, 150);
    should.equal(feeDataKeyregTxn.feeRate, 150);
    should.equal(feeDataKeyregTxn.feeInfo.fee, 48000);
    should.equal(feeDataKeyregTxn.feeInfo.size, 320);
  });

  it('should build feeData for Keyreg transaction with 0 as feeRate ', function () {
    const feeRate = 0;
    const feeDataKeyregTxn = utils.getFeeData(keyregTxn, feeRate);
    should.equal(feeDataKeyregTxn.feeInfo.feeRate, 3);
    should.equal(feeDataKeyregTxn.feeRate, 3);
    should.equal(feeDataKeyregTxn.feeInfo.fee, 1000);
    should.equal(feeDataKeyregTxn.feeInfo.size, 320);
  });

  it('should fail building fee info because fee is negative', () => {
    const feeRate = -1;
    should.throws(() => utils.getFeeData(payTxn, feeRate), 'Error: FeeRate must be integer positive number ');
  });

  it('should decode same address', () => {
    const address = algosdk.decodeAddress(account1.address);
    const addressAlgo = Algo.algoUtils.decodeAddress(account1.address);
    should.deepEqual(address, addressAlgo);
  });

  it('should returns error when invalid address', () => {
    const invalidAddress1 = '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QT/';
    const invalidAddress2 = '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTEF';
    should.throws(() => Algo.algoUtils.decodeAddress(invalidAddress1), 'Error: Invalid base32 characters');
    should.throws(() => Algo.algoUtils.decodeAddress(invalidAddress2), 'Error: address seems to be malformed');
  });

  it('multisigAddress should return the same string with accountLib and algosdk', () => {
    const version = 1;
    const threshold = 1;
    const addrs = ['25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE'];

    const accountLibResult = Algo.algoUtils.multisigAddress(version, threshold, addrs);
    const algosdkResult = algosdk.multisigAddress({ version, threshold, addrs });

    should.deepEqual(algosdkResult, accountLibResult);
  });

  it('multisigAddress should fail when threshold is 2', () => {
    const version = 1;
    const threshold = 2;
    const addrs = ['X4GMYVKF6VVNKA4Q4AUSRUYXYCGQSY7DZS7QXVJC33VYQTRUKCU7DDFE2U'];

    should.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), 'Error: bad multisig threshold');
  });

  it('multisigAddress should fail when  threshold is 3', () => {
    const version = 1;
    const threshold = 3;
    const addrs = ['X4GMYVKF6VVNKA4Q4AUSRUYXYCGQSY7DZS7QXVJC33VYQTRUKCU7DDFE2U'];

    should.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), 'Error: bad multisig threshold');
  });

  it('multisigAddress should fail when  version is 2', () => {
    const version = 2;
    const threshold = 1;
    const addrs = ['25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE'];

    should.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), 'Error: invalid multisig version');
  });

  it('multisigAddress should fail when  address is not valid', () => {
    const version = 1;
    const threshold = 1;
    const addrs = ['25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QT-'];

    should.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), 'Error: Invalid base32 characters');
  });
});
