'use strict';
const { randomBytes } = require('crypto');
const {
  generatePolynomial,
  secretShares,
  publicShare,
  mergeSecretShares,
  mergePublicShares,
  mergeSignatures,
  sign,
  verify,
  publicDerive,
  privateDerive,
  mergeChaincodes,
} = require('..');

describe('bls-dkg', function () {
  // Threshold.
  const m = 2;

  // Number of signers.
  const n = 3;

  // Message to be signed.
  const message = 'Hello';

  // Signing sub key path following eip-2334
  const subKeyPath = 'm/12381/3600/0/0/0';

  let userPolynomial, userSecretShares, userPublicShare, userSubKey, userChaincode;

  before('generates user polynomials and shares', function () {
    userPolynomial = generatePolynomial(m);
    userChaincode = BigInt('0x' + randomBytes(32).toString('hex'));
    const userPk = publicShare(userPolynomial);
    userSubKey = privateDerive(userPolynomial[0], userPk, userChaincode, subKeyPath);
    userSecretShares = secretShares([userSubKey.sk, userPolynomial[1]], n);
    userPublicShare = publicShare([userSubKey.sk]);
  });

  let backupPolynomial, backupSecretShares, backupPublicShare, backupChaincode;

  before('generates backup polynomial and shares', function () {
    backupPolynomial = generatePolynomial(m);
    backupSecretShares = secretShares(backupPolynomial, n);
    backupPublicShare = publicShare(backupPolynomial);
    backupChaincode = BigInt('0x' + randomBytes(32).toString('hex'));
  });

  let walletPolynomial, walletSecretShares, walletPublicShare, walletChaincode;

  before('generates wallet polynomial and shares', function () {
    walletPolynomial = generatePolynomial(m);
    walletSecretShares = secretShares(walletPolynomial, n);
    walletPublicShare = publicShare(walletPolynomial);
    walletChaincode = BigInt('0x' + randomBytes(32).toString('hex'));
  });

  let commonPub;

  before('combines shares into common public key', function () {
    commonPub = mergePublicShares([userPublicShare, backupPublicShare, walletPublicShare]);
  });

  let commonChaincode;

  before('combines chaincodes into common chaincode', function () {
    commonChaincode = mergeChaincodes([userChaincode, backupChaincode, walletChaincode]);
  });

  let userKey;

  before('combines shares into user signing key', function () {
    userKey = mergeSecretShares([userSecretShares[0], backupSecretShares[0], walletSecretShares[0]]);
  });

  let backupKey;

  before('combines shares into backup signing key', function () {
    backupKey = mergeSecretShares([userSecretShares[1], backupSecretShares[1], walletSecretShares[1]]);
  });

  let walletKey;

  before('combines shares into wallet signing key', function () {
    walletKey = mergeSecretShares([userSecretShares[2], backupSecretShares[2], walletSecretShares[2]]);
  });

  let userSig;

  before('user signs message', async function () {
    userSig = await sign(message, userKey);
  });

  let backupSig;

  before('backup signs message', async function () {
    backupSig = await sign(message, backupKey);
  });

  let walletSig;

  before('wallet signs message', async function () {
    walletSig = await sign(message, walletKey);
  });

  it('verifies user-backup sig', async function () {
    const userBackupSig = mergeSignatures({
      1: userSig,
      2: backupSig,
    });
    if (!(await verify(userBackupSig, message, commonPub))) {
      throw new Error('Could not verify user + backup signature');
    }
  });

  it('verifies user-wallet sig', async function () {
    const userWalletSig = mergeSignatures({
      1: userSig,
      3: walletSig,
    });
    if (!(await verify(userWalletSig, message, commonPub))) {
      throw new Error('Could not verify user + wallet signature');
    }
  });

  it('verifies backup-wallet sig', async function () {
    const backupWalletSig = mergeSignatures({
      2: backupSig,
      3: walletSig,
    });
    if (!(await verify(backupWalletSig, message, commonPub))) {
      throw new Error('Could not verify backup + wallet signature');
    }
  });

  it('verifies user-backup subkey sig with public derived', async function () {
    const userPublicShareDKG = publicShare(userPolynomial);
    const commonPub = mergePublicShares([userPublicShareDKG, backupPublicShare, walletPublicShare]);
    const derivedUserSk = privateDerive(userPolynomial[0], commonPub, commonChaincode, subKeyPath);
    const derivedUserPublicShare = publicShare([derivedUserSk.sk]);
    const derivedCommonPub1 = mergePublicShares([derivedUserPublicShare, backupPublicShare, walletPublicShare]);
    const derivedCommonPub2 = publicDerive(commonPub, commonChaincode, subKeyPath).pk;
    if (derivedCommonPub1 !== derivedCommonPub2) {
      throw new Error('Common keychain does not match');
    }
    const userSecretShares = secretShares([derivedUserSk.sk, userPolynomial[1]], n);
    const userSubKey = mergeSecretShares([userSecretShares[0], backupSecretShares[0], walletSecretShares[0]]);
    const backupKey = mergeSecretShares([userSecretShares[1], backupSecretShares[1], walletSecretShares[1]]);
    const userSig = await sign(message, userSubKey);
    const backupSig = await sign(message, backupKey);
    const userBackupSig = mergeSignatures({
      1: userSig,
      2: backupSig,
    });

    if (!(await verify(userBackupSig, message, derivedCommonPub1))) {
      throw new Error('Could not verify user + backup signature');
    }
  });
});
