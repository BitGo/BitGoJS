'use strict'
const {
  generatePolynomial,
  secretShares,
  publicShare,
  mergeSecretShares,
  mergePublicShares,
  mergeSignatures,
  sign,
  verify,
} = require('..')

describe('bls-dkg', function() {

  // Threshold.
  const m = 2

  // Number of signers.
  const n = 3

  // Message to be signed.
  const message = 'Hello'

  let userPolynomial, userSecretShares, userPublicShare

  before('generates user polynomials and shares', function() {
    userPolynomial = generatePolynomial(m)
    userSecretShares = secretShares(userPolynomial, n)
    userPublicShare = publicShare(userPolynomial)
  })

  let backupPolynomial, backupSecretShares, backupPublicShare

  before('generates backup polynomial and shares', function() {
    backupPolynomial = generatePolynomial(m)
    backupSecretShares = secretShares(backupPolynomial, n)
    backupPublicShare = publicShare(backupPolynomial)
  })

  let walletPolynomial, walletSecretShares, walletPublicShare

  before('generates wallet polynomial and shares', function() {
    walletPolynomial = generatePolynomial(m)
    walletSecretShares = secretShares(walletPolynomial, n)
    walletPublicShare = publicShare(walletPolynomial)
  })

  let commonPub

  before('combines shares into common public key', function() {
    commonPub = mergePublicShares([userPublicShare, backupPublicShare, walletPublicShare])
  })

  let userKey

  before('combines shares into user signing key', function() {
    userKey = mergeSecretShares([userSecretShares[0], backupSecretShares[0], walletSecretShares[0]])
  })

  let backupKey

  before('combines shares into backup signing key', function() {
    backupKey = mergeSecretShares([userSecretShares[1], backupSecretShares[1], walletSecretShares[1]])
  })

  let walletKey

  before('combines shares into wallet signing key', function() {
    walletKey = mergeSecretShares([userSecretShares[2], backupSecretShares[2], walletSecretShares[2]])
  })

  let userSig

  before('user signs message', async function() {
    userSig = await sign(message, userKey)
  })

  let backupSig

  before('backup signs message', async function() {
    backupSig = await sign(message, backupKey)
  })

  let walletSig

  before('wallet signs message', async function() {
    walletSig = await sign(message, walletKey)
  })

  it('verifies user-backup sig', async function() {
    const userBackupSig = mergeSignatures({
      1: userSig,
      2: backupSig,
    })
    if (!await verify(userBackupSig, message, commonPub)) {
      throw new Error('Could not verify user + backup signature')
    }
  })

  it('verifies user-wallet sig', async function() {
    const userWalletSig = mergeSignatures({
      1: userSig,
      3: walletSig,
    })
    if (!await verify(userWalletSig, message, commonPub)) {
      throw new Error('Could not verify user + wallet signature')
    }
  })

  it('verifies backup-wallet sig', async function() {
    const backupWalletSig = mergeSignatures({
      2: backupSig,
      3: walletSig,
    })
    if (!await verify(backupWalletSig, message, commonPub)) {
      throw new Error('Could not verify backup + wallet signature')
    }
  })

})
