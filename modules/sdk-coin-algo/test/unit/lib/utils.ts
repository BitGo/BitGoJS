import assert from 'assert';
import should from 'should';
import algosdk from 'algosdk';
import utils from '../../../src/lib/utils';
import { AlgoLib as Algo } from '../../../src';
import * as AlgoResources from '../../fixtures/resources';

describe('utils', () => {
  const {
    accounts: { account1, account2, account3 },
    base64Txn: { validTxn, invalidTxn, invalidTxn2 },
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
    assert.throws(
      () => Algo.algoUtils.secretKeyToMnemonic(Buffer.from(secretKeyInValid, 'hex')),
      /The secret key: 9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f is invalid/
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
    assert.throws(
      () => Algo.algoUtils.seedFromMnemonic(mnemonicInValid),
      new RegExp('the mnemonic contains a word that is not in the wordlist')
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
      Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f6$', 'hex')
    );
    assert.throws(() => Algo.algoUtils.keyPairFromSeed(seedInValid), /Seed length must be 32/);
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
    assert.throws(
      () => Algo.algoUtils.stellarAddressToAlgoAddress(xlmAddress),
      new RegExp('Neither an Algorand address nor a stellar pubkey')
    );
    assert.throws(
      () => Algo.algoUtils.stellarAddressToAlgoAddress(algoAddress),
      new RegExp('Neither an Algorand address nor a stellar pubkey')
    );
  });

  it('should decode same address', () => {
    const address = algosdk.decodeAddress(account1.address);
    const addressAlgo = Algo.algoUtils.decodeAddress(account1.address);
    should.deepEqual(address, addressAlgo);
  });

  it('should returns error when invalid address', () => {
    const invalidAddress1 = '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QT/';
    const invalidAddress2 = '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTEF';
    assert.throws(() => Algo.algoUtils.decodeAddress(invalidAddress1), /Error: Invalid base32 characters/);
    assert.throws(() => Algo.algoUtils.decodeAddress(invalidAddress2), /Error: address seems to be malformed/);
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

    assert.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), /Error: bad multisig threshold/);
  });

  it('multisigAddress should fail when  threshold is 3', () => {
    const version = 1;
    const threshold = 3;
    const addrs = ['X4GMYVKF6VVNKA4Q4AUSRUYXYCGQSY7DZS7QXVJC33VYQTRUKCU7DDFE2U'];

    assert.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), /Error: bad multisig threshold/);
  });

  it('multisigAddress should fail when  version is 2', () => {
    const version = 2;
    const threshold = 1;
    const addrs = ['25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE'];

    assert.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), /Error: invalid multisig version/);
  });

  it('multisigAddress should fail when  address is not valid', () => {
    const version = 1;
    const threshold = 1;
    const addrs = ['25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QT-'];

    assert.throws(() => Algo.algoUtils.multisigAddress(version, threshold, addrs), /Error: Invalid base32 characters/);
  });

  it('generateAccount should of create a valid addres and valid secretKey', () => {
    const account = Algo.algoUtils.generateAccount();
    const isValid = Algo.algoUtils.isValidAddress(account.addr);
    const isValidSecretKey = Algo.algoUtils.isValidPrivateKey(Buffer.from(account.sk).toString('hex'));
    should.equal(isValid, true);
    should.equal(isValidSecretKey, true);
  });

  it('should validate a valid seed', () => {
    const isValid = Algo.algoUtils.isValidSeed('O52I55AZNYPG266JBZSG33G2RKDKFM7UVEBVWJ25UES7MBGP6BQW6467XU');
    should.equal(isValid, true);
  });

  it('should not validate an invalid seed', () => {
    const isValid = Algo.algoUtils.isValidSeed('O52I55AZNYPG266JBZSG33G2RKDKFM7UVEBVWJ25UES7MBGP6BQW6467X$');
    should.equal(isValid, false);
  });

  it('should not validate a seed with invalid length', () => {
    const isValid = Algo.algoUtils.isValidSeed('O52I55AZNYPG266JBZSG33G2RKDKFM7UVEBVWJ25UES7MBGP6BQW6467XUDSFD');
    should.equal(isValid, false);
  });

  it('should verify a valid signature', () => {
    const pub = Buffer.from([
      23, 105, 203, 242, 76, 245, 135, 179, 225, 133, 67, 83, 51, 23, 208, 60, 11, 107, 219, 137, 211, 13, 249, 236,
      176, 47, 118, 91, 96, 208, 98, 255,
    ]);
    const msg = Buffer.from([
      85, 71, 70, 77, 53, 53, 76, 51, 82, 68, 78, 78, 53, 81, 88, 87, 50, 68, 88, 51, 90, 76, 80, 50, 89, 78, 73, 82,
      71, 72, 87, 50, 85, 73, 69, 89, 84, 54, 84, 85, 75, 71, 79, 68, 68, 67, 72, 66, 50, 79, 77, 78, 81, 70, 87, 55,
      55, 52,
    ]);
    const sign = Buffer.from([
      47, 113, 122, 6, 171, 235, 80, 105, 32, 237, 94, 174, 5, 30, 228, 73, 5, 211, 245, 51, 187, 252, 124, 109, 241,
      174, 203, 34, 132, 41, 101, 197, 42, 134, 251, 76, 91, 92, 118, 112, 235, 111, 208, 234, 163, 203, 149, 160, 233,
      95, 210, 253, 249, 106, 7, 245, 2, 222, 154, 180, 198, 152, 32, 3,
    ]);
    const isValid = Algo.algoUtils.verifySignature(msg, sign, pub);
    should.equal(isValid, true);
  });

  it('should not verify a invalid signature', () => {
    const pub = Buffer.from([
      23, 105, 203, 242, 76, 245, 135, 179, 225, 133, 67, 83, 51, 23, 208, 60, 11, 107, 219, 137, 211, 13, 249, 236,
      176, 47, 118, 91, 96, 208, 98, 255,
    ]);
    const msg = Buffer.from([
      85, 71, 70, 77, 53, 53, 76, 51, 82, 68, 78, 78, 53, 81, 88, 87, 50, 68, 88, 51, 90, 76, 80, 50, 89, 78, 73, 82,
      71, 72, 87, 50, 85, 73, 69, 89, 84, 54, 84, 85, 75, 71, 79, 68, 68, 67, 72, 66, 50, 79, 77, 78, 81, 70, 87, 55,
      55, 52,
    ]);
    const invalidSign = Buffer.from([
      47, 113, 122, 6, 171, 235, 80, 105, 32, 237, 94, 174, 5, 30, 228, 73, 5, 211, 245, 51, 187, 252, 124, 109, 241,
      174, 203, 34, 132, 41, 101, 197, 42, 134, 251, 76, 91, 92, 118, 112, 235, 111, 208, 234, 163, 203, 149, 160, 233,
      95, 210, 253, 249, 106, 7, 245, 2, 222, 154, 180, 198, 150, 45, 6,
    ]);
    const isValid = Algo.algoUtils.verifySignature(msg, invalidSign, pub);
    should.equal(isValid, false);
  });

  it('should not verify a valid signature with invalid public key', () => {
    const invalidPub = Buffer.from([
      23, 105, 203, 242, 76, 245, 135, 179, 225, 133, 67, 83, 51, 23, 208, 60, 11, 107, 219, 137, 211, 13, 249, 236,
      176, 47, 118, 91, 96, 200, 90, 50,
    ]);
    const msg = Buffer.from([
      85, 71, 70, 77, 53, 53, 76, 51, 82, 68, 78, 78, 53, 81, 88, 87, 50, 68, 88, 51, 90, 76, 80, 50, 89, 78, 73, 82,
      71, 72, 87, 50, 85, 73, 69, 89, 84, 54, 84, 85, 75, 71, 79, 68, 68, 67, 72, 66, 50, 79, 77, 78, 81, 70, 87, 55,
      55, 52,
    ]);
    const sign = Buffer.from([
      47, 113, 122, 6, 171, 235, 80, 105, 32, 237, 94, 174, 5, 30, 228, 73, 5, 211, 245, 51, 187, 252, 124, 109, 241,
      174, 203, 34, 132, 41, 101, 197, 42, 134, 251, 76, 91, 92, 118, 112, 235, 111, 208, 234, 163, 203, 149, 160, 233,
      95, 210, 253, 249, 106, 7, 245, 2, 222, 154, 180, 198, 152, 32, 3,
    ]);
    const isValid = Algo.algoUtils.verifySignature(msg, sign, invalidPub);
    should.equal(isValid, false);
  });

  it('should verify a valid signature with invalid message', () => {
    const pub = Buffer.from([
      23, 105, 203, 242, 76, 245, 135, 179, 225, 133, 67, 83, 51, 23, 208, 60, 11, 107, 219, 137, 211, 13, 249, 236,
      176, 47, 118, 91, 96, 208, 98, 255,
    ]);
    const invalidMsg = Buffer.from([
      85, 71, 70, 77, 53, 53, 76, 51, 82, 68, 78, 78, 53, 81, 88, 87, 50, 68, 88, 51, 90, 76, 80, 50, 89, 78, 73, 82,
      71, 72, 87, 50, 85, 73, 69, 89, 84, 54, 84, 85, 75, 71, 79, 68, 68, 67, 72, 66, 50, 79, 77, 78, 81, 70, 87, 50,
      50, 50,
    ]);
    const sign = Buffer.from([
      47, 113, 122, 6, 171, 235, 80, 105, 32, 237, 94, 174, 5, 30, 228, 73, 5, 211, 245, 51, 187, 252, 124, 109, 241,
      174, 203, 34, 132, 41, 101, 197, 42, 134, 251, 76, 91, 92, 118, 112, 235, 111, 208, 234, 163, 203, 149, 160, 233,
      95, 210, 253, 249, 106, 7, 245, 2, 222, 154, 180, 198, 152, 32, 3,
    ]);
    const isValid = Algo.algoUtils.verifySignature(invalidMsg, sign, pub);
    should.equal(isValid, false);
  });

  it('Should be able to get a txID from a multising Tx', () => {
    const rawTxn = validTxn.txn;
    const txId = Algo.algoUtils.getMultisigTxID(rawTxn);

    should.equal(txId, validTxn.txid);
  });

  it('Should not be able to get a txID from an incomplete multising Tx', () => {
    const rawTxn = invalidTxn.txn;

    assert.throws(() => {
      Algo.algoUtils.getMultisigTxID(rawTxn);
    }, 'RangeError: Insufficient data');
  });

  it('Should not be able to get a txID from a simple Tx', () => {
    const rawTxn = invalidTxn2.txn;

    assert.throws(() => {
      Algo.algoUtils.getMultisigTxID(rawTxn);
    }, 'Error: The object contains empty or 0 values. First empty or 0 value encountered during encoding: msig');
  });

  it('Should return enableToken', () => {
    const amount = '0';
    const from = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const to = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const closeRemainderTo = '';

    Algo.algoUtils.getTokenTxType(amount, from, to, closeRemainderTo).should.equal('enableToken');
  });

  it('Should return disableToken', () => {
    const amount = '0';
    const from = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const to = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const closeRemainderTo = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';

    Algo.algoUtils.getTokenTxType(amount, from, to, closeRemainderTo).should.equal('disableToken');
  });

  it('Should return transferToken when "from" and "to" are different ', () => {
    const amount = '0';
    const from = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const to = 'SP745JJR4KPRQEXJZHVIEN736LYTL2T2DFMG3OIIFJBV66K73PHNMDCZVM';
    const closeRemainderTo = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';

    Algo.algoUtils.getTokenTxType(amount, from, to, closeRemainderTo).should.equal('transferToken');
  });

  it('Should return transferToken when amount is not 0', () => {
    const amount = '1000';
    const from = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const to = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';
    const closeRemainderTo = 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA';

    Algo.algoUtils.getTokenTxType(amount, from, to, closeRemainderTo).should.equal('transferToken');
  });
});
